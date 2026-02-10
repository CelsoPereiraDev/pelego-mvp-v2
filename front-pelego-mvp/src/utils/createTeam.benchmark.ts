/**
 * BENCHMARK SCRIPT - Hill Climbing Performance Analysis
 *
 * Este script executa benchmarks de performance reais para
 * validar e medir o desempenho do algoritmo Hill Climbing
 *
 * Executar: npx ts-node src/utils/createTeam.benchmark.ts
 */

import { hillClimbing, HillClimbingOptions } from './createTeam.optimized';
import { Player } from '@/types/player';

// ============================================================================
// MOCK DATA GENERATOR
// ============================================================================

function createMockPlayer(
  id: string,
  name: string,
  position: 'GOL' | 'DEF' | 'MEI' | 'ATK',
  overall: number
): Player {
  return {
    id,
    name,
    position,
    overall: {
      overall,
      pace: overall,
      shooting: overall,
      passing: overall,
      dribble: overall,
      defense: overall,
      physics: overall
    },
    country: 'BR',
    image: '',
    slug: name.toLowerCase().replace(' ', '-')
  } as Player;
}

function generatePlayers(count: number): Player[] {
  const players: Player[] = [];
  const positions: Array<'GOL' | 'DEF' | 'MEI' | 'ATK'> = ['GOL', 'DEF', 'MEI', 'ATK'];
  const distribution = [0.1, 0.35, 0.3, 0.25];

  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let posIdx = 0;
    let cumulative = 0;

    for (let j = 0; j < distribution.length; j++) {
      cumulative += distribution[j];
      if (rand < cumulative) {
        posIdx = j;
        break;
      }
    }

    const position = positions[posIdx];
    const overall = Math.floor(Math.random() * 20) + 70;

    players.push(createMockPlayer(
      `player-${i}`,
      `Jogador ${i}`,
      position,
      overall
    ));
  }

  return players;
}

// ============================================================================
// BENCHMARK RUNNER
// ============================================================================

interface BenchmarkConfig {
  name: string;
  players: number;
  teams: number;
  iterations: number;
  options?: Partial<HillClimbingOptions>;
}

interface BenchmarkResult {
  config: BenchmarkConfig;
  stats: {
    finalScore: number;
    initialScore: number;
    improvements: number;
    rejections: number;
    invalidSwaps: number;
    restarts: number;
    optimizationTime: number;
    validationTime: number;
  };
  teamSizes: number[];
  improvement: number;
}

function runBenchmark(config: BenchmarkConfig): BenchmarkResult {
  const players = generatePlayers(config.players);

  const { teams, stats } = hillClimbing(players, config.teams, {
    iterations: config.iterations,
    verbose: false,
    ...config.options
  });

  const teamSizes = teams.map(t => t.players.length).sort((a, b) => b - a);
  const improvement = ((stats.initialScore - stats.finalScore) / stats.initialScore) * 100;

  return {
    config,
    stats,
    teamSizes,
    improvement
  };
}

function printBenchmarkResult(result: BenchmarkResult): void {
  const { config, stats, teamSizes, improvement } = result;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 ${config.name}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`⚙️  Configuração:`);
  console.log(`   Jogadores: ${config.players} | Times: ${config.teams}`);
  console.log(`   Iterações: ${config.iterations}`);
  console.log(`   Distribuição de times: [${teamSizes.join(', ')}]`);

  console.log(`\n📈 Resultados:`);
  console.log(`   Score Inicial: ${stats.initialScore.toFixed(3)}`);
  console.log(`   Score Final: ${stats.finalScore.toFixed(3)}`);
  console.log(`   Melhoria: ${improvement.toFixed(2)}%`);

  console.log(`\n📊 Estatísticas:`);
  console.log(`   Melhorias: ${stats.improvements}`);
  console.log(`   Rejeições: ${stats.rejections}`);
  console.log(`   Swaps inválidos: ${stats.invalidSwaps}`);
  console.log(`   Random restarts: ${stats.restarts}`);

  console.log(`\n⏱️  Performance:`);
  console.log(`   Tempo total: ${stats.optimizationTime.toFixed(2)}ms`);
  console.log(`   Tempo de validação: ${stats.validationTime.toFixed(2)}ms`);
  console.log(`   Tempo por iteração: ${(stats.optimizationTime / config.iterations).toFixed(4)}ms`);
  console.log(`   Taxa de aceitação: ${((stats.improvements / (stats.improvements + stats.rejections)) * 100).toFixed(2)}%`);
}

// ============================================================================
// BENCHMARK CONFIGURATIONS
// ============================================================================

const benchmarks: BenchmarkConfig[] = [
  // CENÁRIO 1: Caso básico (divisão não-exata)
  {
    name: 'Cenário 1: 20 jogadores, 3 times (7-7-6)',
    players: 20,
    teams: 3,
    iterations: 1000
  },
  {
    name: 'Cenário 1B: 20 jogadores, 3 times (10000 iterações)',
    players: 20,
    teams: 3,
    iterations: 10000
  },

  // CENÁRIO 2: Caso médio (divisão exata)
  {
    name: 'Cenário 2: 50 jogadores, 5 times (10-10-10-10-10)',
    players: 50,
    teams: 5,
    iterations: 1000
  },
  {
    name: 'Cenário 2B: 50 jogadores, 5 times (10000 iterações)',
    players: 50,
    teams: 5,
    iterations: 10000
  },

  // CENÁRIO 3: Caso grande
  {
    name: 'Cenário 3: 100 jogadores, 8 times',
    players: 100,
    teams: 8,
    iterations: 10000
  },

  // CENÁRIO 4: Comparação Hill Climbing vs Simulated Annealing
  {
    name: 'Cenário 4A: HC Puro - 30 jogadores, 5 times',
    players: 30,
    teams: 5,
    iterations: 5000,
    options: {
      enableSimulatedAnnealing: false,
      enableRandomRestart: false
    }
  },
  {
    name: 'Cenário 4B: Simulated Annealing - 30 jogadores, 5 times',
    players: 30,
    teams: 5,
    iterations: 5000,
    options: {
      enableSimulatedAnnealing: true,
      initialTemperature: 100,
      coolingRate: 0.995,
      enableRandomRestart: false
    }
  },

  // CENÁRIO 5: Early Stopping
  {
    name: 'Cenário 5: Early Stopping - 40 jogadores, 6 times',
    players: 40,
    teams: 6,
    iterations: 10000,
    options: {
      enableEarlyStopping: true
    }
  },

  // CENÁRIO 6: Caso extremo (muitos jogadores)
  {
    name: 'Cenário 6: Caso Extremo - 200 jogadores, 15 times',
    players: 200,
    teams: 15,
    iterations: 5000
  }
];

// ============================================================================
// EXECUTE BENCHMARKS
// ============================================================================

console.log('\n\n');
console.log('╔════════════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                            ║');
console.log('║               HILL CLIMBING - PERFORMANCE BENCHMARKS                       ║');
console.log('║                                                                            ║');
console.log('╚════════════════════════════════════════════════════════════════════════════╝');

const results: BenchmarkResult[] = [];

for (const config of benchmarks) {
  const result = runBenchmark(config);
  results.push(result);
  printBenchmarkResult(result);
}

// ============================================================================
// SUMMARY TABLE
// ============================================================================

console.log(`\n\n${'='.repeat(80)}`);
console.log('📋 RESUMO COMPARATIVO');
console.log(`${'='.repeat(80)}\n`);

console.log('┌────────────────────────────────────────┬──────────┬──────────┬────────────┐');
console.log('│ Cenário                                │ Tempo    │ Melhoria │ Taxa Aceit │');
console.log('├────────────────────────────────────────┼──────────┼──────────┼────────────┤');

results.forEach(result => {
  const name = result.config.name.substring(0, 38).padEnd(38);
  const time = `${result.stats.optimizationTime.toFixed(0)}ms`.padStart(8);
  const improvement = `${result.improvement.toFixed(1)}%`.padStart(8);
  const acceptanceRate = ((result.stats.improvements / (result.stats.improvements + result.stats.rejections)) * 100).toFixed(1);
  const rate = `${acceptanceRate}%`.padStart(10);

  console.log(`│ ${name} │ ${time} │ ${improvement} │ ${rate} │`);
});

console.log('└────────────────────────────────────────┴──────────┴──────────┴────────────┘');

// ============================================================================
// PERFORMANCE INSIGHTS
// ============================================================================

console.log('\n\n');
console.log(`${'='.repeat(80)}`);
console.log('💡 INSIGHTS DE PERFORMANCE');
console.log(`${'='.repeat(80)}\n`);

// Média de tempo por iteração
const avgTimePerIteration = results.reduce(
  (sum, r) => sum + (r.stats.optimizationTime / r.config.iterations),
  0
) / results.length;

console.log(`📊 Tempo médio por iteração: ${avgTimePerIteration.toFixed(4)}ms`);

// Cenário com melhor melhoria
const bestImprovement = results.reduce((best, current) =>
  current.improvement > best.improvement ? current : best
);

console.log(`🏆 Melhor melhoria: ${bestImprovement.config.name} (${bestImprovement.improvement.toFixed(2)}%)`);

// Comparação HC vs SA
const hcResult = results.find(r => r.config.name.includes('4A: HC Puro'));
const saResult = results.find(r => r.config.name.includes('4B: Simulated Annealing'));

if (hcResult && saResult) {
  console.log(`\n🔬 Hill Climbing vs Simulated Annealing:`);
  console.log(`   HC - Melhoria: ${hcResult.improvement.toFixed(2)}% | Tempo: ${hcResult.stats.optimizationTime.toFixed(0)}ms`);
  console.log(`   SA - Melhoria: ${saResult.improvement.toFixed(2)}% | Tempo: ${saResult.stats.optimizationTime.toFixed(0)}ms`);

  if (saResult.improvement > hcResult.improvement) {
    console.log(`   ✅ SA teve ${((saResult.improvement - hcResult.improvement) / hcResult.improvement * 100).toFixed(1)}% mais melhoria`);
  } else {
    console.log(`   ✅ HC teve melhor ou igual performance`);
  }
}

// Early stopping effectiveness
const earlyStopResult = results.find(r => r.config.name.includes('Early Stopping'));
if (earlyStopResult) {
  const actualIterations = earlyStopResult.stats.improvements + earlyStopResult.stats.rejections;
  const savedIterations = earlyStopResult.config.iterations - actualIterations;
  const savedPercentage = (savedIterations / earlyStopResult.config.iterations) * 100;

  console.log(`\n⏱️  Early Stopping:`);
  console.log(`   Iterações configuradas: ${earlyStopResult.config.iterations}`);
  console.log(`   Iterações executadas: ~${actualIterations}`);
  console.log(`   Economia: ~${savedPercentage.toFixed(1)}%`);
}

console.log('\n\n');
console.log('✅ Benchmarks concluídos com sucesso!');
console.log('\n\n');
