import { Player } from '@/types/player';

interface Team {
  players: Player[];
  overall: number;
  id: number;
}

// Função para calcular a pontuação total de um time
function calculateTeamScore(team: Player[]): number {
  return team.reduce((total, player) => total + player.overall.overall, 0);
}

export function calculateTeamOverall(team: Player[]): number {
  const totalOverall = team.reduce((total, player) => total + player.overall.overall, 0);
  const numberOfPlayers = team.length;
  if (numberOfPlayers === 0) {
    return 0; // Evita a divisão por zero
  }
  const averageOverall = totalOverall / numberOfPlayers;
  return Math.round(averageOverall);
}

export function hillClimbing(data: Player[], quantityOfTeams: number, iterations: number): Team[] {
  let bestSolution: Team[] = distributePlayers(data, quantityOfTeams); // Distribuição inicial
  let bestScore = calculateTeamScoreDifference(bestSolution); // Pontuação inicial

  for (let i = 0; i < iterations; i++) {
    const newSolution = perturbSolution(bestSolution); // Gera uma nova solução perturbando a melhor solução atual
    const newScore = calculateTeamScoreDifference(newSolution); // Avalia a nova solução

    if (newScore < bestScore) {
      bestSolution = newSolution; // Atualiza a melhor solução se a nova solução for melhor
      bestScore = newScore;
    }
  }

  return bestSolution;
}

function calculateTeamScoreDifference(teams: Team[]): number {
  const scores = teams.map((team) => calculateTeamScore(team.players));
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  return maxScore - minScore; // Retorna a diferença entre a pontuação máxima e mínima das equipes
}

function perturbSolution(solution: Team[]): Team[] {
  // Clona a solução atual
  const newSolution = solution.map((team) => ({
    id: team.id,
    players: [...team.players],
    overall: team.overall,
  }));

  // Escolhe duas equipes aleatórias
  const [teamIndex1, teamIndex2] = getRandomIndices(newSolution.length);

  // Escolhe dois jogadores aleatórios dessas equipes
  const playerIndex1 = getRandomIndex(newSolution[teamIndex1].players.length);
  const playerIndex2 = getRandomIndex(newSolution[teamIndex2].players.length);

  // Troca os jogadores entre as equipes
  const temp = newSolution[teamIndex1].players[playerIndex1];
  newSolution[teamIndex1].players[playerIndex1] = newSolution[teamIndex2].players[playerIndex2];
  newSolution[teamIndex2].players[playerIndex2] = temp;

  return newSolution;
}

function getRandomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

function getRandomIndices(length: number): [number, number] {
  const index1 = getRandomIndex(length);
  let index2 = getRandomIndex(length);
  while (index2 === index1) {
    index2 = getRandomIndex(length); // Garante que index2 é diferente de index1
  }
  return [index1, index2];
}

export function distributePlayers(data: Player[], quantityOfTeams: number): Team[] {
  // Verificar se há jogadores suficientes para distribuir entre as equipes
  if (data.length < quantityOfTeams) {
    throw new Error('Não há jogadores suficientes para distribuir entre as equipes.');
  }

  // Calcular o número básico de jogadores por equipe e o número de jogadores restantes
  const playersPerTeam = Math.floor(data.length / quantityOfTeams);
  const remainingPlayers = data.length % quantityOfTeams;

  // Inicializar os times
  const teams: Player[][] = new Array(quantityOfTeams).fill([]).map(() => []);

  // Ordenar os jogadores pelo overall (do melhor para o pior)
  const sortedPlayers = data.slice().sort((a, b) => b.overall.overall - a.overall.overall);

  // Selecionar o melhor jogador possível para cada equipe
  for (let i = 0; i < quantityOfTeams; i++) {
    teams[i].push(sortedPlayers.shift()!); // Adiciona o melhor jogador à equipe
  }

  // Distribuir os jogadores restantes
  for (let i = 0; i < playersPerTeam - 1; i++) {
    for (let j = 0; j < quantityOfTeams; j++) {
      const teamOverall = calculateTeamOverall(teams[j]);

      let bestFitIndex = -1;
      let smallestDifference = Infinity;
      for (let k = 0; k < sortedPlayers.length; k++) {
        const difference = Math.abs(sortedPlayers[k].overall.overall - teamOverall);
        if (difference < smallestDifference && !teams.flat().includes(sortedPlayers[k])) {
          bestFitIndex = k;
          smallestDifference = difference;
        }
      }

      teams[j].push(sortedPlayers.splice(bestFitIndex, 1)[0]);
    }
  }

  // Distribuir os jogadores "sobrantes"
  for (let i = 0; i < remainingPlayers; i++) {
    const teamOverall = calculateTeamOverall(teams[i]);

    let bestFitIndex = -1;
    let smallestDifference = Infinity;
    for (let k = 0; k < sortedPlayers.length; k++) {
      const difference = Math.abs(sortedPlayers[k].overall.overall - teamOverall);
      if (difference < smallestDifference && !teams.flat().includes(sortedPlayers[k])) {
        bestFitIndex = k;
        smallestDifference = difference;
      }
    }

    teams[i].push(sortedPlayers.splice(bestFitIndex, 1)[0]);
  }

  // Calcular a pontuação total de cada time e retornar os times com seus overalls
  return teams.map((team, index) => ({
    id: index,
    players: team,
    overall: calculateTeamOverall(team),
  }));
}
