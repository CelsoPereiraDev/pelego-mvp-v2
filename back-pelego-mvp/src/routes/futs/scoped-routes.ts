import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as dal from '../../lib/firestore';
import { calculateMonthResume } from '../../utils/stats/calculateMonthResume';
import { calculateBestOfEachPosition } from '../../utils/stats/calculateBestOfPositions';
import { sendInviteEmail } from '../../lib/email';

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

// Helper to check admin or user role (excludes viewer)
function isAdminOrUser(member: dal.MemberData): boolean {
  return member.role === 'admin' || member.role === 'user';
}

// Helper to create fire-and-forget audit log
function auditLog(futId: string, request: FastifyRequest, action: string, targetType: dal.AuditLogData['targetType'], targetId: string, details?: Record<string, any>) {
  dal.createAuditLog(futId, {
    action,
    userId: request.user!.uid,
    userName: request.user!.name || request.user!.email || 'Unknown',
    targetType,
    targetId,
    details,
  }).catch(err => console.error('Audit log failed:', err));
}

// Trigger write-time recalculation of player stats and month awards
async function triggerStatsRecalculation(futId: string, weekDate: string) {
  try {
    const date = new Date(weekDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    await Promise.all([
      dal.recalculatePlayerStats(futId, year),
      dal.recalculateMonthAwards(futId, year, month),
    ]);
  } catch (error) {
    console.error('Erro ao recalcular stats (non-blocking):', error);
  }
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

  // GET /futs/:futId/players/:playerId/overview?year=YYYY
  app.get('/futs/:futId/players/:playerId/overview', async (request: FastifyRequest<{
    Params: { futId: string; playerId: string };
    Querystring: { year?: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;

    const { futId, playerId } = request.params;
    const { year } = request.query;

    try {
      // All lightweight reads — no heavy week loading
      const [playerWithPrizes, availableYears, dateToWeekId, stats] = await Promise.all([
        dal.getPlayerWithPrizes(futId, playerId),
        dal.getAvailableYears(futId),
        dal.getWeekDateMap(futId),
        year
          ? dal.getPlayerStatsDoc(futId, playerId, parseInt(year)).then(doc => doc ? dal.docToOverviewStats(doc) : null)
          : dal.getAllPlayerStatsDocs(futId, playerId).then(docs => docs.length > 0 ? dal.mergePlayerStatsDocs(docs) : null),
      ]);

      if (!playerWithPrizes) {
        return reply.status(404).send({ error: 'Jogador não encontrado' });
      }

      // Enrich prizes: filter by year, resolve champion week links, and include stored awards
      const enrichedPrizes = playerWithPrizes.monthIndividualPrizes
        .map((prize: any) => {
          const prizeDate = prize.date instanceof Date ? prize.date : prize.date?.toDate ? prize.date.toDate() : new Date(prize.date._seconds ? prize.date._seconds * 1000 : prize.date);
          return { ...prize, _prizeDate: prizeDate };
        })
        .filter((prize: any) => !year || prize._prizeDate.getFullYear() === parseInt(year))
        .map((prize: any) => {
          // Resolve championDates to week links
          const rawDates: any[] = prize.championDates || [];
          const championWeeks = rawDates.map((d: any) => {
            const date = d instanceof Date ? d : d?.toDate ? d.toDate() : new Date(d._seconds ? d._seconds * 1000 : d);
            const dateKey = date.toISOString().slice(0, 10);
            // Try exact match first, then ±1 day for timezone edge cases
            let weekId = dateToWeekId.get(dateKey) || '';
            if (!weekId) {
              const dt = new Date(date);
              const prevDay = new Date(dt.getTime() - 86400000).toISOString().slice(0, 10);
              const nextDay = new Date(dt.getTime() + 86400000).toISOString().slice(0, 10);
              weekId = dateToWeekId.get(prevDay) || dateToWeekId.get(nextDay) || '';
            }
            return { weekId, date: date.toISOString() };
          }).filter((cw: { weekId: string }) => cw.weekId !== '');

          return {
            id: prize.id,
            playerId: prize.playerId,
            date: prize._prizeDate.toISOString(),
            championTimes: prize.championTimes,
            championWeeks,
            isMVP: prize.isMVP || false,
            isTopPointer: prize.isTopPointer || false,
            isStriker: prize.isStriker || false,
            isBestAssist: prize.isBestAssist || false,
            isBestDefender: prize.isBestDefender || false,
            isLVP: prize.isLVP || false,
            isBestOfPosition: prize.isBestOfPosition || false,
          };
        });

      const response = {
        player: {
          id: playerWithPrizes.id,
          name: playerWithPrizes.name,
          position: playerWithPrizes.position,
          country: playerWithPrizes.country,
          image: playerWithPrizes.image,
          overall: playerWithPrizes.overall,
          isChampion: playerWithPrizes.isChampion,
          email: playerWithPrizes.email,
          isAuthenticated: !!playerWithPrizes.linkedUserId,
          monthIndividualPrizes: enrichedPrizes,
          yearIndividualPrizes: year
            ? playerWithPrizes.yearIndividualPrizes.filter((p: any) => p.year === year)
            : playerWithPrizes.yearIndividualPrizes,
        },
        stats,
        availableYears,
      };

      reply.status(200).send(response);
    } catch (error) {
      console.error('Erro ao buscar overview do jogador:', error);
      reply.status(500).send({ error: 'Erro ao buscar overview do jogador' });
    }
  });

  // POST /futs/:futId/create_players
  app.post('/futs/:futId/create_players', async (request: FastifyRequest<{
    Params: { futId: string };
    Body: { name: string; country?: string; image?: string; position: string; overall: any; team?: string; email?: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (!isAdminOrUser(member)) {
      return reply.status(403).send({ error: 'Apenas membros e administradores podem criar jogadores' });
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
        email: playerData.email,
      });

      // If email was provided, create an invite and send email
      if (playerData.email) {
        try {
          const fut = await dal.getFut(request.params.futId);
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const invite = await dal.createInvite(
            request.params.futId,
            fut?.name ?? '',
            'viewer',
            request.user!.uid,
            expiresAt,
            1,
            player.id
          );
          await sendInviteEmail({
            to: playerData.email,
            futName: fut?.name ?? '',
            inviteToken: invite.token,
            playerName: playerData.name,
          });
        } catch (emailError) {
          console.error('Erro ao enviar convite por email:', emailError);
        }
      }

      auditLog(request.params.futId, request, 'player_created', 'player', player.id, {
        name: player.name,
        position: player.position,
        overall: typeof player.overall === 'object' && player.overall !== null ? player.overall?.overall : undefined,
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
    if (!isAdminOrUser(member)) {
      return reply.status(403).send({ error: 'Apenas membros e administradores podem editar jogadores' });
    }

    try {
      const player = await dal.updatePlayer(request.params.futId, request.params.id, request.body);
      if (!player) return reply.status(404).send({ error: 'Jogador não encontrado' });

      // If email was provided, create an invite and send email
      if (request.body.email) {
        try {
          const fut = await dal.getFut(request.params.futId);
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const invite = await dal.createInvite(
            request.params.futId,
            fut?.name ?? '',
            'viewer',
            request.user!.uid,
            expiresAt,
            1,
            request.params.id
          );
          await sendInviteEmail({
            to: request.body.email,
            futName: fut?.name ?? '',
            inviteToken: invite.token,
            playerName: player.name,
          });
        } catch (emailError) {
          console.error('Erro ao enviar convite por email:', emailError);
        }
      }

      auditLog(request.params.futId, request, 'player_updated', 'player', request.params.id, {
        playerName: player.name,
        changes: Object.fromEntries(
          Object.entries(request.body as Record<string, unknown>).filter(([k]) => k !== 'id')
        ),
      });
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
      const playerToDelete = await dal.getPlayer(request.params.futId, request.params.id);
      await dal.deletePlayer(request.params.futId, request.params.id);
      auditLog(request.params.futId, request, 'player_deleted', 'player', request.params.id, {
        name: playerToDelete?.name,
        position: playerToDelete?.position,
      });
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
    if (!isAdminOrUser(member)) {
      return reply.status(403).send({ error: 'Apenas membros e administradores podem criar semanas' });
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
      triggerStatsRecalculation(request.params.futId, date);
      auditLog(request.params.futId, request, 'week_created', 'week', result.week.id, { date, teamCount: result.teams.length, matchCount: result.matches.length });
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
    if (!isAdminOrUser(member)) {
      return reply.status(403).send({ error: 'Apenas membros e administradores podem criar semanas' });
    }

    const { date, teams } = request.body;

    try {
      // Create week and teams without matches
      const result = await dal.createWeekAndMatches(request.params.futId, date, teams, []);
      triggerStatsRecalculation(request.params.futId, date);
      auditLog(request.params.futId, request, 'week_created', 'week', result.week.id, { date, teamCount: result.teams.length });
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
    if (!isAdminOrUser(member)) {
      return reply.status(403).send({ error: 'Apenas membros e administradores podem atualizar semanas' });
    }

    const { date, teams, matches } = request.body;

    if (!date || !teams || !Array.isArray(teams) || teams.length < 2) {
      return reply.status(400).send({ error: 'Data e pelo menos 2 times são obrigatórios' });
    }

    try {
      const result = await dal.updateWeekAndMatches(request.params.futId, request.params.weekId, date, teams, matches || []);
      triggerStatsRecalculation(request.params.futId, date);
      auditLog(request.params.futId, request, 'week_updated', 'week', request.params.weekId, { date, matchCount: result.matches.length });
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
      // Read the week date before deleting (needed for stats recalculation)
      const weekDate = await dal.getWeekDate(request.params.futId, request.params.weekId);
      const result = await dal.deleteWeekAndRelated(request.params.futId, request.params.weekId);
      if (weekDate) {
        triggerStatsRecalculation(request.params.futId, weekDate);
      }
      auditLog(request.params.futId, request, 'week_deleted', 'week', request.params.weekId, {
        deletedWeekDate: result.deletedWeekDate,
        totalPlayersAffected: result.totalPlayersAffected,
      });
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
    if (!isAdminOrUser(member)) {
      return reply.status(403).send({ error: 'Apenas membros e administradores podem adicionar gols' });
    }

    const { weekId, matchId, goals } = request.body;

    try {
      await dal.createGoals(request.params.futId, weekId, matchId, goals);
      const weekDate = await dal.getWeekDate(request.params.futId, weekId);
      if (weekDate) {
        triggerStatsRecalculation(request.params.futId, weekDate);
      }
      auditLog(request.params.futId, request, 'goals_registered', 'match', matchId, { weekId, goalsCount: goals.length });
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
    if (!isAdminOrUser(member)) {
      return reply.status(403).send({ error: 'Apenas membros e administradores podem atualizar times' });
    }

    try {
      const teamsPayload = request.body.teams || request.body;
      await dal.updateTeams(request.params.futId, teamsPayload);
      // Resolve week date from the first team's weekId for stats recalculation
      const firstWeekId = Array.isArray(teamsPayload) && teamsPayload[0]?.weekId;
      if (firstWeekId) {
        const weekDate = await dal.getWeekDate(request.params.futId, firstWeekId);
        if (weekDate) {
          triggerStatsRecalculation(request.params.futId, weekDate);
        }
      }
      auditLog(request.params.futId, request, 'teams_updated', 'team', 'batch', { teamCount: teamsPayload.length });
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
      const resume = calculateMonthResume(weeks, excludedIds);
      reply.status(200).send(resume);
    } catch (error) {
      console.error('Erro ao calcular resumo do mês:', error);
      reply.status(500).send({ error: 'Erro ao calcular resumo do mês' });
    }
  });

  // GET /futs/:futId/rewards/:year/:month?
  app.get('/futs/:futId/rewards/:year/:month?', async (request: FastifyRequest<{
    Params: { futId: string; year: string; month?: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;

    const { futId, year, month } = request.params;

    try {
      const weeks = month
        ? await dal.getWeeksByDate(futId, year, month)
        : await dal.getWeeksByDate(futId, year);

      const individual = calculateMonthResume(weeks);
      const bestOfPosition = calculateBestOfEachPosition(weeks);

      reply.status(200).send({ individual, bestOfPosition });
    } catch (error) {
      console.error('Erro ao calcular recompensas:', error);
      reply.status(500).send({ error: 'Erro ao calcular recompensas' });
    }
  });

  // POST /futs/:futId/admin/rebuild-stats
  app.post('/futs/:futId/admin/rebuild-stats', async (request: FastifyRequest<{
    Params: { futId: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (!isAdmin(member)) {
      return reply.status(403).send({ error: 'Apenas administradores podem reconstruir estatísticas' });
    }

    try {
      const futId = request.params.futId;
      const availableYears = await dal.getAvailableYears(futId);
      const months = Array.from({ length: 12 }, (_, i) => i + 1);

      const results = await Promise.all(
        availableYears.map(async (year) => {
          const [count] = await Promise.all([
            dal.recalculatePlayerStats(futId, year),
            ...months.map((month) => dal.recalculateMonthAwards(futId, year, month)),
          ]);
          return count;
        }),
      );

      reply.status(200).send({
        message: 'Estatísticas reconstruídas com sucesso',
        years: availableYears,
        totalPlayerStatsDocs: results.reduce((sum, c) => sum + c, 0),
        totalMonthsProcessed: availableYears.length * 12,
      });
    } catch (error) {
      console.error('Erro ao reconstruir estatísticas:', error);
      reply.status(500).send({ error: 'Erro ao reconstruir estatísticas' });
    }
  });

  // ============================================================
  // FINALIZE MONTH
  // ============================================================

  // POST /futs/:futId/finalize-month/:year/:month
  app.post('/futs/:futId/finalize-month/:year/:month', async (request: FastifyRequest<{
    Params: { futId: string; year: string; month: string };
    Body: {
      awards: dal.FinalizeMonthAwards;
      teamOfTheMonth: dal.FinalizeMonthTeam;
    };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (!isAdmin(member)) {
      return reply.status(403).send({ error: 'Apenas administradores podem finalizar o mês' });
    }

    const { futId, year, month } = request.params;
    const { awards, teamOfTheMonth } = request.body;

    try {
      await dal.finalizeMonth(
        futId,
        Number(year),
        Number(month),
        awards,
        teamOfTheMonth,
        request.user!.uid,
      );

      auditLog(futId, request, 'month_finalized', 'stats', `${year}-${month}`, {
        year: Number(year),
        month: Number(month),
        mvp: awards.mvp.playerName,
        topScorer: awards.scorer.playerName,
      });
      reply.status(200).send({ message: 'Mês finalizado com sucesso' });
    } catch (error) {
      if (error instanceof Error && error.message === 'MONTH_ALREADY_FINALIZED') {
        return reply.status(409).send({ error: 'Este mês já foi finalizado' });
      }
      console.error('Erro ao finalizar mês:', error);
      reply.status(500).send({ error: 'Erro ao finalizar mês' });
    }
  });

  // GET /futs/:futId/is-month-finalized/:year/:month
  app.get('/futs/:futId/is-month-finalized/:year/:month', async (request: FastifyRequest<{
    Params: { futId: string; year: string; month: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;

    const { futId, year, month } = request.params;

    try {
      const finalized = await dal.isMonthFinalized(futId, Number(year), Number(month));
      reply.status(200).send({ finalized });
    } catch (error) {
      console.error('Erro ao verificar finalização:', error);
      reply.status(500).send({ error: 'Erro ao verificar finalização do mês' });
    }
  });

  // POST /futs/:futId/admin/reapply-month-awards/:year/:month
  app.post('/futs/:futId/admin/reapply-month-awards/:year/:month', async (request: FastifyRequest<{
    Params: { futId: string; year: string; month: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (!isAdmin(member)) {
      return reply.status(403).send({ error: 'Apenas administradores podem reaplicar prêmios' });
    }

    const { futId, year, month } = request.params;

    try {
      await dal.reapplyFinalizedMonthAwards(futId, Number(year), Number(month));
      reply.status(200).send({ message: `Prêmios de ${month}/${year} reaplicados com sucesso` });
    } catch (error) {
      if (error instanceof Error && error.message === 'MONTH_NOT_FINALIZED') {
        return reply.status(404).send({ error: 'Este mês ainda não foi finalizado' });
      }
      console.error('Erro ao reaplicar prêmios do mês:', error);
      reply.status(500).send({ error: 'Erro ao reaplicar prêmios do mês' });
    }
  });

  // ============================================================
  // FINALIZE YEAR
  // ============================================================

  // POST /futs/:futId/finalize-year/:year
  app.post('/futs/:futId/finalize-year/:year', async (request: FastifyRequest<{
    Params: { futId: string; year: string };
    Body: {
      awards: dal.FinalizeYearAwards;
      teamOfTheYear: dal.FinalizeYearTeam;
    };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (!isAdmin(member)) {
      return reply.status(403).send({ error: 'Apenas administradores podem finalizar o ano' });
    }

    const { futId, year } = request.params;
    const { awards, teamOfTheYear } = request.body;

    try {
      await dal.finalizeYear(
        futId,
        Number(year),
        awards,
        teamOfTheYear,
        request.user!.uid,
      );

      auditLog(futId, request, 'year_finalized', 'stats', year, {
        year: Number(year),
        mvp: awards.mvp.playerName,
        topScorer: awards.scorer.playerName,
      });
      reply.status(200).send({ message: 'Ano finalizado com sucesso' });
    } catch (error) {
      if (error instanceof Error && error.message === 'YEAR_ALREADY_FINALIZED') {
        return reply.status(409).send({ error: 'Este ano já foi finalizado' });
      }
      console.error('Erro ao finalizar ano:', error);
      reply.status(500).send({ error: 'Erro ao finalizar ano' });
    }
  });

  // GET /futs/:futId/is-year-finalized/:year
  app.get('/futs/:futId/is-year-finalized/:year', async (request: FastifyRequest<{
    Params: { futId: string; year: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;

    const { futId, year } = request.params;

    try {
      const finalized = await dal.isYearFinalized(futId, Number(year));
      reply.status(200).send({ finalized });
    } catch (error) {
      console.error('Erro ao verificar finalização do ano:', error);
      reply.status(500).send({ error: 'Erro ao verificar finalização do ano' });
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
    if (!isAdminOrUser(member)) {
      return reply.status(403).send({ error: 'Apenas membros e administradores podem atualizar pontuações' });
    }

    try {
      await dal.createPlayerScores(request.params.futId, request.body.scores);
      auditLog(request.params.futId, request, 'scores_updated', 'stats', 'batch', { playerCount: request.body.scores.length });
      reply.status(200).send({ message: 'Pontuações atualizadas com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar pontuações:', error);
      reply.status(500).send({ error: 'Erro ao atualizar pontuações' });
    }
  });

  // ============================================================
  // AUDIT LOGS
  // ============================================================

  // GET /futs/:futId/logs
  app.get('/futs/:futId/logs', async (request: FastifyRequest<{
    Params: { futId: string };
    Querystring: { limit?: string };
  }>, reply: FastifyReply) => {
    const member = await verifyMembership(request, reply);
    if (!member) return;
    if (member.role === 'viewer') {
      return reply.status(403).send({ error: 'Acesso restrito' });
    }

    try {
      const limit = request.query.limit ? parseInt(request.query.limit) : 100;
      const logs = await dal.getAuditLogs(request.params.futId, limit);
      reply.status(200).send(logs);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      reply.status(500).send({ error: 'Erro ao buscar logs' });
    }
  });
}
