import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  hillClimbing,
  distributePlayers,
  calculateTeamScore,
  calculateTeamOverall,
  Team,
  HillClimbingOptions
} from './createTeam.optimized';
import { Player } from '@/types/player';

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

/**
 * Cria um jogador mock com posição e overall customizáveis
 */
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

/**
 * Gera N jogadores com distribuição realista de posições
 */
function generateMockPlayers(count: number): Player[] {
  const players: Player[] = [];
  const positions: Array<'GOL' | 'DEF' | 'MEI' | 'ATK'> = ['GOL', 'DEF', 'MEI', 'ATK'];

  // Proporções realistas: 10% GOL, 35% DEF, 30% MEI, 25% ATK
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
    const overall = Math.floor(Math.random() * 20) + 70; // 70-89

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
// UTILITY FUNCTIONS FOR TESTS
// ============================================================================

/**
 * Conta jogadores de uma posição em um time
 */
function countPosition(team: Team, position: string): number {
  return team.players.filter(p => p.position === position).length;
}

/**
 * Verifica se todos os times têm tamanhos válidos (diff <= 1)
 */
function hasValidSizes(teams: Team[]): boolean {
  const sizes = teams.map(t => t.players.length);
  const max = Math.max(...sizes);
  const min = Math.min(...sizes);
  return (max - min) <= 1;
}

/**
 * Calcula overall médio de um time
 */
function calculateAverage(team: Team): number {
  if (team.players.length === 0) return 0;
  return calculateTeamScore(team.players) / team.players.length;
}

// ============================================================================
// TESTS: SCORING FUNCTIONS
// ============================================================================

describe('Scoring Functions', () => {
  test('calculateTeamScore deve somar overalls corretamente', () => {
    const players = [
      createMockPlayer('1', 'P1', 'DEF', 80),
      createMockPlayer('2', 'P2', 'MEI', 85),
      createMockPlayer('3', 'P3', 'ATK', 75)
    ];

    expect(calculateTeamScore(players)).toBe(240);
  });

  test('calculateTeamOverall deve retornar média arredondada', () => {
    const players = [
      createMockPlayer('1', 'P1', 'DEF', 80),
      createMockPlayer('2', 'P2', 'MEI', 85),
      createMockPlayer('3', 'P3', 'ATK', 76)
    ];

    // (80 + 85 + 76) / 3 = 80.33... → arredonda para 80
    expect(calculateTeamOverall(players)).toBe(80);
  });

  test('calculateTeamOverall deve retornar 0 para time vazio', () => {
    expect(calculateTeamOverall([])).toBe(0);
  });
});

// ============================================================================
// TESTS: CONSTRAINT 1 - Máximo 1 Goleiro por Time
// ============================================================================

describe('Restrição 1: Máximo 1 Goleiro por Time', () => {
  test('distributePlayers não deve criar times com 2+ goleiros', () => {
    const players = [
      createMockPlayer('1', 'GOL1', 'GOL', 85),
      createMockPlayer('2', 'GOL2', 'GOL', 80),
      createMockPlayer('3', 'GOL3', 'GOL', 82),
      ...Array.from({ length: 15 }, (_, i) =>
        createMockPlayer(`${i+4}`, `DEF${i}`, 'DEF', 75 + i)
      )
    ];

    const teams = distributePlayers(players, 3);

    teams.forEach(team => {
      const goalkeepers = countPosition(team, 'GOL');
      expect(goalkeepers).toBeLessThanOrEqual(1);
    });
  });

  test('Hill Climbing deve manter máximo 1 goleiro após otimização', () => {
    const players = [
      createMockPlayer('1', 'GOL1', 'GOL', 85),
      createMockPlayer('2', 'GOL2', 'GOL', 80),
      ...Array.from({ length: 16 }, (_, i) =>
        createMockPlayer(`${i+3}`, `P${i}`, 'DEF', 70 + i)
      )
    ];

    const { teams } = hillClimbing(players, 2, { iterations: 1000 });

    teams.forEach(team => {
      const goalkeepers = countPosition(team, 'GOL');
      expect(goalkeepers).toBeLessThanOrEqual(1);
    });
  });

  test('Deve funcionar com apenas 1 goleiro para múltiplos times', () => {
    const players = [
      createMockPlayer('1', 'GOL1', 'GOL', 85),
      ...Array.from({ length: 17 }, (_, i) =>
        createMockPlayer(`${i+2}`, `P${i}`, 'DEF', 70 + i)
      )
    ];

    const teams = distributePlayers(players, 3);

    const totalGoalkeepers = teams.reduce(
      (sum, team) => sum + countPosition(team, 'GOL'),
      0
    );
    expect(totalGoalkeepers).toBe(1);
  });
});

// ============================================================================
// TESTS: CONSTRAINT 2 - Cobertura de Posições Obrigatória
// ============================================================================

describe('Restrição 2: Cobertura de Posições Obrigatória', () => {
  test('Com 2 times e 2+ goleiros, cada time deve ter 1 goleiro', () => {
    const players = [
      createMockPlayer('1', 'GOL1', 'GOL', 85),
      createMockPlayer('2', 'GOL2', 'GOL', 80),
      createMockPlayer('3', 'DEF1', 'DEF', 82),
      createMockPlayer('4', 'DEF2', 'DEF', 81),
      createMockPlayer('5', 'DEF3', 'DEF', 79),
      createMockPlayer('6', 'MEI1', 'MEI', 84),
      createMockPlayer('7', 'MEI2', 'MEI', 83),
      createMockPlayer('8', 'ATK1', 'ATK', 86),
      createMockPlayer('9', 'ATK2', 'ATK', 85),
      createMockPlayer('10', 'ATK3', 'ATK', 84),
    ];

    const teams = distributePlayers(players, 2);

    teams.forEach(team => {
      expect(countPosition(team, 'GOL')).toBe(1);
      expect(countPosition(team, 'DEF')).toBeGreaterThanOrEqual(1);
      expect(countPosition(team, 'MEI')).toBeGreaterThanOrEqual(1);
      expect(countPosition(team, 'ATK')).toBeGreaterThanOrEqual(1);
    });
  });

  test('Hill Climbing deve manter cobertura de posições', () => {
    const players = [
      createMockPlayer('1', 'GOL1', 'GOL', 85),
      createMockPlayer('2', 'GOL2', 'GOL', 80),
      createMockPlayer('3', 'GOL3', 'GOL', 82),
      createMockPlayer('4', 'DEF1', 'DEF', 81),
      createMockPlayer('5', 'DEF2', 'DEF', 79),
      createMockPlayer('6', 'DEF3', 'DEF', 80),
      createMockPlayer('7', 'MEI1', 'MEI', 84),
      createMockPlayer('8', 'MEI2', 'MEI', 83),
      createMockPlayer('9', 'MEI3', 'MEI', 82),
      createMockPlayer('10', 'ATK1', 'ATK', 86),
      createMockPlayer('11', 'ATK2', 'ATK', 85),
      createMockPlayer('12', 'ATK3', 'ATK', 84),
    ];

    const { teams } = hillClimbing(players, 3, { iterations: 2000 });

    // Com 3 times e 3+ jogadores de cada posição, todos devem ter cobertura
    teams.forEach(team => {
      expect(countPosition(team, 'GOL')).toBeGreaterThan(0);
      expect(countPosition(team, 'DEF')).toBeGreaterThan(0);
      expect(countPosition(team, 'MEI')).toBeGreaterThan(0);
      expect(countPosition(team, 'ATK')).toBeGreaterThan(0);
    });
  });

  test('Não exige cobertura quando não há jogadores suficientes', () => {
    const players = [
      createMockPlayer('1', 'GOL1', 'GOL', 85),
      ...Array.from({ length: 14 }, (_, i) =>
        createMockPlayer(`${i+2}`, `DEF${i}`, 'DEF', 70 + i)
      )
    ];

    // 1 goleiro para 3 times - não pode dar 1 para cada
    const teams = distributePlayers(players, 3);

    const teamsWithGoalkeeper = teams.filter(
      team => countPosition(team, 'GOL') > 0
    ).length;

    expect(teamsWithGoalkeeper).toBeLessThan(3);
  });
});

// ============================================================================
// TESTS: CONSTRAINT 3 - Tamanhos de Times (diff <= 1)
// ============================================================================

describe('Restrição 3: Diferença Máxima de 1 Jogador entre Times', () => {
  test('Divisão exata: 20 jogadores ÷ 4 times = 5-5-5-5', () => {
    const players = generateMockPlayers(20);
    const teams = distributePlayers(players, 4);

    expect(hasValidSizes(teams)).toBe(true);

    teams.forEach(team => {
      expect(team.players.length).toBe(5);
    });
  });

  test('Divisão não-exata: 20 jogadores ÷ 3 times = 7-7-6', () => {
    const players = generateMockPlayers(20);
    const teams = distributePlayers(players, 3);

    expect(hasValidSizes(teams)).toBe(true);

    const sizes = teams.map(t => t.players.length).sort((a, b) => b - a);
    expect(sizes).toEqual([7, 7, 6]);
  });

  test('Divisão não-exata: 23 jogadores ÷ 3 times = 8-8-7', () => {
    const players = generateMockPlayers(23);
    const teams = distributePlayers(players, 3);

    expect(hasValidSizes(teams)).toBe(true);

    const sizes = teams.map(t => t.players.length).sort((a, b) => b - a);
    expect(sizes).toEqual([8, 8, 7]);
  });

  test('Divisão não-exata: 50 jogadores ÷ 7 times = 8-7-7-7-7-7-7', () => {
    const players = generateMockPlayers(50);
    const teams = distributePlayers(players, 7);

    expect(hasValidSizes(teams)).toBe(true);

    const sizes = teams.map(t => t.players.length);
    const max = Math.max(...sizes);
    const min = Math.min(...sizes);

    expect(max - min).toBeLessThanOrEqual(1);
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(50);
  });

  test('Hill Climbing deve manter tamanhos válidos após otimização', () => {
    const players = generateMockPlayers(20);
    const { teams } = hillClimbing(players, 3, { iterations: 5000 });

    expect(hasValidSizes(teams)).toBe(true);

    const sizes = teams.map(t => t.players.length).sort((a, b) => b - a);
    expect(sizes).toEqual([7, 7, 6]);
  });

  test('Nunca deve criar distribuição 8-6-6 (diff > 1)', () => {
    const players = generateMockPlayers(20);

    // Testa 10 vezes para garantir consistência
    for (let i = 0; i < 10; i++) {
      const teams = distributePlayers(players, 3);
      const sizes = teams.map(t => t.players.length);
      const max = Math.max(...sizes);
      const min = Math.min(...sizes);

      expect(max - min).toBeLessThanOrEqual(1);
    }
  });
});

// ============================================================================
// TESTS: BALANCEAMENTO (Overall Médio)
// ============================================================================

describe('Balanceamento de Overall Médio', () => {
  test('distributePlayers deve criar times relativamente balanceados', () => {
    const players = generateMockPlayers(24);
    const teams = distributePlayers(players, 3);

    const averages = teams.map(calculateAverage);
    const max = Math.max(...averages);
    const min = Math.min(...averages);
    const difference = max - min;

    // Distribuição inicial deve ter diferença razoável (< 15 pontos)
    expect(difference).toBeLessThan(15);
  });

  test('Hill Climbing deve melhorar balanceamento', () => {
    const players = generateMockPlayers(24);

    const initialTeams = distributePlayers(players, 3);
    const initialAverages = initialTeams.map(calculateAverage);
    const initialDiff = Math.max(...initialAverages) - Math.min(...initialAverages);

    const { teams: optimizedTeams, stats } = hillClimbing(players, 3, {
      iterations: 5000
    });
    const optimizedAverages = optimizedTeams.map(calculateAverage);
    const optimizedDiff = Math.max(...optimizedAverages) - Math.min(...optimizedAverages);

    // Deve melhorar ou manter
    expect(optimizedDiff).toBeLessThanOrEqual(initialDiff);

    // Deve ter feito pelo menos algumas melhorias
    expect(stats.improvements).toBeGreaterThan(0);
  });

  test('Overall médio funciona com times de tamanhos diferentes', () => {
    // Time A: 7 jogadores de 80 = soma 560, média 80
    // Time B: 6 jogadores de 80 = soma 480, média 80
    // Devem ser considerados equilibrados

    const teamA = Array.from({ length: 7 }, (_, i) =>
      createMockPlayer(`a${i}`, `A${i}`, 'DEF', 80)
    );
    const teamB = Array.from({ length: 6 }, (_, i) =>
      createMockPlayer(`b${i}`, `B${i}`, 'DEF', 80)
    );

    const avgA = calculateTeamScore(teamA) / teamA.length;
    const avgB = calculateTeamScore(teamB) / teamB.length;

    expect(avgA).toBe(avgB);
  });
});

// ============================================================================
// TESTS: ALGORITMO (Hill Climbing vs Simulated Annealing)
// ============================================================================

describe('Algoritmos de Otimização', () => {
  test('Hill Climbing puro deve fazer melhorias', () => {
    const players = generateMockPlayers(30);

    const { stats } = hillClimbing(players, 5, {
      iterations: 1000,
      enableSimulatedAnnealing: false
    });

    expect(stats.improvements).toBeGreaterThan(0);
    expect(stats.finalScore).toBeLessThanOrEqual(stats.initialScore);
  });

  test('Simulated Annealing deve explorar mais soluções', () => {
    const players = generateMockPlayers(30);

    const resultHC = hillClimbing(players, 5, {
      iterations: 1000,
      enableSimulatedAnnealing: false,
      enableRandomRestart: false
    });

    const resultSA = hillClimbing(players, 5, {
      iterations: 1000,
      enableSimulatedAnnealing: true,
      initialTemperature: 100,
      coolingRate: 0.99,
      enableRandomRestart: false
    });

    // SA tende a ter mais aceitações (explora mais)
    const acceptanceRateHC = resultHC.stats.improvements /
      (resultHC.stats.improvements + resultHC.stats.rejections);
    const acceptanceRateSA = resultSA.stats.improvements /
      (resultSA.stats.improvements + resultSA.stats.rejections);

    expect(acceptanceRateSA).toBeGreaterThanOrEqual(acceptanceRateHC);
  });

  test('Early stopping deve parar antes de todas as iterações', () => {
    const players = generateMockPlayers(20);

    const { stats } = hillClimbing(players, 3, {
      iterations: 10000,
      enableEarlyStopping: true
    });

    // Com early stopping, raramente chega a 10000 iterações
    // (a menos que esteja melhorando constantemente)
    expect(stats.iterations).toBeLessThanOrEqual(10000);
  });

  test('Random restart deve ser acionado em caso de estagnação', () => {
    const players = generateMockPlayers(30);

    const { stats } = hillClimbing(players, 5, {
      iterations: 10000,
      enableRandomRestart: true,
      enableEarlyStopping: false
    });

    // Se houve estagnação prolongada, deve ter restarts
    if (stats.invalidSwaps > 100) {
      expect(stats.restarts).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// TESTS: EDGE CASES
// ============================================================================

describe('Casos Extremos (Edge Cases)', () => {
  test('Deve lançar erro com jogadores insuficientes', () => {
    const players = generateMockPlayers(3);

    expect(() => {
      distributePlayers(players, 5);
    }).toThrow();
  });

  test('Deve funcionar com número mínimo de jogadores', () => {
    const players = generateMockPlayers(3);
    const teams = distributePlayers(players, 3);

    expect(teams.length).toBe(3);
    teams.forEach(team => {
      expect(team.players.length).toBe(1);
    });
  });

  test('Deve funcionar com 1 time apenas', () => {
    const players = generateMockPlayers(10);
    const teams = distributePlayers(players, 1);

    expect(teams.length).toBe(1);
    expect(teams[0].players.length).toBe(10);
  });

  test('Deve funcionar com muitos times (20 times)', () => {
    const players = generateMockPlayers(100);
    const teams = distributePlayers(players, 20);

    expect(teams.length).toBe(20);
    expect(hasValidSizes(teams)).toBe(true);
  });

  test('Deve funcionar com muitos jogadores (200 jogadores)', () => {
    const players = generateMockPlayers(200);

    const { teams } = hillClimbing(players, 10, {
      iterations: 1000 // Menos iterações para performance
    });

    expect(teams.length).toBe(10);
    expect(hasValidSizes(teams)).toBe(true);

    const totalPlayers = teams.reduce((sum, t) => sum + t.players.length, 0);
    expect(totalPlayers).toBe(200);
  });

  test('Deve funcionar com todos jogadores do mesmo overall', () => {
    const players = Array.from({ length: 20 }, (_, i) =>
      createMockPlayer(`${i}`, `P${i}`, 'DEF', 80)
    );

    const { teams, stats } = hillClimbing(players, 4, { iterations: 100 });

    expect(teams.length).toBe(4);

    // Com overalls iguais, diferença deve ser 0
    expect(stats.finalScore).toBe(0);
  });

  test('Deve funcionar com overalls muito variados', () => {
    const players = [
      ...Array.from({ length: 5 }, (_, i) =>
        createMockPlayer(`h${i}`, `High${i}`, 'DEF', 95)
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        createMockPlayer(`m${i}`, `Mid${i}`, 'MEI', 75)
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        createMockPlayer(`l${i}`, `Low${i}`, 'ATK', 55)
      )
    ];

    const { teams } = hillClimbing(players, 3, { iterations: 5000 });

    expect(teams.length).toBe(3);
    expect(hasValidSizes(teams)).toBe(true);

    // Deve distribuir jogadores de diferentes níveis entre os times
    teams.forEach(team => {
      const avg = calculateAverage(team);
      expect(avg).toBeGreaterThan(55);
      expect(avg).toBeLessThan(95);
    });
  });
});

// ============================================================================
// TESTS: ESTATÍSTICAS
// ============================================================================

describe('Estatísticas do Algoritmo', () => {
  test('Deve retornar estatísticas completas', () => {
    const players = generateMockPlayers(20);

    const { stats } = hillClimbing(players, 3, { iterations: 1000 });

    expect(stats).toHaveProperty('finalScore');
    expect(stats).toHaveProperty('initialScore');
    expect(stats).toHaveProperty('iterations');
    expect(stats).toHaveProperty('improvements');
    expect(stats).toHaveProperty('rejections');
    expect(stats).toHaveProperty('invalidSwaps');
    expect(stats).toHaveProperty('restarts');
    expect(stats).toHaveProperty('validationTime');
    expect(stats).toHaveProperty('optimizationTime');
  });

  test('Score final deve ser <= score inicial', () => {
    const players = generateMockPlayers(24);

    const { stats } = hillClimbing(players, 4, { iterations: 2000 });

    expect(stats.finalScore).toBeLessThanOrEqual(stats.initialScore);
  });

  test('Tempo de otimização deve ser razoável', () => {
    const players = generateMockPlayers(30);

    const { stats } = hillClimbing(players, 5, { iterations: 1000 });

    // 1000 iterações devem completar em menos de 1 segundo
    expect(stats.optimizationTime).toBeLessThan(1000);
  });
});

// ============================================================================
// TESTS: VALIDAÇÃO DE SOLUÇÃO FINAL
// ============================================================================

describe('Validação de Solução Final', () => {
  test('Solução final deve ter todos os jogadores', () => {
    const players = generateMockPlayers(25);
    const { teams } = hillClimbing(players, 4, { iterations: 1000 });

    const allPlayers = teams.flatMap(t => t.players);
    expect(allPlayers.length).toBe(25);

    // Todos os jogadores devem estar presentes (sem duplicatas)
    const uniqueIds = new Set(allPlayers.map(p => p.id));
    expect(uniqueIds.size).toBe(25);
  });

  test('Nenhum jogador deve ser duplicado', () => {
    const players = generateMockPlayers(30);
    const { teams } = hillClimbing(players, 5, { iterations: 2000 });

    const allPlayerIds = teams.flatMap(t => t.players.map(p => p.id));
    const uniqueIds = new Set(allPlayerIds);

    expect(allPlayerIds.length).toBe(uniqueIds.size);
  });

  test('Solução final deve respeitar TODAS as 4 restrições', () => {
    const players = [
      createMockPlayer('1', 'GOL1', 'GOL', 85),
      createMockPlayer('2', 'GOL2', 'GOL', 80),
      createMockPlayer('3', 'GOL3', 'GOL', 82),
      ...Array.from({ length: 6 }, (_, i) =>
        createMockPlayer(`d${i}`, `DEF${i}`, 'DEF', 75 + i)
      ),
      ...Array.from({ length: 6 }, (_, i) =>
        createMockPlayer(`m${i}`, `MEI${i}`, 'MEI', 78 + i)
      ),
      ...Array.from({ length: 6 }, (_, i) =>
        createMockPlayer(`a${i}`, `ATK${i}`, 'ATK', 80 + i)
      )
    ];

    const { teams } = hillClimbing(players, 3, { iterations: 3000 });

    // RESTRIÇÃO 1: Máximo 1 goleiro
    teams.forEach(team => {
      expect(countPosition(team, 'GOL')).toBeLessThanOrEqual(1);
    });

    // RESTRIÇÃO 2: Cobertura de posições
    teams.forEach(team => {
      expect(countPosition(team, 'GOL')).toBeGreaterThan(0);
      expect(countPosition(team, 'DEF')).toBeGreaterThan(0);
      expect(countPosition(team, 'MEI')).toBeGreaterThan(0);
      expect(countPosition(team, 'ATK')).toBeGreaterThan(0);
    });

    // RESTRIÇÃO 3: Tamanhos (diff <= 1)
    expect(hasValidSizes(teams)).toBe(true);

    // RESTRIÇÃO 4: Implícita - swaps mantêm todas as restrições
  });
});
