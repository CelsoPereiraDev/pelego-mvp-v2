# Sistema de Atualização de Overall Baseado em Performance

Este documento descreve diferentes abordagens para atualizar dinamicamente o overall dos jogadores com base em sua performance real nas partidas.

## Contexto Atual

O sistema Pelego possui:
- **6 atributos base**: pace, shooting, passing, dribble, defense, physics (0-100)
- **Overall calculado**: média ponderada por posição (ATK, MEI, DEF, GOL)
- **Estatísticas rastreadas**: jogos, vitórias, derrotas, empates, gols, assistências, gols sofridos, pontos

Atualmente o overall é **estático** - definido manualmente na criação do jogador.

---

## Abordagens Sugeridas

### Sumário

| Opção | Nome | Complexidade | Melhor Para |
|-------|------|--------------|-------------|
| 1 | Ajuste Direto por Estatísticas | Baixa | Simplicidade máxima |
| 2 | Pontuação por Posição | Média | Justiça por função |
| 3 | Sistema ELO | Média | Foco em resultado coletivo |
| 4 | Sistema Híbrido | Alta | Análise completa |
| 5 | ELO + Individual | Média-Alta | Equilíbrio time/indivíduo |

---

## Opção 1: Ajuste Direto por Estatísticas

**Conceito**: Cada estatística impacta diretamente o overall.

### Mapeamento

| Estatística | Impacto | Justificativa |
|-------------|---------|---------------|
| Gols marcados | + | Eficiência ofensiva |
| Assistências | + | Visão de jogo |
| % Vitórias | + | Consistência |
| Gols sofridos/jogo | - | Responsabilidade defensiva |
| Participação | + | Disponibilidade |

### Fórmula

```typescript
const goalRate = goals / matches
const leagueAvgGoalRate = totalLeagueGoals / totalLeagueMatches
const adjustment = (goalRate - leagueAvgGoalRate) * 10 // pontos

newOverall = clamp(currentOverall + adjustment, 40, 99)
```

### Exemplo

**Carlos (MEI) - Overall 75**

Período: 8 jogos
- Gols: 4 (média liga: 2.5)
- Assistências: 6 (média liga: 3)
- % Vitórias: 62.5% (média: 50%)

```
Gols acima média: +1.5 pontos
Assistências acima: +2 pontos
Vitórias acima: +1 ponto

Ajuste: +4.5 → Novo Overall: 80
```

### Prós e Contras

| Prós | Contras |
|------|---------|
| Simples de implementar | Pode inflacionar ofensivos |
| Transparente | Não considera contexto do time |
| Fácil de explicar | Parcial para defensores |

---

## Opção 2: Pontuação por Posição

**Conceito**: Métricas com pesos diferentes para cada posição.

### Pesos por Posição

**ATK (Atacante)**
- Gols: 60%
- Assistências: 25%
- % Vitórias: 15%

**MEI (Meio-campo)**
- Assistências: 35%
- Gols: 25%
- % Vitórias: 25%
- Gols sofridos: 15%

**DEF (Defensor)**
- Gols sofridos/jogo: 50%
- % Vitórias: 30%
- Assistências: 10%
- Gols: 10%

**GOL (Goleiro)**
- Gols sofridos/jogo: 70%
- % Vitórias: 30%

### Exemplo - Defensor

**Bruno (DEF) - Overall 72**

Período: 8 jogos
- Gols sofridos/jogo: 0.8 (média: 1.5)
- % Vitórias: 75%
- Assistências: 2
- Gols: 1

```
Gols sofridos (50%): Score 85 → 42.5 pontos
Vitórias (30%): Score 80 → 24 pontos
Assistências (10%): Score 40 → 4 pontos
Gols (10%): Score 30 → 3 pontos

Score final: 73.5/100
Ajuste: (73.5 - 50) × 0.2 = +4.7
Novo Overall: 77
```

### Exemplo - Atacante

**Pedro (ATK) - Overall 78**

Período: 8 jogos
- Gols: 7 (artilheiro)
- Assistências: 3
- % Vitórias: 50%

```
Gols (60%): Score 95 → 57 pontos
Assistências (25%): Score 50 → 12.5 pontos
Vitórias (15%): Score 50 → 7.5 pontos

Score final: 77/100
Ajuste: +5.4 → Novo Overall: 83
```

### Prós e Contras

| Prós | Contras |
|------|---------|
| Justo para cada posição | Mais complexo |
| DEF não precisa fazer gol | Requer definir pesos |
| Métricas relevantes | Ajuste de pesos pode ser subjetivo |

---

## Opção 3: Sistema ELO/Rating Adaptativo

**Conceito**: Similar ao xadrez - ganhar de times fortes vale mais.

### Fórmula ELO

```typescript
// K-factor baseado em experiência
const K = matches < 10 ? 32 : matches < 30 ? 24 : 16

// Expected win rate
const expectedWinRate = 1 / (1 + Math.pow(10, (opponentOverall - teamOverall) / 400))

// Resultado real: 1 = vitória, 0.5 = empate, 0 = derrota
const actualResult = won ? 1 : drawn ? 0.5 : 0

// Mudança de rating
const ratingChange = K * (actualResult - expectedWinRate)
```

### Exemplo

**Lucas (MEI) - Overall 80, K=20**

**Partida 1**: Time Lucas (78) vs Adversário (82)
- Expected: 44%
- Resultado: Vitória
- Mudança: 20 × (1.0 - 0.44) = **+11.2**

**Partida 2**: Time Lucas (78) vs Adversário (70)
- Expected: 61%
- Resultado: Derrota
- Mudança: 20 × (0.0 - 0.61) = **-12.2**

### Prós e Contras

| Prós | Contras |
|------|---------|
| Matematicamente sólido | Ignora contribuição individual |
| Auto-balanceado | Jogador bom pode cair por culpa do time |
| Valoriza vitórias difíceis | Abstrato para jogadores |

---

## Opção 4: Sistema Híbrido

**Conceito**: Combina múltiplos fatores com pesos.

### Componentes

1. **Performance Individual (40%)** - Gols e assists vs média
2. **Contribuição para Vitória (30%)** - % vitórias vs média
3. **Consistência Defensiva (20%)** - Gols sofridos vs média
4. **Participação (10%)** - Frequência de jogos

### Exemplo

**Marcos (MEI) - Overall 76**

Período: 8 jogos
- Gols: 3, Assists: 4
- % Vitórias: 62.5%
- Gols sofridos/jogo: 1.3
- Participação: 80%

```
Individual (40%): Score 62.5 → 25 pontos
Vitórias (30%): Score 75 → 22.5 pontos
Defesa (20%): Score 60 → 12 pontos
Participação (10%): Score 80 → 8 pontos

Performance Index: 67.5/100
Ajuste: (67.5 - 50) × 0.1 = +1.75 ≈ +2
Novo Overall: 78
```

### Penalidade de Inatividade

Jogador com menos de 50% de participação:
- Penalidade: -2 pontos

### Prós e Contras

| Prós | Contras |
|------|---------|
| Mais equilibrado | Complexo de implementar |
| Considera múltiplos aspectos | Muitos parâmetros |
| Penaliza inatividade | Pode parecer "caixa preta" |

---

## Opção 5: ELO + Individual (Recomendada)

**Conceito**: Combina resultado de time (ELO) com contribuição individual.

### Variações

#### 5A: ELO com Multiplicador

ELO amplificado pela contribuição individual.

```typescript
const baseEloChange = K * (actualResult - expectedWinRate)

// Multiplicador: 0.5 a 1.5
const multiplier = 1.0
  + (goals * 0.1)      // +0.1 por gol
  + (assists * 0.05)   // +0.05 por assist
  - (concededPenalty)  // -0.1 se time mais vazado

const finalChange = baseEloChange * multiplier
```

#### 5B: Componentes Separados (60/40)

**60% ELO** + **40% Individual**

```typescript
// Componente ELO (60%)
const eloChange = K * (actualResult - expectedWinRate)

// Componente Individual (40%)
const individualScore = calculatePositionScore(player) // 0-100
const individualChange = (individualScore - 50) * 0.1  // -5 a +5

// Final
const totalChange = (eloChange * 0.6) + (individualChange * 0.4)
```

#### 5C: ELO com Piso/Teto

ELO limitado pela performance individual.

```typescript
const rawEloChange = K * (actualResult - expectedWinRate)
const performance = calculateIndividualPerformance(player)

// Limites por performance
if (performance > 70) {
  // Bom jogador: sobe até +10, cai no máximo -3
  finalChange = clamp(rawEloChange, -3, 10)
} else if (performance < 40) {
  // Jogador fraco: sobe no máximo +3, cai até -10
  finalChange = clamp(rawEloChange, -10, 3)
} else {
  finalChange = clamp(rawEloChange, -7, 7)
}
```

#### 5D: Sistema de Créditos

Média móvel de créditos por partida.

```typescript
const matchCredit = {
  elo: K * (actualResult - expectedWinRate),
  goals: goals * 2,
  assists: assists * 1,
  cleanSheet: isDefender && !conceded ? 3 : 0,
  participation: 1
}

// Overall = média dos últimos 10 créditos
const avgCredit = average(lastNCredits)
newOverall = baseOverall + (avgCredit * scaleFactor)
```

### Exemplo Detalhado - Variação 5B

**Lucas (MEI) - Overall 76**

Período: 8 jogos
- Resultado: 5V, 2E, 1D
- ELO acumulado: +12
- Gols: 4, Assists: 5
- Score individual: 72/100

```
ELO (60%): +12 × 0.6 = +7.2
Individual (40%): (72-50) × 0.1 × 0.4 = +0.88

Total: +8.08 ≈ +8
Novo Overall: 84
```

### Comparativo das Variações

| Variação | Foco | Complexidade | Melhor Para |
|----------|------|--------------|-------------|
| 5A: Multiplicador | ELO amplificado | Média | Quem decide jogos |
| 5B: Componentes | 60/40 equilibrado | Média | **Equilíbrio geral** |
| 5C: Piso/Teto | Proteção | Baixa | Evitar injustiças |
| 5D: Créditos | Média móvel | Alta | Tracking de forma |

---

## Comparativo Geral

| Aspecto | Op.1 | Op.2 | Op.3 | Op.4 | Op.5 |
|---------|------|------|------|------|------|
| Complexidade | Baixa | Média | Média | Alta | Média |
| Justiça por posição | Parcial | Excelente | Não | Boa | Boa |
| Considera individual | Sim | Sim | Não | Sim | Sim |
| Considera time | Parcial | Parcial | Total | Sim | Total |
| Transparência | Alta | Média | Baixa | Média | Média |
| Risco de inflação | Alto | Médio | Baixo | Baixo | Baixo |

---

## Recomendação

### Para Começar
**Opção 5C (ELO com Piso/Teto)** - Simples, protege bons jogadores de times ruins.

### Para Sistema Completo
**Opção 5B (60% ELO + 40% Individual)** - Melhor equilíbrio entre resultado coletivo e contribuição pessoal.

---

## Parâmetros Configuráveis

```typescript
interface OverallUpdateConfig {
  // Período de análise
  periodo: {
    tipo: 'dateRange' | 'lastNWeeks' | 'lastNGames'
    dataInicio?: Date
    dataFim?: Date
    numeroSemanas?: number
    numeroJogos?: number
  }

  // Limites
  maxAdjustment: number          // ex: ±5 pontos
  minGamesToQualify: number      // ex: 3 jogos mínimos

  // Inatividade
  decayForInactivity: boolean
  decayAmount?: number           // ex: -2 pontos

  // Algoritmo
  algorithm: 'direct' | 'byPosition' | 'elo' | 'hybrid' | 'eloIndividual'
}
```

---

## Fluxo de Uso Proposto

1. Admin acessa página de atualização de overall
2. Seleciona período de análise
3. Escolhe algoritmo e parâmetros
4. Clica "Calcular Preview"
5. Sistema mostra tabela com mudanças propostas
6. Admin pode excluir jogadores ou ajustar valores
7. Clica "Aplicar Mudanças"
8. Sistema salva novos overalls

---

## Histórico de Versões

| Data | Versão | Descrição |
|------|--------|-----------|
| 2026-02-02 | 1.0 | Documento inicial com 5 abordagens |
