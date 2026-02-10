# Week Preview Component - Resumo Visual

**Componente:** `WeekPreview`
**Propósito:** Mostrar estatísticas da semana em tempo real conforme usuário preenche as partidas
**Atualização:** Automática via `useWatch` + debounce (300ms)

---

## 📊 Dados Exibidos

### 1. **Classificação dos Times** 🏆

Mostra todos os times ordenados por pontuação (3 pts vitória, 1 pt empate):

```
1º [Time 1] 🏆              9 pts
2º [Time 2]                 6 pts
3º [Time 3]                 3 pts
4º [Time 4]                 0 pts
```

**Features:**
- ✅ Troféu dourado para líder(es)
- ✅ Badge destacado para time(s) em 1º
- ✅ Indicação de empate: "Empate na liderança (2 times)"
- ✅ Ordenação automática por pontos

---

### 2. **Artilheiro da Semana** 🎯

Mostra o jogador com mais gols:

```
┌──────────────────────────────────┐
│ [●] Jogador A        5 gols     │
│     Artilheiro                   │
└──────────────────────────────────┘
```

**States:**
- ✅ Com gols: Nome + quantidade com badge verde
- ✅ Sem gols: "Nenhum gol marcado ainda"

---

### 3. **Maior Assistente** 📈

Mostra o jogador com mais assistências:

```
┌──────────────────────────────────┐
│ [●] Jogador B        3 assist.  │
│     Assistente                   │
└──────────────────────────────────┘
```

**States:**
- ✅ Com assistências: Nome + quantidade com badge azul
- ✅ Sem assistências: "Nenhuma assistência registrada"

---

### 4. **Gols Contra** ⚠️ (Condicional)

**Só aparece se houver gols contra (GC > 0)**

```
┌──────────────────────────────────┐
│ [!] Gols Contra      2 GC       │
│     Total na semana              │
└──────────────────────────────────┘
```

**Features:**
- ✅ Badge vermelho com ícone de alerta
- ✅ Background destrutivo (vermelho claro)
- ✅ Só renderiza quando `totalOwnGoals > 0`

---

### 5. **Resumo Estatístico** 📊

Grid com 3 métricas principais:

```
┌──────┬──────┬──────┐
│  6   │  18  │ 3.0  │
│Partidas│Gols│Média │
└──────┴──────┴──────┘
```

**Métricas:**
- **Partidas:** Total de jogos adicionados
- **Gols:** Soma de todos os gols (normais + GC)
- **Média:** Gols por partida (com 1 casa decimal)

---

## 🎨 Design Visual

### Cores e Badges

```typescript
// Classificação
Badge líder: variant="default" (primary)
Badge outros: variant="secondary"
Troféu: text-yellow-500

// Artilheiro
Badge: variant="goal" (verde)
Ícone: Target (verde)

// Assistente
Badge: variant="assist" (azul)
Ícone: TrendingUp (azul)

// Gols Contra
Badge: variant="ownGoal" (vermelho)
Ícone: AlertTriangle (vermelho)
Background: bg-destructive/5
```

### Layout Responsivo

**Desktop (≥1024px):**
```
┌─────────────────────┬─────────────┐
│                     │   Preview   │
│   Form Principal    │   Sidebar   │
│                     │   (sticky)  │
│                     │             │
└─────────────────────┴─────────────┘
```

**Mobile (<1024px):**
```
┌─────────────────────┐
│   Form Principal    │
├─────────────────────┤
│   Preview           │
│   (acima do botão)  │
├─────────────────────┤
│   [Salvar]          │
└─────────────────────┘
```

---

## ⚡ Performance

### Otimizações Implementadas

**1. Debounce (300ms)**
```typescript
const useDebouncedMatches = (matches: any[], delay = 300) => {
  // Aguarda 300ms de inatividade antes de recalcular
};
```

**2. Memoização**
```typescript
const statistics = useMemo(() => {
  // Só recalcula quando matches mudam
}, [debouncedMatches, teams]);
```

**3. Early Return**
```typescript
if (!matches || matches.length === 0) {
  return <EmptyState />;
}
```

**Resultado:**
- Sem lag durante digitação
- Atualização suave
- CPU baixa (cálculo só quando necessário)

---

## 🔄 Fluxo de Atualização

```
Usuário preenche gol
       ↓
useWatch detecta mudança
       ↓
Debounce (300ms)
       ↓
useMemo recalcula estatísticas
       ↓
Re-render do WeekPreview
       ↓
Badges/números atualizados
```

**Tempo total:** ~300-350ms após parar de digitar

---

## 📱 Posicionamento

### Opção 1: Sidebar Fixa (Recomendado para Desktop)

**Vantagens:**
- ✅ Sempre visível
- ✅ Não interfere no scroll do form
- ✅ Melhor para telas grandes

**Implementação:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
  <FormSection />
  <div className="hidden lg:block">
    <div className="sticky top-6">
      <WeekPreview />
    </div>
  </div>
</div>
```

### Opção 2: Collapsible (Mobile-Friendly)

**Vantagens:**
- ✅ Economiza espaço vertical
- ✅ Usuário escolhe quando ver
- ✅ Melhor para mobile

**Implementação:**
```tsx
<Collapsible defaultOpen>
  <CollapsibleTrigger>
    🏆 Preview da Semana
  </CollapsibleTrigger>
  <CollapsibleContent>
    <WeekPreview />
  </CollapsibleContent>
</Collapsible>
```

---

## 🎯 Estados do Componente

### 1. Vazio (sem partidas)

```
┌────────────────────────────┐
│          🏆                │
│                            │
│  Adicione partidas para   │
│  ver o preview             │
└────────────────────────────┘
```

### 2. Parcial (partidas sem gols)

```
🏆 Preview da Semana
─────────────────────
🏅 Classificação
  1º [Time 1]  0 pts
  2º [Time 2]  0 pts

🎯 Artilheiro da Semana
  Nenhum gol marcado ainda

📈 Maior Assistente
  Nenhuma assistência registrada

6 Partidas | 0 Gols | 0.0 Média
```

### 3. Completo (com todos os dados)

```
🏆 Preview da Semana
─────────────────────
🏅 Classificação
  1º [Time 1] 🏆  9 pts
  2º [Time 2]     6 pts

🎯 Artilheiro da Semana
  Jogador A - 5 gols

📈 Maior Assistente
  Jogador B - 3 assist.

⚠️  Gols Contra
  2 GC total

6 Partidas | 18 Gols | 3.0 Média
```

---

## 🧮 Lógica de Cálculo

### Pontos dos Times

```typescript
if (homeScore > awayScore) {
  teamPoints[homeTeamIdx] += 3; // Vitória casa
} else if (awayScore > homeScore) {
  teamPoints[awayTeamIdx] += 3; // Vitória visitante
} else if (homeScore === awayScore && homeScore > 0) {
  teamPoints[homeTeamIdx] += 1; // Empate
  teamPoints[awayTeamIdx] += 1;
}
// Empate 0x0 não dá pontos
```

### Contagem de Gols

```typescript
match.homeGoals?.whoScores?.forEach(goal => {
  if (goal.playerId === 'GC') {
    totalOwnGoals += goal.goals;
  } else {
    playerGoals[goal.playerId] += goal.goals;
  }
});
```

### Top Scorer/Assister

```typescript
let topScorer: { playerId: string; goals: number } | null = null;

Object.entries(playerGoals).forEach(([playerId, goals]) => {
  if (!topScorer || goals > topScorer.goals) {
    topScorer = { playerId, goals };
  }
});
```

**Critério de desempate:** Primeiro jogador encontrado (ordem de adição)

---

## ✅ Checklist de Implementação

- [ ] Criar componente `WeekPreview.tsx`
- [ ] Adicionar hook `useDebouncedMatches`
- [ ] Implementar lógica de cálculo de pontos
- [ ] Implementar contagem de gols/assistências
- [ ] Criar variantes de Badge (goal, assist, ownGoal)
- [ ] Adicionar token de cor `--assist-indicator`
- [ ] Integrar no layout principal (sidebar ou collapsible)
- [ ] Testar em mobile e desktop
- [ ] Validar performance com 10+ partidas
- [ ] Adicionar testes unitários para cálculo de estatísticas

---

## 🎨 Exemplo de Integração

```tsx
// WeekAndMatchesForm.tsx
export const WeekAndMatchesForm = () => {
  const form = useWeekForm();
  const { control } = form;
  const { players } = usePlayers();

  const teamFields = useWatch({ control, name: 'teams' });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      {/* Main Form */}
      <div className="space-y-6">
        <WeekDateHeader control={control} />
        <TeamsSection control={control} />
        <MatchesSection control={control} />

        {/* Mobile Preview (above button) */}
        <div className="lg:hidden">
          <WeekPreview
            control={control}
            teams={teamFields}
            players={players || []}
          />
        </div>

        <FormFooter />
      </div>

      {/* Desktop Sidebar Preview */}
      <div className="hidden lg:block">
        <div className="sticky top-6">
          <WeekPreview
            control={control}
            teams={teamFields}
            players={players || []}
          />
        </div>
      </div>
    </div>
  );
};
```

---

## 🚀 Benefícios para o Usuário

1. **Feedback Imediato** - Vê o impacto dos dados em tempo real
2. **Prevenção de Erros** - Detecta inconsistências (ex: time sem pontos quando deveria ter)
3. **Motivação** - Acompanha a "história" da semana enquanto cria
4. **Validação Visual** - Confirma que os dados estão corretos antes de salvar
5. **Descoberta** - Identifica artilheiro/assistente automaticamente

---

**Documento criado:** December 22, 2024
**Status:** Pronto para implementação
