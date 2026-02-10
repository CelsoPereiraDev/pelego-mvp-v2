import { MatchResponse } from "@/types/match";
import { Player } from "@/types/player";

interface Team {
    players: Player[];
    overall: number;
    id: number; 
}

interface WeekResponse {
    id: string;
    date: Date;
    teams: TeamResponse[];
}

interface TeamResponse {
    id: string;
    champion: boolean;
    players: TeamMember[];
    matchesHome: MatchResponse[];
    matchesAway: MatchResponse[];
    weekId: string;
}

interface TeamMember {
    id: string;
    player: PlayerResponse;
    playerId: string;
    teamId: string;
}

interface PlayerResponse {
    id: string;
    name: string;
    overall: number;
}

// Função para calcular a pontuação total de um time
function newCalculateTeamScore(team: Player[]): number {
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

export function hillClimbingWithWeeks(weeks: WeekResponse[], quantityOfTeams: number, iterations: number): Team[] {
    let bestSolution: Team[] = distributePlayersAcrossWeeks(weeks, quantityOfTeams); // Distribuição inicial
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
    const scores = teams.map(team => newCalculateTeamScore(team.players));
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    return maxScore - minScore; // Retorna a diferença entre a pontuação máxima e mínima das equipes
}

function perturbSolution(solution: Team[]): Team[] {
    // Clona a solução atual
    const newSolution = solution.map(team => ({ id: team.id, players: [...team.players], overall: team.overall }));

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

function mapPlayerResponseToPlayer(playerResponse: PlayerResponse): Player {
    return {
        id: playerResponse.id,
        name: playerResponse.name,
        overall: {
            overall: playerResponse.overall
        },
        position: 'MEI', 
        isChampion: false 
    };
}

export function distributePlayersAcrossWeeks(weeks: WeekResponse[], quantityOfTeams: number): Team[] {
    const playerPairsByMonth = new Map<string, Map<string, number>>();
    const lastWeekPairs = new Map<string, Set<string>>();

    // Obtém o mês atual no momento da execução
    const currentDate = new Date();
    const currentMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;

    const updatePlayerPairs = (team: Player[], monthKey: string) => {
        let pairsForMonth = playerPairsByMonth.get(monthKey);
        if (!pairsForMonth) {
            pairsForMonth = new Map();
            playerPairsByMonth.set(monthKey, pairsForMonth);
        }

        for (let i = 0; i < team.length; i++) {
            for (let j = i + 1; j < team.length; j++) {
                const pair = [team[i].id, team[j].id].sort().join('-');
                pairsForMonth.set(pair, (pairsForMonth.get(pair) || 0) + 1);
            }
        }
    };

    const teams: Team[] = weeks.flatMap((week) => week.teams.map(teamResponse => ({
        id: parseInt(teamResponse.id),
        players: teamResponse.players.map(member => member.player),
        overall: calculateTeamOverall(teamResponse.players.map(member => member.player)),
    })));

    const sortedPlayers = teams.flatMap(team => team.players).sort((a, b) => b.overall - a.overall);

    const distributedTeams: Team[] = Array.from({ length: quantityOfTeams }, (_, index) => ({
        id: index,
        players: [],
        overall: 0,
    }));

    while (sortedPlayers.length > 0) {
        for (const team of distributedTeams) {
            const week = weeks[distributedTeams.indexOf(team)];
            const weekMonthKey = `${week.date.getFullYear()}-${week.date.getMonth() + 1}`;

            const bestFitIndex = sortedPlayers.findIndex(player => {
                for (const teamPlayer of team.players) {
                    const pair = [player.id, teamPlayer.id].sort().join('-');
                    const pairCount = playerPairsByMonth.get(weekMonthKey)?.get(pair) || 0;
                    const currentPairCount = playerPairsByMonth.get(currentMonthKey)?.get(pair) || 0;

                    // Verifica as restrições considerando o mês atual, o mês da semana e a última semana
                    if (currentPairCount >= 2 || pairCount >= 2 || (lastWeekPairs.get(pair) && lastWeekPairs.get(pair)!.has(teamPlayer.id))) {
                        return false;
                    }
                }
                return true;
            });

            if (bestFitIndex !== -1) {
                team.players.push(sortedPlayers.splice(bestFitIndex, 1)[0]);
                updatePlayerPairs(team.players, weekMonthKey);
                updatePlayerPairs(team.players, currentMonthKey); // Atualiza para o mês atual
            } else {
                break; // Interrompe o loop se não houver mais jogadores adequados
            }
        }
    }

    // Certifique-se de que o array de equipes seja sempre retornado
    return distributedTeams;
}
