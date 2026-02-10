# Documentação: Deleção Completa de Semana

## 📋 Visão Geral

A função de deleção de semana (`DELETE /api/weeks/:weekId`) foi completamente reescrita para garantir a **remoção completa de todos os vestígios** da semana, incluindo reversão de estatísticas de jogadores campeões.

## 🎯 Objetivo

Quando uma semana é deletada, **todos** os dados relacionados devem ser removidos como se a semana nunca tivesse existido:

- ✅ Partidas e seus resultados
- ✅ Gols e assistências
- ✅ Times e relação jogadores-times
- ✅ **ChampionDates** dos jogadores campeões
- ✅ **championTimes** decrementado no MonthIndividualPrizes
- ✅ **isChampion** resetado se o jogador não for mais campeão em nenhuma outra semana
- ✅ A própria Week

## 🔄 Fluxo de Execução

### Arquivo
[`back-pelego-mvp/src/routes/delete/delete_week.ts`](back-pelego-mvp/src/routes/delete/delete_week.ts)

### Endpoint
```
DELETE /api/weeks/:weekId
```

### Parâmetros
- `weekId` (string) - UUID da semana a ser deletada

---

## 📊 Processo de Deleção (12 Etapas)

### **Etapa 1: Verificação de Existência**
```typescript
const week = await prisma.week.findUnique({
  where: { id: weekId },
  include: {
    teams: {
      include: {
        players: { include: { player: true } },
        matchesHome: true,
        matchesAway: true
      }
    }
  }
});

if (!week) {
  return reply.status(404).send({ error: 'Semana não encontrada' });
}
```

**Por quê?**
- Valida que a semana existe
- Carrega todos os dados relacionados para análise posterior
- Evita erros em cascata

---

### **Etapa 2: Identificação de Jogadores**
```typescript
const allPlayerIds = week.teams.flatMap(team =>
  team.players.map(p => p.playerId)
);

const championTeam = week.teams.find(team => team.champion);
const championPlayerIds = championTeam
  ? championTeam.players.map(p => p.playerId)
  : [];
```

**O que identifica?**
- `allPlayerIds`: Todos os jogadores que participaram da semana
- `championPlayerIds`: Apenas os jogadores do time campeão (se houver)

**Por quê?**
- Precisamos saber quem foi campeão para reverter estatísticas
- Precisamos verificar se esses jogadores ainda são campeões em outras semanas

---

### **Etapa 3: Determinação do Mês**
```typescript
const weekDate = new Date(week.date);
const monthStart = new Date(weekDate.getFullYear(), weekDate.getMonth(), 1);
```

**Por quê?**
- `MonthIndividualPrizes` agrupa dados por mês
- Precisamos encontrar o registro correto para decrementar `championTimes`

---

### **Etapa 4: Remoção de ChampionDates** ⭐
```typescript
if (championPlayerIds.length > 0) {
  const monthPrizes = await tx.monthIndividualPrizes.findMany({
    where: {
      playerId: { in: championPlayerIds },
      date: monthStart
    },
    include: { championDates: true }
  });

  for (const monthPrize of monthPrizes) {
    // Remover ChampionDate desta semana
    await tx.championDate.deleteMany({
      where: {
        monthIndividualPrizeId: monthPrize.id,
        date: week.date
      }
    });

    // Decrementar championTimes
    const newChampionTimes = Math.max(0, monthPrize.championTimes - 1);

    if (newChampionTimes === 0) {
      // Se não tem mais campeonatos, deletar registro
      await tx.monthIndividualPrizes.delete({
        where: { id: monthPrize.id }
      });
    } else {
      // Apenas decrementar
      await tx.monthIndividualPrizes.update({
        where: { id: monthPrize.id },
        data: { championTimes: newChampionTimes }
      });
    }
  }
}
```

**O que faz?**
1. Busca `MonthIndividualPrizes` dos jogadores campeões
2. Remove o `ChampionDate` específico da semana deletada
3. Decrementa `championTimes` em 1
4. Se `championTimes` chegar a 0, deleta o `MonthIndividualPrizes` inteiro

**Por quê é crítico?**
- Remove completamente o vestígio do campeonato da semana
- Mantém a contagem correta de campeonatos mensais
- Limpa registros vazios do banco

---

### **Etapa 5: Reset do Flag `isChampion`** ⭐⭐
```typescript
if (allPlayerIds.length > 0) {
  // Buscar outras weeks onde esses jogadores são campeões
  const otherChampionTeams = await tx.team.findMany({
    where: {
      weekId: { not: weekId }, // Excluir a semana sendo deletada
      champion: true,
      players: {
        some: { playerId: { in: allPlayerIds } }
      }
    },
    include: { players: true }
  });

  // IDs de jogadores que ainda são campeões em outras semanas
  const stillChampionIds = new Set(
    otherChampionTeams.flatMap(team => team.players.map(p => p.playerId))
  );

  // Jogadores que NÃO são mais campeões
  const noLongerChampionIds = allPlayerIds.filter(
    id => !stillChampionIds.has(id)
  );

  if (noLongerChampionIds.length > 0) {
    await tx.player.updateMany({
      where: { id: { in: noLongerChampionIds } },
      data: { isChampion: false }
    });
  }
}
```

**Lógica Inteligente:**
1. Verifica se os jogadores ainda são campeões em **outras semanas**
2. Se não forem, reseta `isChampion` para `false`
3. Se ainda forem campeões em outras semanas, **mantém** `isChampion = true`

**Exemplo:**
- Semana 1: João é campeão ✅
- Semana 2: João é campeão ✅
- **Deletar Semana 1**: João continua com `isChampion = true` (pois ainda é campeão na Semana 2)
- **Deletar Semana 2**: João agora fica com `isChampion = false` (não é mais campeão em nenhuma semana)

---

### **Etapas 6-9: Deleção em Cascata de Dados de Partida**
```typescript
// 6. Deletar Assists
await tx.assist.deleteMany({
  where: {
    match: {
      OR: [
        { homeTeam: { weekId } },
        { awayTeam: { weekId } }
      ]
    }
  }
});

// 7. Deletar Goals
await tx.goal.deleteMany({
  where: {
    match: {
      OR: [
        { homeTeam: { weekId } },
        { awayTeam: { weekId } }
      ]
    }
  }
});

// 8. Deletar MatchResults
await tx.matchResult.deleteMany({
  where: {
    match: {
      OR: [
        { homeTeam: { weekId } },
        { awayTeam: { weekId } }
      ]
    }
  }
});

// 9. Deletar Matches
await tx.match.deleteMany({
  where: {
    OR: [
      { homeTeam: { weekId } },
      { awayTeam: { weekId } }
    ]
  }
});
```

**Por quê essa ordem?**
- Assistências e Gols dependem de Matches
- MatchResults dependem de Matches
- Matches dependem de Teams
- **Ordem correta evita erros de foreign key**

---

### **Etapas 10-11: Deleção de Times e Relações**
```typescript
// 10. Deletar TeamMembers (relação N-N)
await tx.teamMember.deleteMany({
  where: { team: { weekId } }
});

// 11. Deletar Teams
await tx.team.deleteMany({
  where: { weekId }
});
```

**Por quê?**
- `TeamMember` é a tabela intermediária entre Players e Teams
- Deve ser deletada **antes** dos Teams (foreign key)

---

### **Etapa 12: Deleção da Week**
```typescript
// 12. Deletar a Week
await tx.week.delete({
  where: { id: weekId }
});
```

**Por quê por último?**
- Todas as foreign keys já foram removidas
- Não há mais nada apontando para esta Week

---

## 🔒 Transação Atômica

**TODO o processo acontece dentro de uma transação:**
```typescript
await prisma.$transaction(async (tx) => {
  // ... todas as 12 etapas ...
});
```

**Garantias:**
- ✅ **Atomicidade**: Tudo acontece ou nada acontece
- ✅ **Consistência**: Banco nunca fica em estado inconsistente
- ✅ **Isolamento**: Outras requisições não veem estado intermediário
- ✅ **Rollback automático**: Se qualquer etapa falhar, tudo é revertido

---

## 📤 Resposta da API

### **Sucesso (200)**
```json
{
  "message": "Semana deletada com sucesso. Todos os dados relacionados foram removidos.",
  "deletedWeekId": "uuid-da-semana",
  "deletedWeekDate": "2025-11-22T10:00:00.000Z",
  "championPlayersAffected": 5,
  "totalPlayersAffected": 10
}
```

### **Erro 404**
```json
{
  "error": "Semana não encontrada"
}
```

### **Erro 500**
```json
{
  "error": "Erro ao deletar semana",
  "details": "Mensagem de erro específica"
}
```

---

## 🧪 Cenários de Teste

### **Teste 1: Deleção de Semana com Campeão Único**
**Setup:**
1. Criar Week com 2 times
2. Criar 1 partida (Time A vence)
3. Time A é campeão

**Executar:**
```bash
DELETE /api/weeks/{weekId}
```

**Verificar:**
- ✅ Week deletada
- ✅ Teams deletados
- ✅ Match deletada
- ✅ Goals deletados
- ✅ ChampionDate removido
- ✅ championTimes decrementado (ou MonthIndividualPrizes deletado)
- ✅ Jogadores do Time A têm `isChampion = false`

---

### **Teste 2: Deleção de Semana sem Campeão (Empate)**
**Setup:**
1. Criar Week com 3 times
2. Todos empatam em pontos e critérios de desempate
3. Nenhum campeão definido

**Executar:**
```bash
DELETE /api/weeks/{weekId}
```

**Verificar:**
- ✅ Week deletada
- ✅ Nenhum ChampionDate foi criado (então nada para remover)
- ✅ Todos os outros dados removidos normalmente

---

### **Teste 3: Jogador Campeão em Múltiplas Semanas**
**Setup:**
1. Criar Week 1 (João é campeão)
2. Criar Week 2 (João é campeão novamente)

**Executar:**
```bash
DELETE /api/weeks/{week1Id}
```

**Verificar:**
- ✅ Week 1 deletada
- ✅ ChampionDate da Week 1 removido
- ✅ championTimes decrementado de 2 para 1
- ✅ João **ainda tem** `isChampion = true` (pois é campeão na Week 2)

**Depois executar:**
```bash
DELETE /api/weeks/{week2Id}
```

**Verificar:**
- ✅ Week 2 deletada
- ✅ ChampionDate da Week 2 removido
- ✅ championTimes decrementado de 1 para 0
- ✅ MonthIndividualPrizes deletado (pois championTimes = 0)
- ✅ João agora tem `isChampion = false`

---

### **Teste 4: Verificação de Integridade Referencial**
**Setup:**
1. Criar Week complexa com 4 times, 6 partidas, múltiplos gols e assistências

**Executar:**
```bash
DELETE /api/weeks/{weekId}
```

**Verificar no banco:**
```sql
-- Nenhum resultado deve ser retornado
SELECT * FROM "Week" WHERE id = '{weekId}';
SELECT * FROM "Team" WHERE weekId = '{weekId}';
SELECT * FROM "Match" WHERE homeTeamId IN (SELECT id FROM "Team" WHERE weekId = '{weekId}');
SELECT * FROM "Goal" WHERE matchId IN (...);
SELECT * FROM "Assist" WHERE matchId IN (...);
SELECT * FROM "ChampionDate" WHERE date = '{weekDate}';
```

---

## ⚠️ Considerações Importantes

### **1. Operação Irreversível**
- A deleção é **permanente**
- Não há sistema de "lixeira" ou backup automático
- Considere implementar confirmação no frontend

### **2. Performance**
- Para weeks com muitas partidas, a operação pode demorar alguns segundos
- A transação bloqueia tabelas relacionadas
- Considere adicionar timeout maior se necessário

### **3. Logs**
- Todos os erros são logados no console com `console.error`
- Considere adicionar log de auditoria para rastreamento

### **4. Validações Futuras Sugeridas**
```typescript
// Impedir deleção de semanas antigas (ex: > 30 dias)
const daysSinceWeek = (Date.now() - week.date.getTime()) / (1000 * 60 * 60 * 24);
if (daysSinceWeek > 30) {
  return reply.status(403).send({
    error: 'Não é permitido deletar semanas com mais de 30 dias'
  });
}
```

---

## 🔗 Integração com Frontend

### **Exemplo de Chamada**
```typescript
// frontend/src/services/weeks/resources.ts
export async function deleteWeek(weekId: string) {
  const response = await fetch(`${BASE_URL}/weeks/${weekId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao deletar semana');
  }

  return await response.json();
}
```

### **Com Toast de Feedback**
```typescript
import { toast } from '@/hooks/use-toast';

const handleDeleteWeek = async (weekId: string) => {
  try {
    const result = await deleteWeek(weekId);

    toast({
      variant: 'success',
      title: 'Semana deletada!',
      description: `${result.totalPlayersAffected} jogadores afetados. ${result.championPlayersAffected} campeões revertidos.`
    });
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Erro ao deletar',
      description: error.message
    });
  }
};
```

---

## 📊 Diagrama de Deleção

```
┌─────────────────────────────────────────────────────┐
│           DELETE /api/weeks/:weekId                 │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────┐
         │  1. Buscar Week e Times   │
         └───────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────┐
         │  2. Identificar Campeões  │
         └───────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────┐
         │   INICIAR TRANSAÇÃO ⚡    │
         └───────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                  │
        ▼                                  ▼
┌─────────────────┐            ┌─────────────────────┐
│ Remover         │            │  Deletar dados de   │
│ ChampionDates   │            │  partidas:          │
│ Decrementar     │            │  • Assists          │
│ championTimes   │            │  • Goals            │
└─────────────────┘            │  • MatchResults     │
        │                      │  • Matches          │
        │                      └─────────────────────┘
        │                                  │
        ▼                                  │
┌─────────────────┐                       │
│ Reset           │                       │
│ isChampion      │                       │
│ (se necessário) │                       │
└─────────────────┘                       │
        │                                  │
        └────────────────┬─────────────────┘
                         │
                         ▼
         ┌───────────────────────────┐
         │  Deletar TeamMembers      │
         └───────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────┐
         │  Deletar Teams            │
         └───────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────┐
         │  Deletar Week             │
         └───────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────┐
         │   COMMIT TRANSAÇÃO ✅     │
         └───────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────┐
         │  Retornar Sucesso         │
         └───────────────────────────┘
```

---

## 📚 Referências

- **Arquivo principal**: [`back-pelego-mvp/src/routes/delete/delete_week.ts`](back-pelego-mvp/src/routes/delete/delete_week.ts)
- **Schema Prisma**: [`back-pelego-mvp/prisma/schema.prisma`](back-pelego-mvp/prisma/schema.prisma)
- **Documentação de criação**: [`IMPLEMENTACAO_UNIFICADA.md`](IMPLEMENTACAO_UNIFICADA.md)

---

**Data de Implementação**: 2025-11-22
**Versão**: 2.0.0 (Reescrita completa)
