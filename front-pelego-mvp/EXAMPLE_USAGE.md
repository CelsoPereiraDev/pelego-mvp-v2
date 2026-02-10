# 📖 Exemplos de Uso - Pelego Design System

Exemplos práticos e copy-paste ready dos novos componentes.

---

## 🎯 Página de Estatísticas do Jogador

```tsx
// src/app/player/[playerSlug]/stats/page.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import StatsCard from "@/components/StatsCard"
import { Badge } from "@/components/ui/badge"
import TrophyBadge, { TrophyIcon, MedalIcon, StarIcon } from "@/components/TrophyBadge"
import { Target, Users, Trophy, Calendar, Award, Shield } from "lucide-react"

export default function PlayerStatsPage({ params }) {
  const player = getPlayer(params.playerSlug) // sua função

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <Card variant="pitch" className="p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <img
            src={player.image}
            alt={player.name}
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
          />
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {player.name}
              </h1>
              <p className="text-xl text-white/80">
                {player.position} • {player.country}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {player.isMVP && <Badge variant="mvp" size="lg">MVP</Badge>}
              {player.isTopScorer && <Badge variant="trophy" size="lg">Artilheiro</Badge>}
              <Badge variant="goal" size="lg">{player.goals} gols</Badge>
              <Badge variant="assist" size="lg">{player.assists} assists</Badge>
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
          trendValue={`+${player.goalsThisMonth}`}
        />
        <StatsCard
          title="Assistências"
          value={player.assists}
          subtitle="Total na temporada"
          icon={Users}
          variant="stat"
          trend={player.assistsTrend}
          trendValue={`${player.assistsTrend === 'up' ? '+' : ''}${player.assistsChange}`}
        />
        <StatsCard
          title="Overall"
          value={player.overall}
          subtitle="Rating médio"
          icon={Trophy}
          variant="gold"
        />
        <StatsCard
          title="Partidas"
          value={player.matches}
          subtitle="Jogadas em 2024"
          icon={Calendar}
          variant="stadium"
        />
      </div>

      {/* Attributes Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="stat">
          <CardHeader>
            <CardTitle>Atributos do Jogador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AttributeBar label="Velocidade" value={player.pace} max={99} color="pitch" />
              <AttributeBar label="Finalização" value={player.shooting} max={99} color="gold" />
              <AttributeBar label="Passe" value={player.passing} max={99} color="stat" />
              <AttributeBar label="Drible" value={player.dribble} max={99} color="pitch" />
              <AttributeBar label="Defesa" value={player.defense} max={99} color="stat" />
              <AttributeBar label="Físico" value={player.physics} max={99} color="gold" />
            </div>
          </CardContent>
        </Card>

        {/* Awards */}
        <Card variant="stat">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <TrophyBadge
                tier="legend"
                label="Artilheiro 2024"
                icon={<TrophyIcon />}
                size="md"
              />
              <TrophyBadge
                tier="elite"
                label="Top 3 Assistente"
                icon={<MedalIcon />}
                size="md"
              />
              <TrophyBadge
                tier="mvp"
                label="MVP Março"
                icon={<StarIcon />}
                size="md"
              />
              <TrophyBadge
                tier="common"
                label="Melhor Defensor"
                icon={<Shield />}
                size="md"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper Component
function AttributeBar({ label, value, max, color }) {
  const percentage = (value / max) * 100

  const colorClasses = {
    pitch: "bg-primary",
    gold: "bg-[hsl(var(--accent-gold))]",
    stat: "bg-[hsl(var(--chart-2))]",
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}/{max}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
```

---

## 🏆 Página de Rankings/Leaderboard

```tsx
// src/app/rankings/page.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import TrophyBadge from "@/components/TrophyBadge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function RankingsPage() {
  const topScorers = getTopScorers()
  const topAssisters = getTopAssisters()
  const topDefenders = getTopDefenders()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card variant="pitch" className="p-6">
        <h1 className="text-4xl font-bold text-white mb-2">
          🏆 Rankings da Temporada
        </h1>
        <p className="text-white/80">
          Confira os melhores jogadores de 2024
        </p>
      </Card>

      <Tabs defaultValue="scorers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scorers">Artilheiros</TabsTrigger>
          <TabsTrigger value="assisters">Assistentes</TabsTrigger>
          <TabsTrigger value="defenders">Defensores</TabsTrigger>
        </TabsList>

        <TabsContent value="scorers" className="mt-6">
          <RankingCard
            title="🎯 Top Artilheiros"
            players={topScorers}
            statKey="goals"
            statLabel="gols"
            badgeVariant="goal"
          />
        </TabsContent>

        <TabsContent value="assisters" className="mt-6">
          <RankingCard
            title="⚡ Top Assistentes"
            players={topAssisters}
            statKey="assists"
            statLabel="assistências"
            badgeVariant="assist"
          />
        </TabsContent>

        <TabsContent value="defenders" className="mt-6">
          <RankingCard
            title="🛡️ Melhores Defensores"
            players={topDefenders}
            statKey="defenseRating"
            statLabel="rating"
            badgeVariant="defender"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RankingCard({ title, players, statKey, statLabel, badgeVariant }) {
  const getTier = (position) => {
    if (position === 0) return "legend"
    if (position === 1) return "elite"
    if (position === 2) return "common"
    return null
  }

  return (
    <Card variant="stat">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {players.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-accent/50 transition-base cursor-pointer"
            >
              <div className="flex items-center gap-4">
                {index < 3 ? (
                  <TrophyBadge
                    tier={getTier(index)}
                    label={`${index + 1}º`}
                    size="sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                )}
                <img
                  src={player.image}
                  alt={player.name}
                  className="w-12 h-12 rounded-full border-2 border-border"
                />
                <div>
                  <div className="font-semibold text-base">{player.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {player.position} • {player.country}
                  </div>
                </div>
              </div>
              <Badge variant={badgeVariant} size="lg">
                {player[statKey]} {statLabel}
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

## 📊 Dashboard de Estatísticas Mensais

```tsx
// src/app/stat-resume/[year]/[month]/page.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import StatsCard from "@/components/StatsCard"
import { Badge } from "@/components/ui/badge"
import TrophyBadge, { TrophyIcon } from "@/components/TrophyBadge"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Target, Award, TrendingUp, Calendar } from "lucide-react"

export default function MonthlyStatsPage({ params }) {
  const stats = getMonthlyStats(params.year, params.month)

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Resumo de {getMonthName(params.month)} {params.year}
          </h1>
          <p className="text-muted-foreground">
            Estatísticas e prêmios do mês
          </p>
        </div>
        <Button variant="pitch" size="lg">
          <Calendar className="w-5 h-5" />
          Exportar Relatório
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Gols"
          value={stats.totalGoals}
          subtitle="No mês"
          icon={Target}
          variant="pitch"
          trend="up"
          trendValue="+15%"
        />
        <StatsCard
          title="Total de Assistências"
          value={stats.totalAssists}
          subtitle="No mês"
          icon={Users}
          variant="stat"
          trend="up"
          trendValue="+8%"
        />
        <StatsCard
          title="Partidas"
          value={stats.totalMatches}
          subtitle="Realizadas"
          icon={Calendar}
          variant="stadium"
        />
        <StatsCard
          title="Participação"
          value={`${stats.participationRate}%`}
          subtitle="Taxa média"
          icon={TrendingUp}
          variant="gold"
          trend="up"
          trendValue="+3%"
        />
      </div>

      {/* Awards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MVP */}
        <Card variant="gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Trophy className="w-6 h-6" />
              MVP do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <img
                src={stats.mvp.image}
                alt={stats.mvp.name}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-1">
                  {stats.mvp.name}
                </h3>
                <p className="text-white/80 mb-2">
                  {stats.mvp.position} • {stats.mvp.championships} vitórias
                </p>
                <div className="flex gap-2">
                  <Badge variant="trophy" size="lg">MVP</Badge>
                  <Badge variant="goal" size="lg">{stats.mvp.goals} gols</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Scorer */}
        <Card variant="pitch">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="w-6 h-6" />
              Artilheiro do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <img
                src={stats.topScorer.image}
                alt={stats.topScorer.name}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-1">
                  {stats.topScorer.name}
                </h3>
                <p className="text-white/80 mb-2">
                  {stats.topScorer.position}
                </p>
                <div className="flex gap-2">
                  <Badge variant="goal" size="lg" className="animate-goal">
                    {stats.topScorer.goals} gols
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Awards */}
      <Card variant="stat">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Todos os Prêmios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Top 5 Scorers */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                Top 5 Artilheiros
              </h4>
              {stats.top5Scorers.map((player, index) => (
                <div key={player.id} className="flex items-center gap-3">
                  {index < 3 ? (
                    <TrophyBadge
                      tier={index === 0 ? "legend" : index === 1 ? "elite" : "common"}
                      label={`${index + 1}º`}
                      size="sm"
                    />
                  ) : (
                    <span className="w-8 text-center text-sm font-bold text-muted-foreground">
                      {index + 1}º
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{player.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {player.goals} gols
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top 5 Assisters */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                Top 5 Assistentes
              </h4>
              {stats.top5Assisters.map((player, index) => (
                <div key={player.id} className="flex items-center gap-3">
                  {index < 3 ? (
                    <TrophyBadge
                      tier={index === 0 ? "legend" : index === 1 ? "elite" : "common"}
                      label={`${index + 1}º`}
                      size="sm"
                    />
                  ) : (
                    <span className="w-8 text-center text-sm font-bold text-muted-foreground">
                      {index + 1}º
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{player.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {player.assists} assists
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Best Defenders */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase text-muted-foreground">
                Melhores Defensores
              </h4>
              {stats.bestDefenders.map((player, index) => (
                <div key={player.id} className="flex items-center gap-3">
                  {index < 3 ? (
                    <TrophyBadge
                      tier={index === 0 ? "legend" : index === 1 ? "elite" : "common"}
                      label={`${index + 1}º`}
                      size="sm"
                    />
                  ) : (
                    <span className="w-8 text-center text-sm font-bold text-muted-foreground">
                      {index + 1}º
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{player.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {player.defensiveRating.toFixed(1)} rating
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getMonthName(month) {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]
  return months[parseInt(month) - 1]
}
```

---

## 🎮 Componentes Reutilizáveis

### MatchResultCard

```tsx
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function MatchResultCard({ match }) {
  const isWin = match.result === "win"
  const isDraw = match.result === "draw"
  const isLoss = match.result === "loss"

  const cardVariant = isWin ? "pitch" : isDraw ? "stadium" : "default"
  const badgeVariant = isWin ? "success" : isDraw ? "warning" : "destructive"

  return (
    <Card variant={cardVariant} className="p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{match.homeTeam}</span>
            <Badge variant={badgeVariant}>
              {isWin ? "Vitória" : isDraw ? "Empate" : "Derrota"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{match.date}</p>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold">
            {match.homeScore} - {match.awayScore}
          </div>
        </div>
      </div>
    </Card>
  )
}
```

### PlayerMiniCard

```tsx
import { Badge } from "@/components/ui/badge"

export function PlayerMiniCard({ player }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:shadow-pitch transition-base cursor-pointer">
      <img
        src={player.image}
        alt={player.name}
        className="w-12 h-12 rounded-full"
      />
      <div className="flex-1">
        <div className="font-semibold">{player.name}</div>
        <div className="text-sm text-muted-foreground">
          {player.position} • Overall {player.overall}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {player.goals > 0 && (
          <Badge variant="goal" size="sm">{player.goals}</Badge>
        )}
        {player.assists > 0 && (
          <Badge variant="assist" size="sm">{player.assists}</Badge>
        )}
      </div>
    </div>
  )
}
```

---

## 🎨 Utility Classes Examples

```tsx
// Gradiente de campo
<div className="bg-gradient-pitch p-8 rounded-xl">
  <h2 className="text-white text-2xl font-bold">Campo Verde</h2>
</div>

// Gradiente ouro
<div className="bg-gradient-gold p-8 rounded-xl">
  <h2 className="text-white text-2xl font-bold">Troféu Dourado</h2>
</div>

// Glass effect
<div className="glass p-6 rounded-xl">
  <p>Conteúdo com efeito glass</p>
</div>

// Animação de gol
<button className="px-4 py-2 bg-success rounded-lg animate-goal">
  GOL!!!
</button>

// Texto gradiente
<h1 className="text-4xl font-bold text-gradient-gold">
  Campeão
</h1>

// Sombra temática
<div className="shadow-tier-gold p-6 rounded-xl bg-white">
  Card com brilho dourado
</div>
```

---

Pronto! Todos os exemplos estão prontos para copiar e usar. 🚀
