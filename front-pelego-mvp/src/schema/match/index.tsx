import { z } from 'zod';

const GoalSchema = z
  .object({
    goals: z.number().min(0).max(10), // Número de gols (0-10)
    playerId: z.string().min(1, 'Jogador é obrigatório'), // ID do jogador que marcou
    ownGoalPlayerId: z.string().optional(), // ID do jogador que fez gol contra, opcional
  })
  .refine(
    (data) => {
      // Se playerId é 'GC', ownGoalPlayerId é obrigatório
      if (data.playerId === 'GC' && !data.ownGoalPlayerId) {
        return false;
      }
      return true;
    },
    {
      message: 'Para gol contra, especifique o jogador que fez o gol',
      path: ['ownGoalPlayerId'],
    },
  );

const AssistSchema = z.object({
  assists: z.number().min(0).max(1), // Máximo 1 assistência por gol
  playerId: z.string(),
});

const TeamSchema = z.object({
  players: z.array(z.string().min(1)).min(1, 'Time deve ter pelo menos 1 jogador'),
});

const GoalDetailsSchema = z.object({
  goalsCount: z.string().optional(), // Número total de gols, opcional
  whoScores: z.array(GoalSchema).optional(), // Detalhes de quem marcou, opcional
});

const MatchSchema = z
  .object({
    homeTeamId: z.string(), // Validação de não-vazio movida para refine
    homeGoals: GoalDetailsSchema.optional(), // Detalhes dos gols do time da casa, opcional
    homeAssists: z.array(AssistSchema).optional(), // Assistências do time da casa, opcional
    awayGoals: GoalDetailsSchema.optional(), // Detalhes dos gols do time visitante, opcional
    awayAssists: z.array(AssistSchema).optional(), // Assistências do time visitante, opcional
    awayTeamId: z.string(), // Validação de não-vazio movida para refine
  })
  // Validação: Times devem ser selecionados
  .refine((data) => data.homeTeamId !== '', {
    message: 'Time casa é obrigatório',
    path: ['homeTeamId'],
  })
  .refine((data) => data.awayTeamId !== '', {
    message: 'Time visitante é obrigatório',
    path: ['awayTeamId'],
  })
  // Validação: Times não podem jogar contra si mesmos (mesma partida)
  .refine((data) => data.homeTeamId !== data.awayTeamId, {
    message: 'Um time não pode jogar contra si mesmo',
    path: ['awayTeamId'],
  })
  // Validação: Assistente não pode ser o artilheiro
  .refine(
    (data) => {
      const homeGoalScorers = data.homeGoals?.whoScores || [];
      const homeAssists = data.homeAssists || [];

      for (let i = 0; i < homeGoalScorers.length; i++) {
        const scorer = homeGoalScorers[i];
        const assist = homeAssists[i];

        if (scorer && assist && scorer.playerId && assist.playerId) {
          if (scorer.playerId === assist.playerId) {
            return false;
          }
        }
      }

      const awayGoalScorers = data.awayGoals?.whoScores || [];
      const awayAssists = data.awayAssists || [];

      for (let i = 0; i < awayGoalScorers.length; i++) {
        const scorer = awayGoalScorers[i];
        const assist = awayAssists[i];

        if (scorer && assist && scorer.playerId && assist.playerId) {
          if (scorer.playerId === assist.playerId) {
            return false;
          }
        }
      }

      return true;
    },
    {
      message: 'Jogador não pode assistir seu próprio gol',
      path: ['homeAssists'],
    },
  );

export const CreateMatchSchema = z
  .object({
    date: z.string().min(1, 'Data é obrigatória'),
    teams: z.array(TeamSchema).min(2, 'Necessário pelo menos 2 times'),
    matches: z.array(MatchSchema).min(1, 'Necessário pelo menos 1 partida'),
  })
  // Validação global: Jogadores podem estar em apenas 1 time
  .refine(
    (data) => {
      const allPlayerIds = data.teams.flatMap((team) => team.players);
      const uniquePlayerIds = new Set(allPlayerIds);

      return allPlayerIds.length === uniquePlayerIds.size;
    },
    {
      message: 'Jogador não pode estar em mais de um time',
      path: ['teams'],
    },
  )
  // Validação: Goleadores e assistentes devem pertencer aos times corretos
  .refine(
    (data) => {
      for (let i = 0; i < data.matches.length; i++) {
        const match = data.matches[i];
        const homeTeamIndex = parseInt(match.homeTeamId);
        const awayTeamIndex = parseInt(match.awayTeamId);

        // Se os índices são inválidos, pular validação (será pego pelos refines anteriores)
        if (isNaN(homeTeamIndex) || isNaN(awayTeamIndex)) {
          continue;
        }

        const homeTeamPlayers = data.teams[homeTeamIndex]?.players || [];
        const awayTeamPlayers = data.teams[awayTeamIndex]?.players || [];

        // Validar goleadores do time da casa
        const homeScorers = match.homeGoals?.whoScores || [];
        for (const scorer of homeScorers) {
          if (scorer.playerId && scorer.playerId !== 'GC') {
            if (!homeTeamPlayers.includes(scorer.playerId)) {
              return false;
            }
          }
          // Validar gol contra (deve ser do time adversário)
          if (scorer.playerId === 'GC' && scorer.ownGoalPlayerId) {
            if (!awayTeamPlayers.includes(scorer.ownGoalPlayerId)) {
              return false;
            }
          }
        }

        // Validar goleadores do time visitante
        const awayScorers = match.awayGoals?.whoScores || [];
        for (const scorer of awayScorers) {
          if (scorer.playerId && scorer.playerId !== 'GC') {
            if (!awayTeamPlayers.includes(scorer.playerId)) {
              return false;
            }
          }
          // Validar gol contra (deve ser do time adversário)
          if (scorer.playerId === 'GC' && scorer.ownGoalPlayerId) {
            if (!homeTeamPlayers.includes(scorer.ownGoalPlayerId)) {
              return false;
            }
          }
        }

        // Validar assistentes do time da casa
        const homeAssists = match.homeAssists || [];
        for (const assist of homeAssists) {
          if (assist.playerId && !homeTeamPlayers.includes(assist.playerId)) {
            return false;
          }
        }

        // Validar assistentes do time visitante
        const awayAssists = match.awayAssists || [];
        for (const assist of awayAssists) {
          if (assist.playerId && !awayTeamPlayers.includes(assist.playerId)) {
            return false;
          }
        }
      }

      return true;
    },
    {
      message: 'Goleadores e assistentes devem pertencer aos times da partida',
      path: ['matches'],
    },
  );
