# 🔄 Guia de Migração - Pelego Football Design System

Guia para migrar componentes existentes para o novo design system temático de futebol.

---

## 📋 Visão Geral

O Pelego MVP foi atualizado com um design system completo inspirado em futebol, incluindo:

✅ Novos tokens de cor (verde campo, ouro troféu, cores de estádio)
✅ Variantes temáticas para Button e Card
✅ Novos componentes: Badge, StatsCard, TrophyBadge
✅ Animações e microinterações
✅ Utilities CSS customizadas
✅ Dark mode "Night Stadium"
✅ Acessibilidade WCAG 2.1 AA

---

## 🚀 Compatibilidade

### ✅ O que NÃO quebrou

- **PlayerCard e PlayerCardSmall**: Funcionam exatamente como antes, apenas com melhorias visuais sutis (sombras e hover)
- **Todos os componentes existentes**: Continuam funcionando normalmente
- **Rotas e navegação**: Sem mudanças
- **API e serviços**: Sem mudanças
- **Mappers e utils**: Sem mudanças

### 🎨 O que mudou

1. **Cores do tema**: De roxo para verde (campo de futebol)
2. **Componentes UI base**: Button e Card ganharam novas variantes
3. **Novos componentes**: Badge, StatsCard, TrophyBadge
4. **Utilities CSS**: Novas classes temáticas disponíveis

---

## 🔧 Migrações Recomendadas

### 1. Botões

#### Antes (ainda funciona):
```tsx
<Button>Criar Partida</Button>
```

#### Depois (recomendado):
```tsx
// Para ações principais de futebol
<Button variant="pitch">Criar Partida</Button>

// Para prêmios/conquistas
<Button variant="gold">Ver Troféus</Button>

// Para ações secundárias
<Button variant="stadium">Ver Detalhes</Button>
```

**Quando migrar**: Ao editar páginas de partidas, estatísticas, ou criar novos botões.

---

### 2. Cards

#### Antes (ainda funciona):
```tsx
<Card>
  <CardHeader>
    <CardTitle>Estatísticas</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

#### Depois (recomendado):
```tsx
// Para estatísticas (hover animado)
<Card variant="stat">
  <CardHeader>
    <CardTitle>Estatísticas</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// Para destaque dourado
<Card variant="gold">
  <CardHeader>
    <CardTitle>Artilheiro do Mês</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// Para informações gerais com glass effect
<Card variant="stadium">
  <CardHeader>
    <CardTitle>Informações</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

**Quando migrar**: Ao refatorar páginas de estatísticas, rankings, e dashboards.

---

### 3. Exibir Estatísticas

#### Antes:
```tsx
<div className="flex flex-col gap-2">
  <span className="text-sm">Total de Gols</span>
  <span className="text-3xl font-bold">{totalGoals}</span>
</div>
```

#### Depois (MUITO melhor):
```tsx
import StatsCard from "@/components/StatsCard"
import { Trophy } from "lucide-react"

<StatsCard
  title="Total de Gols"
  value={totalGoals}
  subtitle="Na temporada 2024"
  icon={Trophy}
  variant="pitch"
  trend="up"
  trendValue="+12"
/>
```

**Benefícios**:
- Design consistente
- Animações automáticas
- Suporte a ícones
- Indicadores de tendência
- Responsivo

**Quando migrar**: PRIORIDADE ALTA - Usar em todas as páginas de estatísticas.

---

### 4. Badges/Tags

#### Antes:
```tsx
<span className="px-2 py-1 bg-green-500 text-white rounded">
  MVP
</span>
```

#### Depois:
```tsx
import { Badge } from "@/components/ui/badge"

// Para conquistas
<Badge variant="mvp">MVP</Badge>

// Para gols
<Badge variant="goal">{goals}</Badge>

// Para assistências
<Badge variant="assist">{assists}</Badge>

// Para estatísticas gerais
<Badge variant="stat">Top 5</Badge>
```

**Quando migrar**: Ao exibir tags, conquistas, ou contadores.

---

### 5. Troféus e Prêmios

#### Antes:
```tsx
<div className="bg-yellow-400 px-4 py-2 rounded-lg">
  <span>🏆 Artilheiro</span>
</div>
```

#### Depois:
```tsx
import TrophyBadge, { TrophyIcon } from "@/components/TrophyBadge"

<TrophyBadge
  tier="legend"
  label="Artilheiro"
  icon={<TrophyIcon />}
  size="md"
  animated={true}
/>

// Ou para ranking
<TrophyBadge tier="legend" label="1º" size="sm" /> // Ouro
<TrophyBadge tier="elite" label="2º" size="sm" />  // Prata
<TrophyBadge tier="common" label="3º" size="sm" /> // Bronze
```

**Quando migrar**: PRIORIDADE ALTA - Usar em páginas de prêmios mensais/anuais.

---

## 📐 Exemplos de Migração Completa

### Página de Estatísticas de Jogador

#### ❌ Antes:
```tsx
export default function PlayerStats({ player }) {
  return (
    <div className="container p-6">
      <h1>{player.name}</h1>
      <div className="grid grid-cols-4 gap-4">
        <div>
          <span>Gols</span>
          <span className="text-2xl">{player.goals}</span>
        </div>
        <div>
          <span>Assistências</span>
          <span className="text-2xl">{player.assists}</span>
        </div>
      </div>
    </div>
  )
}
```

#### ✅ Depois:
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import StatsCard from "@/components/StatsCard"
import { Badge } from "@/components/ui/badge"
import TrophyBadge, { TrophyIcon } from "@/components/TrophyBadge"
import { Target, Users, Trophy, Calendar } from "lucide-react"

export default function PlayerStats({ player }) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Hero Card */}
      <Card variant="pitch" className="p-8">
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">{player.name}</h1>
            <div className="flex gap-2">
              {player.isMVP && <Badge variant="mvp">MVP</Badge>}
              <Badge variant="goal">{player.goals} gols</Badge>
              <Badge variant="assist">{player.assists} assists</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Gols"
          value={player.goals}
          subtitle="Total na temporada"
          icon={Target}
          variant="pitch"
          trend="up"
          trendValue="+12"
        />
        <StatsCard
          title="Assistências"
          value={player.assists}
          subtitle="Total na temporada"
          icon={Users}
          variant="stat"
          trend="up"
          trendValue="+5"
        />
        <StatsCard
          title="Overall"
          value={player.overall}
          icon={Trophy}
          variant="gold"
        />
        <StatsCard
          title="Partidas"
          value={player.matches}
          subtitle="Jogadas"
          icon={Calendar}
          variant="stadium"
        />
      </div>

      {/* Awards */}
      <Card variant="stat">
        <CardHeader>
          <CardTitle>Conquistas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <TrophyBadge tier="legend" label="Artilheiro 2024" icon={<TrophyIcon />} />
            <TrophyBadge tier="elite" label="Top 3 Assistente" />
            <TrophyBadge tier="mvp" label="MVP do Mês" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Melhorias obtidas**:
- ✅ Design consistente e profissional
- ✅ Animações e hover states
- ✅ Melhor hierarquia visual
- ✅ Componentização reutilizável
- ✅ Responsivo
- ✅ Dark mode automático

---

### Ranking/Leaderboard

#### ❌ Antes:
```tsx
export default function TopScorers({ players }) {
  return (
    <div>
      <h2>Artilheiros</h2>
      {players.map((player, index) => (
        <div key={player.id}>
          <span>{index + 1}º</span>
          <span>{player.name}</span>
          <span>{player.goals} gols</span>
        </div>
      ))}
    </div>
  )
}
```

#### ✅ Depois:
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import TrophyBadge from "@/components/TrophyBadge"

export default function TopScorers({ players }) {
  const getTier = (position: number) => {
    if (position === 0) return "legend"
    if (position === 1) return "elite"
    if (position === 2) return "common"
    return null
  }

  return (
    <Card variant="stat">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏆 Top Artilheiros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {players.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-base"
            >
              <div className="flex items-center gap-4">
                {index < 3 ? (
                  <TrophyBadge
                    tier={getTier(index)!}
                    label={`${index + 1}º`}
                    size="sm"
                  />
                ) : (
                  <span className="w-8 text-center font-bold text-muted-foreground">
                    {index + 1}º
                  </span>
                )}
                <div>
                  <div className="font-semibold">{player.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {player.position}
                  </div>
                </div>
              </div>
              <Badge variant="goal" size="lg">
                {player.goals} gols
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 🎨 Utility Classes Novas

### Gradientes
```tsx
<div className="bg-gradient-pitch">Verde campo</div>
<div className="bg-gradient-gold">Ouro troféu</div>
<div className="bg-gradient-stadium">Estádio sutil</div>
<div className="bg-gradient-field">Campo vertical</div>
```

### Glass Effect
```tsx
<div className="glass">Glass padrão</div>
<div className="glass-pitch">Glass verde</div>
```

### Shadows
```tsx
<div className="shadow-pitch">Sombra verde</div>
<div className="shadow-gold">Sombra dourada</div>
<div className="shadow-tier-gold">Brilho ouro</div>
```

### Animações
```tsx
<div className="animate-goal">Pulse de gol</div>
<div className="animate-trophy">Brilho troféu</div>
```

### Transições
```tsx
<div className="transition-fast">120ms</div>
<div className="transition-base">200ms</div>
<div className="transition-smooth">300ms</div>
```

---

## ⚡ Prioridades de Migração

### 🔴 Alta Prioridade
1. **Páginas de estatísticas** → Use `StatsCard`
2. **Rankings e leaderboards** → Use `TrophyBadge` e `Badge`
3. **Resumos mensais/anuais** → Use `Card variant="stat"` e `TrophyBadge`

### 🟡 Média Prioridade
4. **Botões de ações principais** → Use `Button variant="pitch"` ou `"gold"`
5. **Dashboards** → Use `StatsCard` e `Card variant="stat"`

### 🟢 Baixa Prioridade
6. **Componentes gerais** → Migre conforme necessário
7. **Páginas administrativas** → Pode manter padrão

---

## 🧪 Testando as Mudanças

### 1. Desenvolvimento Local
```bash
npm run dev
```

### 2. Verificar Dark Mode
Toggle o tema e verifique se:
- Cores ajustam automaticamente
- Contraste é mantido
- Sombras são visíveis

### 3. Verificar Responsividade
Teste em:
- Mobile (375px)
- Tablet (768px)
- Desktop (1280px+)

### 4. Verificar Acessibilidade
- Navegação por teclado funciona
- Focus states são visíveis
- Contraste de cores adequado

---

## 📚 Recursos

- **Design System**: [PELEGO_DESIGN_SYSTEM.md](./PELEGO_DESIGN_SYSTEM.md)
- **Componentes UI**: `src/components/ui/`
- **Novos Componentes**: `src/components/StatsCard/`, `src/components/TrophyBadge/`
- **Tokens CSS**: `src/app/globals.css`

---

## ❓ FAQ

### Q: Preciso migrar tudo de uma vez?
**A**: Não! O sistema é 100% retrocompatível. Migre gradualmente conforme edita páginas.

### Q: Os PlayerCards vão quebrar?
**A**: Não! Eles continuam funcionando exatamente como antes, só ganharam hover effects sutis.

### Q: E se eu não quiser usar as novas variantes?
**A**: Sem problema! As variantes `default` funcionam como antes.

### Q: Dark mode funciona automaticamente?
**A**: Sim! Todos os novos componentes suportam dark mode out of the box.

### Q: Posso misturar componentes antigos e novos?
**A**: Sim! Mas recomendamos migrar páginas inteiras para consistência visual.

---

## 🐛 Problemas Comuns

### Problema: Cores não aparecem
**Solução**: Verifique se você importou o globals.css no layout raiz.

### Problema: Animações não funcionam
**Solução**: Certifique-se de que as utilities estão no Tailwind config.

### Problema: Dark mode não funciona
**Solução**: Verifique se o ThemeProvider está no layout raiz.

---

## 🎯 Checklist de Migração de Página

Ao migrar uma página, siga este checklist:

- [ ] Identificar componentes de estatísticas → Migrar para `StatsCard`
- [ ] Identificar badges/tags → Migrar para `Badge`
- [ ] Identificar troféus/prêmios → Migrar para `TrophyBadge`
- [ ] Atualizar Cards → Usar variantes apropriadas (`stat`, `gold`, `pitch`)
- [ ] Atualizar Buttons → Usar variantes apropriadas
- [ ] Adicionar animações onde apropriado
- [ ] Testar em light e dark mode
- [ ] Testar responsividade
- [ ] Validar acessibilidade

---

**Dúvidas?** Consulte a [documentação completa](./PELEGO_DESIGN_SYSTEM.md) ou abra uma issue.
