# ⚽ Pelego MVP - Football Design System

Sistema de design temático de futebol para a aplicação Pelego MVP, com componentes, tokens e padrões visuais inspirados em estádios, campos e cultura futebolística.

---

## 🎨 Design Tokens

### Cores Principais

#### Pitch Green (Verde do Campo)
- **Primary**: `hsl(142 76% 36%)` - Verde gramado vibrante
- **Primary Hover**: `hsl(142 76% 28%)` - Verde mais escuro
- **Primary Light**: `hsl(142 76% 45%)` - Verde claro
- **Uso**: Botões primários, destaques, ações principais

#### Gold (Ouro - Troféus/Medalhas)
- **Accent Gold**: `hsl(45 93% 47%)` - Ouro rico
- **Uso**: Troféus, badges de conquistas, prêmios MVP

#### Stadium Colors (Cores do Estádio)
- **Background**: `hsl(210 25% 98%)` - Concreto claro
- **Muted**: `hsl(210 20% 94%)` - Cinza do estádio
- **Border**: `hsl(215 15% 88%)` - Bordas sutis

#### Performance Tiers
- **Legend**: `hsl(45 93% 47%)` - Ouro (rating 74+)
- **Elite**: `hsl(0 0% 85%)` - Prata (rating 65-73)
- **Common**: `hsl(25 75% 47%)` - Bronze (rating <65)
- **MVP**: `hsl(280 100% 70%)` - Roxo especial

### Cores de Status (Match Results)
- **Success/Win**: `hsl(142 76% 36%)` - Verde vitória
- **Warning/Draw**: `hsl(38 92% 50%)` - Amarelo empate
- **Destructive/Loss**: `hsl(0 84% 60%)` - Vermelho derrota
- **Info**: `hsl(217 91% 60%)` - Azul informação

### Shadows (Iluminação do Estádio)
- **shadow-soft**: Sombra suave padrão
- **shadow-pitch**: Sombra verde do campo
- **shadow-gold**: Sombra dourada para troféus
- **shadow-stadium**: Sombra de arquibancada
- **shadow-glow**: Brilho verde (floodlights)
- **shadow-tier-{gold|silver|bronze}**: Sombras por tier

---

## 🧩 Componentes

### Button Variants

```tsx
import { Button } from "@/components/ui/button"

// Variantes disponíveis
<Button variant="default">Padrão (Verde)</Button>
<Button variant="pitch">Campo (Gradiente Verde)</Button>
<Button variant="gold">Ouro (Troféu)</Button>
<Button variant="stadium">Estádio (Glass)</Button>
<Button variant="success">Vitória</Button>
<Button variant="warning">Empate</Button>
<Button variant="destructive">Derrota</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="default">Padrão</Button>
<Button size="lg">Grande</Button>
<Button size="xl">Extra Grande</Button>
```

**Quando usar:**
- `pitch`: Ações principais relacionadas a partidas/campo
- `gold`: Prêmios, conquistas, destaque especial
- `stadium`: Ações secundárias com efeito glass
- `success/warning/destructive`: Feedback de resultados

### Card Variants

```tsx
import { Card } from "@/components/ui/card"

// Variantes disponíveis
<Card variant="default">Card Padrão</Card>
<Card variant="pitch">Card Verde Campo</Card>
<Card variant="gold">Card Dourado</Card>
<Card variant="stadium">Card Glass Estádio</Card>
<Card variant="stat">Card de Estatística (hover animado)</Card>
<Card variant="field">Card Gradiente Campo</Card>
```

**Quando usar:**
- `stat`: Exibição de estatísticas (hover com escala e borda verde)
- `pitch`: Informações relacionadas a partidas
- `gold`: Prêmios, rankings top 3
- `stadium`: Informações secundárias com efeito glass

### Badge Component

```tsx
import { Badge } from "@/components/ui/badge"

// Variantes funcionais
<Badge variant="pitch">Campo</Badge>
<Badge variant="gold">Ouro</Badge>
<Badge variant="trophy">Troféu</Badge>
<Badge variant="mvp">MVP</Badge>

// Variantes de estatísticas
<Badge variant="goal">Gol</Badge>
<Badge variant="assist">Assistência</Badge>
<Badge variant="defender">Defensor</Badge>
<Badge variant="stat">Estatística</Badge>

// Tamanhos
<Badge size="sm">Pequeno</Badge>
<Badge size="default">Padrão</Badge>
<Badge size="lg">Grande</Badge>
<Badge size="xl">Extra Grande</Badge>
```

**Quando usar:**
- `goal`: Contadores de gols (animação pulse)
- `assist`: Contadores de assistências
- `trophy`: Conquistas especiais
- `mvp`: Destaque MVP
- `stat`: Tags de estatísticas gerais

### StatsCard Component

```tsx
import StatsCard from "@/components/StatsCard"
import { Trophy } from "lucide-react"

<StatsCard
  title="Gols"
  value={42}
  subtitle="Total na temporada"
  icon={Trophy}
  variant="pitch"
  trend="up"
  trendValue="+12%"
/>
```

**Props:**
- `title`: Título da estatística
- `value`: Valor principal (número ou texto)
- `subtitle`: Descrição opcional
- `icon`: Ícone do lucide-react ou componente customizado
- `variant`: "default" | "pitch" | "gold" | "stat" | "stadium"
- `trend`: "up" | "down" | "neutral" (opcional)
- `trendValue`: Texto da tendência (ex: "+12%")

**Quando usar:**
- Dashboards de estatísticas
- Resumos de performance
- KPIs de jogadores/times

### TrophyBadge Component

```tsx
import TrophyBadge, { TrophyIcon, MedalIcon, StarIcon } from "@/components/TrophyBadge"

<TrophyBadge
  tier="legend"
  label="Artilheiro"
  icon={<TrophyIcon className="w-4 h-4" />}
  size="md"
  animated={true}
/>
```

**Tiers:**
- `legend`: Ouro (animação de brilho)
- `elite`: Prata
- `common`: Bronze
- `mvp`: Roxo especial

**Ícones inclusos:**
- `TrophyIcon`: Troféu
- `MedalIcon`: Medalha
- `StarIcon`: Estrela

**Quando usar:**
- Prêmios de fim de mês/ano
- Rankings top 3
- Conquistas especiais
- Badges de MVP

---

## 🎨 Utility Classes

### Gradientes

```css
.bg-gradient-pitch      /* Verde campo degradê */
.bg-gradient-gold       /* Ouro degradê */
.bg-gradient-trophy     /* Ouro troféu (3 tons) */
.bg-gradient-field      /* Campo vertical */
.bg-gradient-stadium    /* Estádio sutil */
.bg-gradient-sky        /* Céu azul */
```

### Glass Morphism

```css
.glass                  /* Glass padrão */
.glass-pitch           /* Glass verde campo */
```

### Shadows Temáticas

```css
.shadow-soft           /* Sombra suave */
.shadow-pitch          /* Sombra verde */
.shadow-gold           /* Sombra dourada */
.shadow-stadium        /* Sombra estádio */
.shadow-tier-gold      /* Brilho ouro */
.shadow-tier-silver    /* Brilho prata */
.shadow-tier-bronze    /* Brilho bronze */
```

### Animações

```css
.animate-goal          /* Pulse de gol (600ms) */
.animate-trophy        /* Brilho de troféu (loop) */
.transition-fast       /* 120ms */
.transition-base       /* 200ms */
.transition-smooth     /* 300ms */
```

### Efeitos de Campo

```css
.field-lines           /* Linhas horizontais do campo */
.pitch-stripes         /* Listras verticais do gramado */
.glow-pitch           /* Brilho verde floodlight */
```

### Text Gradients

```css
.text-gradient-gold    /* Texto gradiente ouro */
.text-gradient-pitch   /* Texto gradiente verde */
```

---

## 📐 Padrões de Uso

### Dashboard de Estatísticas

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatsCard
    title="Total de Gols"
    value={156}
    variant="pitch"
    icon={Target}
    trend="up"
    trendValue="+24"
  />
  <StatsCard
    title="Assistências"
    value={89}
    variant="stat"
    icon={Users}
    trend="up"
    trendValue="+12"
  />
  <StatsCard
    title="Vitórias"
    value="78%"
    variant="gold"
    icon={Trophy}
  />
  <StatsCard
    title="Partidas"
    value={42}
    variant="stadium"
    icon={Calendar}
  />
</div>
```

### Ranking/Leaderboard

```tsx
<Card variant="stat">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <TrophyBadge tier="legend" label="1º" size="sm" />
      Top Artilheiros
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      {players.map((player, index) => (
        <div key={player.id} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {index < 3 && (
              <TrophyBadge
                tier={index === 0 ? "legend" : index === 1 ? "elite" : "common"}
                label={`${index + 1}º`}
                size="sm"
              />
            )}
            <span>{player.name}</span>
          </div>
          <Badge variant="goal">{player.goals} gols</Badge>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

### Botões de Ação

```tsx
{/* Criar partida */}
<Button variant="pitch" size="lg">
  <Plus className="w-5 h-5" />
  Nova Partida
</Button>

{/* Ver troféus */}
<Button variant="gold" size="lg">
  <Trophy className="w-5 h-5" />
  Meus Troféus
</Button>

{/* Ação secundária */}
<Button variant="stadium" size="default">
  Ver Estatísticas
</Button>
```

---

## ♿ Acessibilidade

### Contraste
Todas as combinações de cores seguem **WCAG 2.1 AA**:
- Texto em fundos coloridos: mínimo 4.5:1
- Texto grande (18px+): mínimo 3:1
- Componentes interativos: mínimo 3:1

### Dark Mode
Todos os tokens têm versões ajustadas para dark mode:
- Cores mais vibrantes e brilhantes
- Sombras mais intensas
- Bordas mais visíveis
- Contraste mantido

### Reduced Motion
Componentes respeitam `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  /* Animações desabilitadas */
}
```

### Keyboard Navigation
Todos os componentes interativos:
- Suportam navegação por teclado
- Têm focus ring visível (`ring-2 ring-ring`)
- Estados de hover/focus/active claros

---

## 🌙 Dark Mode

O sistema suporta dark mode automático com tema "Night Stadium":

```tsx
// Dark mode é aplicado automaticamente via classe .dark
// Todos os tokens se ajustam automaticamente

// Componentes mantêm a mesma API
<Button variant="pitch">Funciona em ambos os modos</Button>
```

**Ajustes em dark mode:**
- Background: Estádio escuro (`hsl(220 25% 8%)`)
- Primary: Verde mais brilhante
- Shadows: Mais intensas (floodlights)
- Borders: Mais visíveis
- Glow: Mais pronunciado

---

## 📝 Checklist de Implementação

Ao criar novos componentes ou páginas:

- [ ] Usar tokens de cor semânticos (não hardcode)
- [ ] Testar em light e dark mode
- [ ] Adicionar variantes temáticas quando apropriado
- [ ] Incluir animações com fallback para reduced-motion
- [ ] Validar contraste de cores (WCAG AA)
- [ ] Testar navegação por teclado
- [ ] Adicionar focus states visíveis
- [ ] Documentar uso de novos padrões

---

## 🚀 Exemplos Práticos

### Página de Jogador

```tsx
<div className="container mx-auto p-6 space-y-6">
  {/* Hero Section */}
  <Card variant="pitch" className="p-8">
    <div className="flex items-center gap-6">
      <Avatar size="xl" />
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-white">{player.name}</h1>
        <div className="flex gap-2">
          <Badge variant="trophy">MVP</Badge>
          <Badge variant="goal">{player.goals} gols</Badge>
        </div>
      </div>
    </div>
  </Card>

  {/* Stats Grid */}
  <div className="grid grid-cols-4 gap-4">
    <StatsCard title="Overall" value={player.overall} variant="gold" />
    <StatsCard title="Gols" value={player.goals} variant="pitch" />
    <StatsCard title="Assistências" value={player.assists} variant="stat" />
    <StatsCard title="Partidas" value={player.matches} variant="stadium" />
  </div>

  {/* Achievements */}
  <Card variant="stat">
    <CardHeader>
      <CardTitle>Conquistas</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-3">
        <TrophyBadge tier="legend" label="Artilheiro 2024" icon={<TrophyIcon />} />
        <TrophyBadge tier="elite" label="Melhor Assistente" icon={<MedalIcon />} />
        <TrophyBadge tier="mvp" label="MVP do Mês" icon={<StarIcon />} />
      </div>
    </CardContent>
  </Card>
</div>
```

---

## 🎯 Próximos Passos

Componentes planejados para expansão:
- MatchCard (card de partida com placar)
- TeamFormation (formação tática visual)
- StatBar (barra de progresso temática)
- AwardModal (modal de conquista com animação)
- PlayerComparison (comparação lado a lado)

---

**Versão**: 1.0.0
**Última atualização**: 2025
