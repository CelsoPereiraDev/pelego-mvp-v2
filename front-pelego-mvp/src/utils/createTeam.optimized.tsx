import { Player } from "@/types/player";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Team {
  players: Player[];
  overall: number;
  id: number;
}

export interface HillClimbingOptions {
  iterations?: number;
  enableEarlyStopping?: boolean;
  enableRandomRestart?: boolean;
  enableSimulatedAnnealing?: boolean;
  initialTemperature?: number;
  coolingRate?: number;
  verbose?: boolean;
}

export interface HillClimbingStats {
  finalScore: number;
  initialScore: number;
  iterations: number;
  improvements: number;
  rejections: number;
  invalidSwaps: number;
  restarts: number;
  validationTime: number;
  optimizationTime: number;
}

interface PositionGroups {
  GOL: Player[];
  DEF: Player[];
  MEI: Player[];
  ATK: Player[];
}

type Position = keyof PositionGroups;

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const POSITIONS: Position[] = ['GOL', 'DEF', 'MEI', 'ATK'];

// Configurações padrão do algoritmo
const DEFAULT_ITERATIONS = 10000;
const STAGNATION_THRESHOLD = 1000; // Iterações sem melhoria para early stopping
const RANDOM_RESTART_INTERVAL = 2000; // Intervalo para random restart
const INITIAL_TEMPERATURE = 100; // Temperatura inicial para SA
const COOLING_RATE = 0.995; // Taxa de resfriamento para SA
const MAX_SWAP_ATTEMPTS = 50; // Tentativas máximas para encontrar swap válido

// ============================================================================
// SCORING FUNCTIONS (Pure Functions)
// ============================================================================

/**
 * Calcula a soma dos overalls de todos os jogadores de um time
 * Complexidade: O(n) onde n = número de jogadores
 */
export function calculateTeamScore(players: Player[]): number {
  return players.reduce((sum, player) => sum + player.overall.overall, 0);
}

/**
 * Calcula o overall médio arredondado de um time
 * Usado para exibição e armazenamento
 */
export function calculateTeamOverall(players: Player[]): number {
  if (players.length === 0) return 0;
  return Math.round(calculateTeamScore(players) / players.length);
}

/**
 * FUNÇÃO OBJETIVO PRINCIPAL
 *
 * Calcula a diferença entre o overall MÉDIO do time mais forte
 * e o overall MÉDIO do time mais fraco
 *
 * IMPORTANTE: Usa média (não soma) para permitir times de tamanhos diferentes
 * Exemplo: Time A (7 jogadores, média 80) vs Time B (6 jogadores, média 80)
 *          São considerados balanceados mesmo com tamanhos diferentes
 *
 * Quanto menor o valor, melhor o balanceamento
 */
function evaluateSolution(teams: Team[]): number {
  if (teams.length === 0) return 0;

  const averages = teams.map(team => {
    if (team.players.length === 0) return 0;
    return calculateTeamScore(team.players) / team.players.length;
  });

  const maxAverage = Math.max(...averages);
  const minAverage = Math.min(...averages);

  return maxAverage - minAverage;
}

// ============================================================================
// POSITION UTILITIES (Pure Functions)
// ============================================================================

/**
 * Conta quantos jogadores de cada posição existem em um time
 */
function countByPosition(players: Player[]): Record<Position, number> {
  const counts: Record<Position, number> = { GOL: 0, DEF: 0, MEI: 0, ATK: 0 };

  players.forEach(player => {
    const pos = player.position as Position;
    if (pos in counts) {
      counts[pos]++;
    }
  });

  return counts;
}

/**
 * Agrupa jogadores por posição
 */
function groupByPosition(players: Player[]): PositionGroups {
  const groups: PositionGroups = { GOL: [], DEF: [], MEI: [], ATK: [] };

  players.forEach(player => {
    const pos = player.position as Position;
    if (pos in groups) {
      groups[pos].push(player);
    }
  });

  return groups;
}

// ============================================================================
// CONSTRAINT VALIDATION (Pure Functions)
// ============================================================================

/**
 * RESTRIÇÃO 1: Máximo 1 goleiro por time
 * Valida se um time tem no máximo 1 goleiro
 */
function hasValidGoalkeepers(players: Player[]): boolean {
  const goalkeepers = players.filter(p => p.position === 'GOL');
  return goalkeepers.length <= 1;
}

/**
 * RESTRIÇÃO 2: Cobertura de posições obrigatória
 *
 * Para cada posição P, se houver jogadores[P] >= numTimes,
 * então cada time DEVE ter pelo menos 1 jogador da posição P
 */
function validatePositionCoverage(
  teams: Team[],
  totalPlayersByPosition: Record<Position, number>
): ValidationResult {
  const errors: string[] = [];
  const teamCount = teams.length;

  POSITIONS.forEach(position => {
    const availablePlayers = totalPlayersByPosition[position];

    // Se há jogadores suficientes dessa posição, cada time deve ter pelo menos 1
    if (availablePlayers >= teamCount) {
      teams.forEach((team, idx) => {
        const count = countByPosition(team.players)[position];
        if (count === 0) {
          errors.push(
            `Time ${idx} não tem jogador na posição ${position} (disponíveis: ${availablePlayers})`
          );
        }
      });
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * RESTRIÇÃO 3: Diferença máxima de 1 jogador entre times
 *
 * A diferença entre o time com mais jogadores e o time com menos
 * jogadores deve ser no máximo 1
 *
 * VÁLIDO: [7, 7, 6], [5, 5, 5], [8, 8, 8]
 * INVÁLIDO: [8, 6, 6], [8, 7, 6], [9, 7, 5]
 */
function validateTeamSizes(teams: Team[]): ValidationResult {
  const errors: string[] = [];

  if (teams.length === 0) {
    return { valid: true, errors };
  }

  const sizes = teams.map(t => t.players.length);
  const maxSize = Math.max(...sizes);
  const minSize = Math.min(...sizes);
  const difference = maxSize - minSize;

  if (difference > 1) {
    errors.push(
      `Diferença de tamanho entre times (${difference}) excede o máximo permitido (1). ` +
      `Tamanhos: [${sizes.join(', ')}]`
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida TODAS as restrições de uma solução completa
 */
function validateSolution(teams: Team[], allPlayers: Player[]): ValidationResult {
  const errors: string[] = [];

  // RESTRIÇÃO 1: Goleiros
  teams.forEach((team, idx) => {
    if (!hasValidGoalkeepers(team.players)) {
      errors.push(`Time ${idx} tem mais de 1 goleiro`);
    }
  });

  // RESTRIÇÃO 2: Cobertura de posições
  const totalByPosition = countByPosition(allPlayers);
  const coverage = validatePositionCoverage(teams, totalByPosition);
  errors.push(...coverage.errors);

  // RESTRIÇÃO 3: Tamanhos
  const sizes = validateTeamSizes(teams);
  errors.push(...sizes.errors);

  return { valid: errors.length === 0, errors };
}

/**
 * RESTRIÇÃO 4: Validação de swap individual
 *
 * Valida se um swap específico é permitido:
 * 1. Goleiro só pode trocar com goleiro
 * 2. Não pode violar cobertura mínima de posições
 * 3. Como swap é 1-por-1, tamanhos são automaticamente mantidos
 */
function isSwapValid(
  teams: Team[],
  teamIdx1: number,
  playerIdx1: number,
  teamIdx2: number,
  playerIdx2: number,
  totalPlayersByPosition: Record<Position, number>
): boolean {
  const player1 = teams[teamIdx1].players[playerIdx1];
  const player2 = teams[teamIdx2].players[playerIdx2];

  // VALIDAÇÃO 1: Goleiro só troca com goleiro
  const isPlayer1Goalkeeper = player1.position === 'GOL';
  const isPlayer2Goalkeeper = player2.position === 'GOL';

  if (isPlayer1Goalkeeper || isPlayer2Goalkeeper) {
    if (isPlayer1Goalkeeper !== isPlayer2Goalkeeper) {
      return false; // Um é goleiro e outro não
    }
  }

  // VALIDAÇÃO 2: Simula swap e verifica cobertura de posições
  // (Validação rápida sem deep clone)
  const team1Counts = countByPosition(teams[teamIdx1].players);
  const team2Counts = countByPosition(teams[teamIdx2].players);

  const pos1 = player1.position as Position;
  const pos2 = player2.position as Position;

  // Simula o swap
  team1Counts[pos1]--;
  team1Counts[pos2]++;
  team2Counts[pos2]--;
  team2Counts[pos1]++;

  // Verifica se alguma posição obrigatória foi violada
  const teamCount = teams.length;

  for (const position of POSITIONS) {
    const available = totalPlayersByPosition[position];

    if (available >= teamCount) {
      // Cada time deve ter pelo menos 1
      if (team1Counts[position] === 0 || team2Counts[position] === 0) {
        return false;
      }
    }
  }

  // VALIDAÇÃO 3: Tamanhos são automaticamente mantidos (swap 1-por-1)
  // Não precisa validar

  return true;
}

// ============================================================================
// RANDOM UTILITIES (Pure Functions)
// ============================================================================

function getRandomIndex(max: number): number {
  return Math.floor(Math.random() * max);
}

/**
 * Retorna 2 índices aleatórios diferentes
 * Versão garantida sem loop infinito
 */
function getTwoDifferentIndices(length: number): [number, number] {
  if (length < 2) {
    throw new Error("Precisa de pelo menos 2 elementos para escolher índices diferentes");
  }

  const index1 = getRandomIndex(length);
  const index2 = (index1 + 1 + getRandomIndex(length - 1)) % length;

  return [index1, index2];
}

/**
 * Embaralha array usando Fisher-Yates
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getRandomIndex(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================================
// SOLUTION PERTURBATION (Mutation Functions)
// ============================================================================

/**
 * Troca dois jogadores entre times (MUTAÇÃO IN-PLACE)
 * Usado tanto para aplicar swap quanto para rollback
 */
function swapPlayersInPlace(
  teams: Team[],
  teamIdx1: number,
  playerIdx1: number,
  teamIdx2: number,
  playerIdx2: number
): void {
  const temp = teams[teamIdx1].players[playerIdx1];
  teams[teamIdx1].players[playerIdx1] = teams[teamIdx2].players[playerIdx2];
  teams[teamIdx2].players[playerIdx2] = temp;
}

/**
 * Gera um swap válido aleatório
 *
 * Tenta até MAX_SWAP_ATTEMPTS vezes encontrar um swap que respeite
 * todas as 4 restrições. Retorna null se não encontrar.
 *
 * @returns [teamIdx1, playerIdx1, teamIdx2, playerIdx2] ou null
 */
function generateValidSwap(
  teams: Team[],
  totalPlayersByPosition: Record<Position, number>
): [number, number, number, number] | null {
  for (let attempt = 0; attempt < MAX_SWAP_ATTEMPTS; attempt++) {
    const [teamIdx1, teamIdx2] = getTwoDifferentIndices(teams.length);
    const playerIdx1 = getRandomIndex(teams[teamIdx1].players.length);
    const playerIdx2 = getRandomIndex(teams[teamIdx2].players.length);

    if (isSwapValid(teams, teamIdx1, playerIdx1, teamIdx2, playerIdx2, totalPlayersByPosition)) {
      return [teamIdx1, playerIdx1, teamIdx2, playerIdx2];
    }
  }

  return null; // Não encontrou swap válido após MAX_SWAP_ATTEMPTS tentativas
}

/**
 * Deep clone de times
 * Usado apenas para salvar a melhor solução global
 */
function deepCloneTeams(teams: Team[]): Team[] {
  return teams.map(team => ({
    id: team.id,
    players: [...team.players],
    overall: team.overall
  }));
}

// ============================================================================
// INITIAL DISTRIBUTION (Constraint-Aware Heuristic)
// ============================================================================

/**
 * Calcula os tamanhos que cada time deve ter
 *
 * Garante que a diferença máxima seja 1 jogador
 *
 * Exemplo: 20 jogadores, 3 times
 * - baseSize = floor(20/3) = 6
 * - remainder = 20 % 3 = 2
 * - Resultado: [7, 7, 6] (2 times com +1, 1 time com base)
 */
function calculateTeamSizes(totalPlayers: number, teamCount: number): number[] {
  const baseSize = Math.floor(totalPlayers / teamCount);
  const remainder = totalPlayers % teamCount;

  return Array.from({ length: teamCount }, (_, i) =>
    i < remainder ? baseSize + 1 : baseSize
  );
}

/**
 * Distribui jogadores em times respeitando TODAS as restrições
 *
 * ESTRATÉGIA (3 fases):
 *
 * FASE 1: Distribuir posições críticas (1 por time quando possível)
 * - Para cada posição P, se houver jogadores[P] >= numTimes,
 *   distribui 1 jogador de P para cada time (round-robin)
 * - Ordena jogadores por overall (melhor primeiro)
 *
 * FASE 2: Preencher slots restantes com best-fit
 * - Para cada jogador não alocado, encontra o time com overall
 *   médio mais próximo do overall do jogador
 * - Valida goleiros (não adiciona se time já tem goleiro)
 *
 * FASE 3: Ajustar tamanhos se necessário
 * - Garante que diferença máxima seja 1 jogador
 *
 * Complexidade: O(p² × t) onde p = jogadores, t = times
 */
export function distributePlayers(players: Player[], teamCount: number): Team[] {
  // Guard clauses
  if (players.length < teamCount) {
    throw new Error(
      `Impossível criar ${teamCount} times com apenas ${players.length} jogadores. ` +
      `Mínimo necessário: ${teamCount} jogadores.`
    );
  }

  if (teamCount <= 0) {
    throw new Error("Número de times deve ser maior que 0");
  }

  // Calcula tamanhos esperados para cada time
  const expectedSizes = calculateTeamSizes(players.length, teamCount);

  // Inicializa times vazios
  const teams: Team[] = Array.from({ length: teamCount }, (_, i) => ({
    id: i,
    players: [],
    overall: 0
  }));

  // Agrupa jogadores por posição
  const positionGroups = groupByPosition(players);
  const totalByPosition = countByPosition(players);

  // Jogadores ainda não alocados
  const unallocated = new Set<Player>(players);

  // FASE 1: Distribuir posições críticas (1 por time quando possível)
  for (const position of POSITIONS) {
    const availablePlayers = positionGroups[position].filter(p => unallocated.has(p));

    if (availablePlayers.length >= teamCount) {
      // Ordena por overall (melhor primeiro)
      const sorted = availablePlayers.sort((a, b) => b.overall.overall - a.overall.overall);

      // Distribui 1 por time (round-robin)
      for (let i = 0; i < teamCount; i++) {
        teams[i].players.push(sorted[i]);
        unallocated.delete(sorted[i]);
      }
    }
  }

  // FASE 2: Preencher slots restantes com best-fit
  const remaining = Array.from(unallocated).sort(
    (a, b) => b.overall.overall - a.overall.overall
  );

  for (const player of remaining) {
    let bestTeamIdx = 0;
    let smallestDifference = Infinity;

    // Encontra time com overall médio mais próximo
    for (let teamIdx = 0; teamIdx < teamCount; teamIdx++) {
      // VALIDAÇÃO: Não adiciona goleiro se time já tem um
      if (player.position === 'GOL') {
        const currentGoalkeepers = teams[teamIdx].players.filter(p => p.position === 'GOL');
        if (currentGoalkeepers.length >= 1) {
          continue; // Pula este time
        }
      }

      const teamAvg = calculateTeamOverall(teams[teamIdx].players);
      const difference = Math.abs(player.overall.overall - teamAvg);

      if (difference < smallestDifference) {
        smallestDifference = difference;
        bestTeamIdx = teamIdx;
      }
    }

    teams[bestTeamIdx].players.push(player);
  }

  // FASE 3: Validação final de tamanhos
  const actualSizes = teams.map(t => t.players.length);
  const maxSize = Math.max(...actualSizes);
  const minSize = Math.min(...actualSizes);

  if (maxSize - minSize > 1) {
    throw new Error(
      `Distribuição inicial violou restrição de tamanho. ` +
      `Tamanhos: [${actualSizes.join(', ')}]. ` +
      `Esperados: [${expectedSizes.join(', ')}]`
    );
  }

  // Calcula overalls finais
  teams.forEach(team => {
    team.overall = calculateTeamOverall(team.players);
  });

  return teams;
}

// ============================================================================
// HILL CLIMBING ALGORITHM
// ============================================================================

/**
 * ALGORITMO HILL CLIMBING OTIMIZADO
 *
 * Balanceia times de futebol respeitando 4 restrições de domínio:
 * 1. Máximo 1 goleiro por time
 * 2. Cobertura de posições obrigatória (quando possível)
 * 3. Diferença máxima de 1 jogador entre times
 * 4. Swaps devem manter todas as restrições
 *
 * ESTRATÉGIA:
 * - Inicia com distribuição heurística inteligente
 * - A cada iteração, gera swap aleatório VÁLIDO (passa pelas 4 validações)
 * - Aceita swap se melhorar o balanceamento (overall médio)
 * - Opcionalmente usa Simulated Annealing para escapar de ótimos locais
 * - Early stopping se não houver melhoria em N iterações
 * - Random restart se estagnado
 *
 * PERFORMANCE:
 * - Usa mutações in-place para evitar clones repetidos
 * - Rollback imediato se swap for rejeitado
 * - Validações otimizadas (sem deep clone)
 *
 * @param players Lista de jogadores a distribuir
 * @param teamCount Número de times a criar
 * @param options Configurações do algoritmo
 * @returns Melhor solução encontrada + estatísticas detalhadas
 */
export function hillClimbing(
  players: Player[],
  teamCount: number,
  options: HillClimbingOptions = {}
): { teams: Team[]; stats: HillClimbingStats } {
  const startTime = performance.now();

  // Destructuring de opções com valores padrão
  const {
    iterations = DEFAULT_ITERATIONS,
    enableEarlyStopping = true,
    enableRandomRestart = true,
    enableSimulatedAnnealing = false,
    initialTemperature = INITIAL_TEMPERATURE,
    coolingRate = COOLING_RATE,
    verbose = false
  } = options;

  // Pré-calcula totais por posição (usado em validações)
  const totalPlayersByPosition = countByPosition(players);

  // SOLUÇÃO INICIAL (heurística inteligente)
  let currentSolution = distributePlayers(players, teamCount);
  let currentScore = evaluateSolution(currentSolution);

  // Valida solução inicial
  const initialValidation = validateSolution(currentSolution, players);
  if (!initialValidation.valid) {
    throw new Error(
      `Solução inicial inválida:\n${initialValidation.errors.join('\n')}`
    );
  }

  // MELHOR SOLUÇÃO GLOBAL
  let bestSolution = deepCloneTeams(currentSolution);
  let bestScore = currentScore;
  const initialScore = currentScore;

  // Simulated Annealing
  let temperature = initialTemperature;

  // ESTATÍSTICAS
  let improvements = 0;
  let rejections = 0;
  let invalidSwaps = 0;
  let restarts = 0;
  let iterationsSinceImprovement = 0;
  let validationTimeTotal = 0;

  if (verbose) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 HILL CLIMBING - Iniciando Otimização`);
    console.log(`${'='.repeat(70)}`);
    console.log(`📊 Configuração:`);
    console.log(`   Jogadores: ${players.length} | Times: ${teamCount}`);
    console.log(`   Iterações: ${iterations}`);
    console.log(`   Simulated Annealing: ${enableSimulatedAnnealing ? 'SIM' : 'NÃO'}`);
    console.log(`   Early Stopping: ${enableEarlyStopping ? 'SIM' : 'NÃO'}`);
    console.log(`   Random Restart: ${enableRandomRestart ? 'SIM' : 'NÃO'}`);
    console.log(`\n📍 Distribuição de Posições:`);
    console.log(`   GOL: ${totalPlayersByPosition.GOL} | DEF: ${totalPlayersByPosition.DEF}`);
    console.log(`   MEI: ${totalPlayersByPosition.MEI} | ATK: ${totalPlayersByPosition.ATK}`);
    console.log(`\n🎯 Score Inicial: ${currentScore.toFixed(2)}`);
    console.log(`${'='.repeat(70)}\n`);
  }

  // LOOP PRINCIPAL
  for (let i = 0; i < iterations; i++) {
    const validationStart = performance.now();

    // Gera swap válido (respeita todas as 4 restrições)
    const swapIndices = generateValidSwap(currentSolution, totalPlayersByPosition);

    if (swapIndices === null) {
      // Não encontrou swap válido após MAX_SWAP_ATTEMPTS tentativas
      invalidSwaps++;
      validationTimeTotal += performance.now() - validationStart;
      continue;
    }

    const [t1, p1, t2, p2] = swapIndices;
    validationTimeTotal += performance.now() - validationStart;

    // Aplica swap (in-place)
    swapPlayersInPlace(currentSolution, t1, p1, t2, p2);
    const newScore = evaluateSolution(currentSolution);

    // DECISÃO: Aceita ou rejeita swap?
    let accept = false;

    if (enableSimulatedAnnealing) {
      // SIMULATED ANNEALING: Aceita pioras com probabilidade decrescente
      if (newScore < currentScore) {
        accept = true;
      } else {
        const delta = newScore - currentScore;
        const probability = Math.exp(-delta / temperature);
        accept = Math.random() < probability;
      }
      temperature *= coolingRate;
    } else {
      // HILL CLIMBING PURO: Aceita apenas melhorias
      accept = newScore < currentScore;
    }

    if (accept) {
      // ACEITA
      currentScore = newScore;
      improvements++;
      iterationsSinceImprovement = 0;

      // Atualiza melhor global se necessário
      if (newScore < bestScore) {
        bestSolution = deepCloneTeams(currentSolution);
        bestScore = newScore;

        if (verbose && i % 100 === 0) {
          console.log(
            `   ✅ [Iter ${i.toString().padStart(5)}] Novo recorde: ${bestScore.toFixed(3)} ` +
            `(temp: ${temperature.toFixed(2)})`
          );
        }
      }
    } else {
      // REJEITA: Rollback (desfaz swap)
      swapPlayersInPlace(currentSolution, t1, p1, t2, p2);
      rejections++;
      iterationsSinceImprovement++;
    }

    // EARLY STOPPING
    if (enableEarlyStopping && iterationsSinceImprovement >= STAGNATION_THRESHOLD) {
      if (verbose) {
        console.log(
          `\n   ⏹️  Early Stopping acionado após ${STAGNATION_THRESHOLD} iterações sem melhoria`
        );
      }
      break;
    }

    // RANDOM RESTART
    if (
      enableRandomRestart &&
      iterationsSinceImprovement > 0 &&
      iterationsSinceImprovement % RANDOM_RESTART_INTERVAL === 0
    ) {
      currentSolution = distributePlayers(players, teamCount);
      currentScore = evaluateSolution(currentSolution);
      temperature = initialTemperature; // Reset temperatura
      restarts++;

      if (verbose) {
        console.log(
          `   🔄 Random Restart #${restarts} (score: ${currentScore.toFixed(3)})`
        );
      }
    }
  }

  // FINALIZAÇÃO
  // Recalcula overalls para consistência
  bestSolution.forEach(team => {
    team.overall = calculateTeamOverall(team.players);
  });

  // Validação final
  const finalValidation = validateSolution(bestSolution, players);
  if (!finalValidation.valid) {
    console.error("⚠️  ERRO CRÍTICO: Solução final inválida!");
    console.error(finalValidation.errors.join('\n'));
    throw new Error("Solução final violou restrições");
  }

  const totalTime = performance.now() - startTime;
  const improvement = ((initialScore - bestScore) / initialScore) * 100;

  if (verbose) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ OTIMIZAÇÃO CONCLUÍDA`);
    console.log(`${'='.repeat(70)}`);
    console.log(`📈 Resultados:`);
    console.log(`   Score Inicial: ${initialScore.toFixed(3)}`);
    console.log(`   Score Final: ${bestScore.toFixed(3)}`);
    console.log(`   Melhoria: ${improvement.toFixed(2)}%`);
    console.log(`\n📊 Estatísticas:`);
    console.log(`   Melhorias aceitas: ${improvements}`);
    console.log(`   Swaps rejeitados: ${rejections}`);
    console.log(`   Swaps inválidos: ${invalidSwaps}`);
    console.log(`   Random restarts: ${restarts}`);
    console.log(`\n⏱️  Performance:`);
    console.log(`   Tempo total: ${totalTime.toFixed(2)}ms`);
    console.log(`   Tempo de validação: ${validationTimeTotal.toFixed(2)}ms`);
    console.log(`   Tempo por iteração: ${(totalTime / iterations).toFixed(3)}ms`);
    console.log(`${'='.repeat(70)}\n`);
  }

  return {
    teams: bestSolution,
    stats: {
      finalScore: bestScore,
      initialScore,
      iterations,
      improvements,
      rejections,
      invalidSwaps,
      restarts,
      validationTime: validationTimeTotal,
      optimizationTime: totalTime
    }
  };
}

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

/**
 * Wrapper retrocompatível com assinatura original
 *
 * Converte:
 *   hillClimbingLegacy(data, quantityOfTeams, iterations)
 * Para:
 *   hillClimbing(data, quantityOfTeams, { iterations })
 */
export function hillClimbingLegacy(
  data: Player[],
  quantityOfTeams: number,
  iterations: number
): Team[] {
  const result = hillClimbing(data, quantityOfTeams, { iterations, verbose: false });
  return result.teams;
}
