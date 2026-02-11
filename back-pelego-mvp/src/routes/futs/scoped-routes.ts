import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as dal from '../../lib/firestore';
import { calculateMonthResume } from '../../utils/stats/calculateMonthResume';

// ============================================================
// ALL ROUTES SCOPED UNDER /futs/:futId/
// These replace the old /api/* routes
// ============================================================

// Helper to verify user is member of the fut
async function verifyMembership(request: FastifyRequest<{ Params: { futId: string } }>, reply: FastifyReply): Promise<dal.MemberData | null> {
  if (!request.user) {
    reply.status(401).send({ error: 'Autenticação necessária' });
    return null;
  }

  const member = await dal.getFutMember(request.params.futId, request.user.uid);
  if (!member) {
    reply.status(403).send({ error: 'Você não é membro deste fut' });
    return null;
  }

  return member;
}

// Helper to check admin role
function isAdmin(member: dal.MemberData): boolean {
  return member.role === 'admin';
}

export async function scopedRoutes(app: FastifyInstance) {

  // ============================================================
  // PLAYERS
  // ============================================================

  // GET /futs/:futId/get_players
  app.get('/futs/:futId/get_players', async (request: FastifyRequest<{
    Params: { futId: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;

    try {
      const players = await dal.getPlayers(request.params.futId);
      reply.status(200).send(players);
    } catch (error) {
      console.error('Erro ao buscar jogadores:', error);
      reply.status(500).send({ error: 'Erro ao buscar jogadores' });
    }
  });

  // GET /futs/:futId/get_player/:id
  app.get('/futs/:futId/get_player/:id', async (request: FastifyRequest<{
    Params: { futId: string; id: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;

    try {
      const player = await dal.getPlayerWithPrizes(request.params.futId, request.params.id);
      if (!player) return reply.status(404).send({ error: 'Jogador não encontrado' });
      reply.status(200).send(player);
    } catch (error) {
      console.error('Erro ao buscar jogador:', error);
      reply.status(500).send({ error: 'Erro ao buscar jogador' });
    }
  });

  // POST /futs/:futId/create_players
  app.post('/futs/:futId/create_players', async (request: FastifyRequest<{
    Params: { futId: string };
    Body: { name: string; country?: string; image?: string; position: string; overall: any; team?: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (!isAdmin(member)) {
      return reply.status(403).send({ error: 'Apenas administradores podem criar jogadores' });
    }

    try {
      const playerData = request.body;
      const overall = playerData.overall;

      const player = await dal.createPlayer(request.params.futId, {
        name: playerData.name,
        country: playerData.country,
        image: playerData.image,
        position: playerData.position,
        overall: typeof overall === 'string' ? overall : JSON.stringify(overall),
        isChampion: false,
        monthChampion: false,
        monthStriker: false,
        monthBestDefender: false,
        monthTopPointer: false,
        monthTopAssist: false,
        monthLVP: false,
        monthBestOfPosition: false,
        team: playerData.team,
      });

      reply.status(201).send(player);
    } catch (error) {
      console.error('Erro ao criar jogador:', error);
      reply.status(500).send({ error: 'Erro ao criar jogador' });
    }
  });

  // PATCH /futs/:futId/players/:id
  app.patch('/futs/:futId/players/:id', async (request: FastifyRequest<{
    Params: { futId: string; id: string };
    Body: Partial<dal.PlayerData>;
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (!isAdmin(member)) {
      return reply.status(403).send({ error: 'Apenas administradores podem editar jogadores' });
    }

    try {
      const player = await dal.updatePlayer(request.params.futId, request.params.id, request.body);
      if (!player) return reply.status(404).send({ error: 'Jogador não encontrado' });
      reply.status(200).send(player);
    } catch (error) {
      console.error('Erro ao atualizar jogador:', error);
      reply.status(500).send({ error: 'Erro ao atualizar jogador' });
    }
  });

  // DELETE /futs/:futId/delete_player/:id
  app.delete('/futs/:futId/delete_player/:id', async (request: FastifyRequest<{
    Params: { futId: string; id: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (!isAdmin(member)) {
      return reply.status(403).send({ error: 'Apenas administradores podem deletar jogadores' });
    }

    try {
      await dal.deletePlayer(request.params.futId, request.params.id);
      reply.status(200).send({ message: 'Jogador deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar jogador:', error);
      reply.status(500).send({ error: 'Erro ao deletar jogador' });
    }
  });

  // ============================================================
  // WEEKS
  // ============================================================

  // GET /futs/:futId/weeks
  app.get('/futs/:futId/weeks', async (request: FastifyRequest<{
    Params: { futId: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;

    try {
      const weeks = await dal.getWeeks(request.params.futId);
      reply.status(200).send(weeks);
    } catch (error) {
      console.error('Erro ao buscar semanas:', error);
      reply.status(500).send({ error: 'Erro ao buscar semanas' });
    }
  });

  // GET /futs/:futId/week/:weekId
  app.get('/futs/:futId/week/:weekId', async (request: FastifyRequest<{
    Params: { futId: string; weekId: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;

    try {
      const week = await dal.getWeek(request.params.futId, request.params.weekId);
      if (!week) return reply.status(404).send({ error: 'Semana não encontrada' });
      reply.status(200).send(week);
    } catch (error) {
      console.error('Erro ao buscar semana:', error);
      reply.status(500).send({ error: 'Erro ao buscar semana' });
    }
  });

  // GET /futs/:futId/weeks/:year/:month?
  app.get('/futs/:futId/weeks/:year/:month?', async (request: FastifyRequest<{
    Params: { futId: string; year: string; month?: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;

    try {
      const weeks = await dal.getWeeksByDate(request.params.futId, request.params.year, request.params.month);
      reply.status(200).send(weeks);
    } catch (error) {
      console.error('Erro ao buscar semanas por data:', error);
      reply.status(500).send({ error: 'Erro ao buscar semanas por data' });
    }
  });

  // POST /futs/:futId/create_week_and_matches
  app.post('/futs/:futId/create_week_and_matches', async (request: FastifyRequest<{
    Params: { futId: string };
    Body: { date: string; teams: string[][]; matches: any[] };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (!isAdmin(member)) {
      return reply.status(403).send({ error: 'Apenas administradores podem criar semanas' });
    }

    const { date, teams, matches } = request.body;

    if (!date || !teams || !Array.isArray(teams) || teams.length < 2) {
      return reply.status(400).send({ error: 'Data e pelo menos 2 times são obrigatórios' });
    }

    if (!matches || !Array.isArray(matches) || matches.length === 0) {
      return reply.status(400).send({ error: 'Pelo menos uma partida é obrigatória' });
    }

    try {
      const result = await dal.createWeekAndMatches(request.params.futId, date, teams, matches);
      reply.status(201).send({
        message: 'Semana, times e partidas criados com sucesso',
        ...result,
      });
    } catch (error) {
      console.error('Erro ao criar semana e partidas:', error);
      reply.status(500).send({
        error: error instanceof Error ? error.message : 'Erro ao criar semana e partidas',
      });
    }
  });

  // POST /futs/:futId/create_week_with_teams
  app.post('/futs/:futId/create_week_with_teams', async (request: FastifyRequest<{
    Params: { futId: string };
    Body: { date: string; teams: string[][] };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (!isAdmin(member)) {
      return reply.status(403).send({ error: 'Apenas administradores podem criar semanas' });
    }

    const { date, teams } = request.body;

    try {
      // Create week and teams without matches
      const result = await dal.createWeekAndMatches(request.params.futId, date, teams, []);
      reply.status(201).send(result);
    } catch (error) {
      console.error('Erro ao criar semana com times:', error);
      reply.status(500).send({ error: 'Erro ao criar semana com times' });
    }
  });

  // PUT /futs/:futId/week/:weekId
  app.put('/futs/:futId/week/:weekId', async (request: FastifyRequest<{
    Params: { futId: string; weekId: string };
    Body: { date: string; teams: string[][]; matches: any[] };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (!isAdmin(member)) {
      return reply.status(403).send({ error: 'Apenas administradores podem atualizar semanas' });
    }

    const { date, teams, matches } = request.body;

    if (!date || !teams || !Array.isArray(teams) || teams.length < 2) {
      return reply.status(400).send({ error: 'Data e pelo menos 2 times são obrigatórios' });
    }

    try {
      const result = await dal.updateWeekAndMatches(request.params.futId, request.params.weekId, date, teams, matches || []);
      reply.status(200).send({
        message: 'Semana atualizada com sucesso',
        ...result,
      });
    } catch (error) {
      console.error('Erro ao atualizar semana:', error);
      reply.status(500).send({
        error: error instanceof Error ? error.message : 'Erro ao atualizar semana e partidas',
      });
    }
  });

  // DELETE /futs/:futId/weeks/:weekId
  app.delete('/futs/:futId/weeks/:weekId', async (request: FastifyRequest<{
    Params: { futId: string; weekId: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (!isAdmin(member)) {
      return reply.status(403).send({ error: 'Apenas administradores podem deletar semanas' });
    }

    try {
      const result = await dal.deleteWeekAndRelated(request.params.futId, request.params.weekId);
      reply.status(200).send({
        message: 'Semana deletada com sucesso. Todos os dados relacionados foram removidos.',
        ...result,
      });
    } catch (error) {
      console.error('Erro ao deletar semana:', error);
      reply.status(500).send({
        error: error instanceof Error ? error.message : 'Erro ao deletar semana',
      });
    }
  });

  // ============================================================
  // MATCHES
  // ============================================================

  // GET /futs/:futId/matches
  app.get('/futs/:futId/matches', async (request: FastifyRequest<{
    Params: { futId: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;

    try {
      const matches = await dal.getMatches(request.params.futId);
      reply.status(200).send(matches);
    } catch (error) {
      console.error('Erro ao buscar partidas:', error);
      reply.status(500).send({ error: 'Erro ao buscar partidas' });
    }
  });

  // POST /futs/:futId/create_goals
  app.post('/futs/:futId/create_goals', async (request: FastifyRequest<{
    Params: { futId: string };
    Body: { weekId: string; matchId: string; goals: any[] };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (!isAdmin(member)) {
      return reply.status(403).send({ error: 'Apenas administradores podem adicionar gols' });
    }

    const { weekId, matchId, goals } = request.body;

    try {
      await dal.createGoals(request.params.futId, weekId, matchId, goals);
      reply.status(201).send({ message: 'Gols criados com sucesso' });
    } catch (error) {
      console.error('Erro ao criar gols:', error);
      reply.status(500).send({ error: 'Erro ao criar gols' });
    }
  });

  // ============================================================
  // TEAMS
  // ============================================================

  // GET /futs/:futId/teams
  app.get('/futs/:futId/teams', async (request: FastifyRequest<{
    Params: { futId: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;

    try {
      const teams = await dal.getTeams(request.params.futId);
      reply.status(200).send(teams);
    } catch (error) {
      console.error('Erro ao buscar times:', error);
      reply.status(500).send({ error: 'Erro ao buscar times' });
    }
  });

  // PATCH /futs/:futId/update_teams
  app.patch('/futs/:futId/update_teams', async (request: FastifyRequest<{
    Params: { futId: string };
    Body: { teams: any[] };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (!isAdmin(member)) {
      return reply.status(403).send({ error: 'Apenas administradores podem atualizar times' });
    }

    try {
      await dal.updateTeams(request.params.futId, request.body.teams || request.body);
      reply.status(200).send({ message: 'Times e prêmios mensais atualizados com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar times:', error);
      reply.status(500).send({ error: 'Erro ao atualizar times' });
    }
  });

  // ============================================================
  // STATS
  // ============================================================

  // GET /futs/:futId/stats/month-resume/:year/:month?
  app.get('/futs/:futId/stats/month-resume/:year/:month?', async (request: FastifyRequest<{
    Params: { futId: string; year: string; month?: string };
    Querystring: { excludePlayerIds?: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;

    const { futId, year, month } = request.params;
    const { excludePlayerIds } = request.query;

    try {
      const excludedIds = excludePlayerIds
        ? excludePlayerIds.split(',').map(id => id.trim()).filter(id => id.length > 0)
        : [];

      // Get weeks from Firestore
      const weeks = month
        ? await dal.getWeeksByDate(futId, year, month)
        : await dal.getWeeksByDate(futId, year);

      // Use existing calculation utility
      const resume = calculateMonthResume(weeks as any, excludedIds);
      reply.status(200).send(resume);
    } catch (error) {
      console.error('Erro ao calcular resumo do mês:', error);
      reply.status(500).send({ error: 'Erro ao calcular resumo do mês' });
    }
  });

  // ============================================================
  // SCORES
  // ============================================================

  // PATCH /futs/:futId/update_player_scores
  app.patch('/futs/:futId/update_player_scores', async (request: FastifyRequest<{
    Params: { futId: string };
    Body: { scores: { playerId: string; points: number }[] };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (!isAdmin(member)) {
      return reply.status(403).send({ error: 'Apenas administradores podem atualizar pontuações' });
    }

    try {
      await dal.createPlayerScores(request.params.futId, request.body.scores);
      reply.status(200).send({ message: 'Pontuações atualizadas com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar pontuações:', error);
      reply.status(500).send({ error: 'Erro ao atualizar pontuações' });
    }
  });
}
