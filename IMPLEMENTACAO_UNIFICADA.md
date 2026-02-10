# Implementação de Criação Unificada de Semana e Partidas

## 📋 Resumo das Alterações

Este documento descreve a implementação de um fluxo unificado para criação de semanas, times e partidas no Pelego MVP, substituindo o processo anterior de duas etapas por um único formulário integrado.

## 🎯 Objetivos Alcançados

### Backend
1. ✅ **Rota Unificada**: Criada rota `/api/create_week_and_matches` que gerencia todo o processo
2. ✅ **Critérios de Desempate**: Implementados 3 níveis de desempate para determinar campeão semanal
3. ✅ **Atualização de championDates**: Jogadores campeões têm suas datas registradas automaticamente
4. ✅ **Validação de Duplicatas**: Impede criação de múltiplas partidas na mesma week
5. ✅ **Transações Atômicas**: Garante consistência dos dados

### Frontend
1. ✅ **Formulário Único**: Agora há apenas um formulário para toda a operação
2. ✅ **Sistema de Toast**: Implementado com Radix UI para feedback visual
3. ✅ **Estados de Loading**: Indicadores visuais durante o processamento
4. ✅ **Validações**: Validações client-side antes do envio

---

## 🔧 Arquivos Criados

### Backend
- [`back-pelego-mvp/src/routes/create/create_week_and_matches.ts`](back-pelego-mvp/src/routes/create/create_week_and_matches.ts) - Rota principal unificada

### Frontend
- [`front-pelego-mvp/src/components/ui/toast.tsx`](front-pelego-mvp/src/components/ui/toast.tsx) - Componentes de toast do Radix
- [`front-pelego-mvp/src/components/ui/toaster.tsx`](front-pelego-mvp/src/components/ui/toaster.tsx) - Provider de toasts
- [`front-pelego-mvp/src/hooks/use-toast.tsx`](front-pelego-mvp/src/hooks/use-toast.tsx) - Hook para gerenciar toasts
- [`front-pelego-mvp/src/services/matchs/useCreateWeekAndMatches.ts`](front-pelego-mvp/src/services/matchs/useCreateWeekAndMatches.ts) - Hook customizado
- [`front-pelego-mvp/src/app/match/page.tsx`](front-pelego-mvp/src/app/match/page.tsx) - Novo formulário unificado

---

## 📊 Fluxo de Funcionamento

### 1. Frontend - Preenchimento do Formulário

O usuário preenche em um único formulário:
- **Data da semana**
- **Times** (mínimo 2)
  - Seleciona jogadores para cada time
- **Partidas**
  - Seleciona time da casa e visitante (por índice)
  - Preenche gols (quem marcou, quantos)
  - Preenche assistências
  - Marca gols contra se necessário

### 2. Mapeamento de Dados

O frontend mapeia os dados do formulário para o formato da API:

```typescript
{
  date: "2025-11-22T10:00:00",
  teams: [
    ["player1-id", "player2-id"], // Time 1
    ["player3-id", "player4-id"]  // Time 2
  ],
  matches: [
    {
      homeTeamIndex: 0,  // Índice do time
      awayTeamIndex: 1,
      homeGoals: [{ playerId: "player1-id", goals: 2 }],
      awayGoals: [{ ownGoalPlayerId: "player3-id", goals: 1 }],
      homeAssists: [{ playerId: "player2-id", assists: 1 }],
      awayAssists: []
    }
  ]
}
```

### 3. Backend - Processamento

A rota `/api/create_week_and_matches` executa:

#### 3.1. Validações Iniciais
- Verifica se todos os jogadores existem
- Valida mínimo de 2 times e 1 partida
- Verifica índices válidos dos times

#### 3.2. Criação ou Reutilização da Week
```typescript
// Busca week existente na mesma data
const existingWeek = await prisma.week.findFirst({
  where: { date: { gte: startOfDay, lt: endOfDay } }
});

if (existingWeek && hasMatches) {
  throw new Error('Já existem partidas para esta semana');
}
```

#### 3.3. Validação de Partidas Duplicadas
```typescript
const matchPairs = new Set();
for (const match of matches) {
  const pair = `${match.homeTeamIndex}-${match.awayTeamIndex}`;
  if (matchPairs.has(pair)) {
    throw new Error('Partidas duplicadas não permitidas');
  }
}
```

#### 3.4. Criação de Partidas
Cria todas as partidas em paralelo com `Promise.all`:
- Registra gols (normais e contra)
- Registra assistências
- Cria resultado da partida (placar)

#### 3.5. Cálculo de Estatísticas
Para cada time, calcula:
```typescript
{
  points: number,           // Pontos (vitória=3, empate=1)
  matchesPlayed: number,    // Partidas jogadas
  goalsScored: number,      // Gols marcados
  goalsConceded: number,    // Gols sofridos
  goalDifference: number    // Saldo de gols
}
```

#### 3.6. Critérios de Desempate

Se houver empate em pontos, aplica-se:

**1º Critério: Menos partidas jogadas**
```typescript
if (champions.length > 1) {
  const minMatches = Math.min(...champions.map(c => c.matchesPlayed));
  champions = champions.filter(c => c.matchesPlayed === minMatches);
}
```

**2º Critério: Maior saldo de gols**
```typescript
if (champions.length > 1) {
  const maxGoalDiff = Math.max(...champions.map(c => c.goalDifference));
  champions = champions.filter(c => c.goalDifference === maxGoalDiff);
}
```

**3º Critério: Mais gols marcados**
```typescript
if (champions.length > 1) {
  const maxGoalsScored = Math.max(...champions.map(c => c.goalsScored));
  champions = champions.filter(c => c.goalsScored === maxGoalsScored);
}
```

**Resultado**:
- Se restar 1 time: ele é o campeão
- Se restar mais de 1: **não há campeão** (empate técnico)

#### 3.7. Atualização de Jogadores Campeões

Para cada jogador do time campeão:

1. **Atualiza flag `isChampion`**
```typescript
await prisma.player.updateMany({
  where: { id: { in: championPlayerIds } },
  data: { isChampion: true }
});
```

2. **Cria/atualiza MonthIndividualPrizes**
```typescript
const monthStart = new Date(year, month, 1);
let monthPrize = await prisma.monthIndividualPrizes.findFirst({
  where: { playerId, date: monthStart }
});

if (!monthPrize) {
  monthPrize = await prisma.monthIndividualPrizes.create({
    data: { playerId, date: monthStart, championTimes: 1 }
  });
} else {
  await prisma.monthIndividualPrizes.update({
    where: { id: monthPrize.id },
    data: { championTimes: { increment: 1 } }
  });
}
```

3. **Registra ChampionDate**
```typescript
await prisma.championDate.create({
  data: {
    monthIndividualPrizeId: monthPrize.id,
    date: new Date(weekDate)
  }
});
```

### 4. Resposta ao Frontend

```typescript
{
  message: "Semana, times e partidas criados com sucesso",
  week: { id: "week-uuid", date: "2025-11-22" },
  teams: [
    { id: "team1-uuid", points: 3, champion: true, players: [...] }
  ],
  matches: [...],
  championTeamId: "team1-uuid" | null
}
```

### 5. Feedback Visual (Toast)

O frontend exibe:
- ✅ **Sucesso**: Toast verde com informação sobre o campeão
- ❌ **Erro**: Toast vermelho com mensagem de erro específica
- ⏳ **Loading**: Spinner e botão desabilitado durante processamento

---

## 🔒 Validações Implementadas

### Backend
1. ✅ Mínimo de 2 times
2. ✅ Mínimo de 1 partida
3. ✅ Todos os jogadores existem no banco
4. ✅ Índices de times válidos
5. ✅ Não permite partidas duplicadas (mesmo par de times)
6. ✅ Não permite múltiplas semanas com partidas na mesma data

### Frontend
1. ✅ Data obrigatória
2. ✅ Times obrigatórios
3. ✅ Partidas obrigatórias
4. ✅ Validação de dados antes do envio

---

## 🎨 Melhorias de UX

### Sistema de Toast (Radix UI)
- Posicionado no canto superior direito
- Fecha automaticamente após 5 segundos
- Suporta 3 variantes: `default`, `destructive`, `success`
- Permite fechar manualmente

### Estados de Loading
- Botão "Salvar Tudo" mostra spinner durante processamento
- Todos os campos ficam desabilitados durante o submit
- Mensagem clara: "Salvando..."

### Feedback Claro
- Mensagens de erro específicas (ex: "Já existem partidas para esta semana")
- Informação sobre campeão ou empate no sucesso
- Formulário resetado após sucesso

---

## 📁 Estrutura de Dados

### Request Body
```typescript
interface CreateWeekAndMatchesRequest {
  date: string;
  teams: string[][];
  matches: {
    homeTeamIndex: number;
    awayTeamIndex: number;
    homeGoals: { playerId?: string; ownGoalPlayerId?: string; goals: number }[];
    awayGoals: { playerId?: string; ownGoalPlayerId?: string; goals: number }[];
    homeAssists: { playerId: string; assists: number }[];
    awayAssists: { playerId: string; assists: number }[];
  }[];
}
```

### Response Body
```typescript
interface CreateWeekAndMatchesResponse {
  message: string;
  week: { id: string; date: string };
  teams: { id: string; points: number; champion: boolean; players: string[] }[];
  matches: { id: string; homeTeamId: string; awayTeamId: string; result: MatchResultResponse }[];
  championTeamId: string | null;
}
```

---

## 🧪 Como Testar

### 1. Iniciar Backend
```bash
cd back-pelego-mvp
npm run dev
```

### 2. Iniciar Frontend
```bash
cd front-pelego-mvp
npm run dev
```

### 3. Acessar
Navegue para `http://localhost:3000/match`

### 4. Cenários de Teste

#### ✅ Caso de Sucesso
1. Selecionar data
2. Criar 2 times com jogadores
3. Criar 1+ partidas com resultados
4. Clicar em "Salvar Tudo"
5. Ver toast de sucesso

#### ⚠️ Validação de Duplicata
1. Criar semana e partidas
2. Tentar criar novamente na mesma data
3. Ver erro: "Já existem partidas cadastradas para esta semana"

#### 🏆 Teste de Desempate
1. Criar 3 times
2. Time A: 1 vitória (3 pontos)
3. Time B: 1 vitória (3 pontos) em 2 partidas
4. Time C: 1 empate (1 ponto)
5. Resultado: Time A campeão (menos partidas jogadas)

---

## 🔄 Migração do Código Antigo

O código antigo foi preservado em:
- [`front-pelego-mvp/src/app/match/page-old.tsx`](front-pelego-mvp/src/app/match/page-old.tsx)

Para reverter (se necessário):
```bash
cd front-pelego-mvp/src/app/match
mv page.tsx page-new.tsx
mv page-old.tsx page.tsx
```

---

## 📦 Dependências Adicionadas

```json
{
  "@radix-ui/react-toast": "^1.x.x"
}
```

---

## 🚀 Próximas Melhorias Sugeridas

1. **Validação de horário**: Impedir criação de semanas com datas passadas
2. **Edição de semanas**: Permitir editar partidas já criadas
3. **Preview**: Mostrar prévia dos times e partidas antes de salvar
4. **Histórico**: Log de alterações em semanas
5. **Exportação**: Gerar relatório PDF da semana

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- [CLAUDE.md](CLAUDE.md) - Documentação geral do projeto
- [front-pelego-mvp/CLAUDE.md](front-pelego-mvp/CLAUDE.md) - Documentação específica do frontend
- [back-pelego-mvp/CLAUDE.md](back-pelego-mvp/CLAUDE.md) - Documentação específica do backend

---

**Data de Implementação**: 2025-11-22
**Versão**: 1.0.0
