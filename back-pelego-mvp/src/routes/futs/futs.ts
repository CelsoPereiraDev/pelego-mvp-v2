import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as dal from '../../lib/firestore';

// ============================================================
// FUT MANAGEMENT ROUTES
// ============================================================

export async function futRoutes(app: FastifyInstance) {
  // POST /futs - Create a new Fut
  app.post('/futs', async (request: FastifyRequest<{
    Body: { name: string; description?: string };
  }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' });
    }

    const { name, description } = request.body;
    if (!name) {
      return reply.status(400).send({ error: 'Nome do fut é obrigatório' });
    }

    try {
      const fut = await dal.createFut(
        name,
        description || '',
        request.user.uid,
        request.user.email || '',
        request.user.name || ''
      );
      reply.status(201).send(fut);
    } catch (error) {
      console.error('Erro ao criar fut:', error);
      reply.status(500).send({ error: 'Erro ao criar fut' });
    }
  });

  // GET /futs - List user's futs
  app.get('/futs', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' });
    }

    try {
      const futs = await dal.getUserFuts(request.user.uid);
      reply.status(200).send(futs);
    } catch (error) {
      console.error('Erro ao listar futs:', error);
      reply.status(500).send({ error: 'Erro ao listar futs' });
    }
  });

  // GET /futs/:futId - Get fut details
  app.get('/futs/:futId', async (request: FastifyRequest<{
    Params: { futId: string };
  }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' });
    }

    const { futId } = request.params;
    try {
      const fut = await dal.getFut(futId);
      if (!fut) return reply.status(404).send({ error: 'Fut não encontrado' });
      reply.status(200).send(fut);
    } catch (error) {
      console.error('Erro ao buscar fut:', error);
      reply.status(500).send({ error: 'Erro ao buscar fut' });
    }
  });

  // GET /futs/:futId/members - List members
  app.get('/futs/:futId/members', async (request: FastifyRequest<{
    Params: { futId: string };
  }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' });
    }

    const { futId } = request.params;
    try {
      const members = await dal.getFutMembers(futId);
      reply.status(200).send(members);
    } catch (error) {
      console.error('Erro ao listar membros:', error);
      reply.status(500).send({ error: 'Erro ao listar membros' });
    }
  });

  // POST /futs/:futId/members - Add member
  app.post('/futs/:futId/members', async (request: FastifyRequest<{
    Params: { futId: string };
    Body: { userId: string; role: 'admin' | 'user' | 'viewer'; email?: string; displayName?: string };
  }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' });
    }

    const { futId } = request.params;
    const { userId, role, email, displayName } = request.body;

    // Only admins can add members
    const callerMember = await dal.getFutMember(futId, request.user.uid);
    if (!callerMember || callerMember.role !== 'admin') {
      return reply.status(403).send({ error: 'Apenas administradores podem adicionar membros' });
    }

    try {
      const member = await dal.addFutMember(futId, userId, role, email, displayName);
      reply.status(201).send(member);
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      reply.status(500).send({ error: 'Erro ao adicionar membro' });
    }
  });

  // PATCH /futs/:futId/members/:userId - Update member role
  app.patch('/futs/:futId/members/:userId', async (request: FastifyRequest<{
    Params: { futId: string; userId: string };
    Body: { role: 'admin' | 'user' | 'viewer' };
  }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' });
    }

    const { futId, userId } = request.params;
    const { role } = request.body;

    const callerMember = await dal.getFutMember(futId, request.user.uid);
    if (!callerMember || callerMember.role !== 'admin') {
      return reply.status(403).send({ error: 'Apenas administradores podem alterar roles' });
    }

    try {
      await dal.updateMemberRole(futId, userId, role);
      reply.status(200).send({ message: 'Role atualizado com sucesso' });
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      reply.status(500).send({ error: 'Erro ao atualizar role' });
    }
  });

  // DELETE /futs/:futId/members/:userId - Remove member
  app.delete('/futs/:futId/members/:userId', async (request: FastifyRequest<{
    Params: { futId: string; userId: string };
  }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' });
    }

    const { futId, userId } = request.params;

    const callerMember = await dal.getFutMember(futId, request.user.uid);
    if (!callerMember || callerMember.role !== 'admin') {
      return reply.status(403).send({ error: 'Apenas administradores podem remover membros' });
    }

    try {
      await dal.removeFutMember(futId, userId);
      reply.status(200).send({ message: 'Membro removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      reply.status(500).send({ error: 'Erro ao remover membro' });
    }
  });

  // POST /futs/:futId/members/:userId/link-player - Link a player to a user
  app.post('/futs/:futId/members/:userId/link-player', async (request: FastifyRequest<{
    Params: { futId: string; userId: string };
    Body: { playerId: string };
  }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' });
    }

    const { futId, userId } = request.params;
    const { playerId } = request.body;

    const callerMember = await dal.getFutMember(futId, request.user.uid);
    if (!callerMember || callerMember.role !== 'admin') {
      return reply.status(403).send({ error: 'Apenas administradores podem vincular jogadores' });
    }

    try {
      await dal.linkPlayerToMember(futId, userId, playerId);
      reply.status(200).send({ message: 'Jogador vinculado com sucesso' });
    } catch (error) {
      console.error('Erro ao vincular jogador:', error);
      reply.status(500).send({ error: 'Erro ao vincular jogador' });
    }
  });

  // PATCH /futs/:futId - Update fut info (admin only)
  app.patch('/futs/:futId', async (request: FastifyRequest<{
    Params: { futId: string };
    Body: { name?: string; description?: string };
  }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' });
    }

    const { futId } = request.params;
    const callerMember = await dal.getFutMember(futId, request.user.uid);
    if (!callerMember || callerMember.role !== 'admin') {
      return reply.status(403).send({ error: 'Apenas administradores podem editar o Fut' });
    }

    try {
      const updated = await dal.updateFut(futId, request.body);
      reply.status(200).send(updated);
    } catch (error) {
      console.error('Erro ao atualizar fut:', error);
      reply.status(500).send({ error: 'Erro ao atualizar fut' });
    }
  });

  // ============================================================
  // INVITE ROUTES
  // ============================================================

  // POST /futs/:futId/invites - Create invite (admin only)
  app.post('/futs/:futId/invites', async (request: FastifyRequest<{
    Params: { futId: string };
    Body: { role: 'user' | 'viewer'; expiresInDays?: number; maxUses?: number };
  }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' });
    }

    const { futId } = request.params;
    const callerMember = await dal.getFutMember(futId, request.user.uid);
    if (!callerMember || callerMember.role !== 'admin') {
      return reply.status(403).send({ error: 'Apenas administradores podem criar convites' });
    }

    const { role, expiresInDays, maxUses } = request.body;
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    try {
      const fut = await dal.getFut(futId);
      if (!fut) return reply.status(404).send({ error: 'Fut não encontrado' });

      const invite = await dal.createInvite(futId, fut.name, role, request.user.uid, expiresAt, maxUses);
      reply.status(201).send(invite);
    } catch (error) {
      console.error('Erro ao criar convite:', error);
      reply.status(500).send({ error: 'Erro ao criar convite' });
    }
  });

  // GET /futs/:futId/invites - List active invites (admin only)
  app.get('/futs/:futId/invites', async (request: FastifyRequest<{
    Params: { futId: string };
  }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' });
    }

    const { futId } = request.params;
    const callerMember = await dal.getFutMember(futId, request.user.uid);
    if (!callerMember || callerMember.role !== 'admin') {
      return reply.status(403).send({ error: 'Apenas administradores podem ver convites' });
    }

    try {
      const invites = await dal.getInvitesByFut(futId);
      reply.status(200).send(invites);
    } catch (error) {
      console.error('Erro ao listar convites:', error);
      reply.status(500).send({ error: 'Erro ao listar convites' });
    }
  });

  // DELETE /futs/:futId/invites/:token - Revoke invite (admin only)
  app.delete('/futs/:futId/invites/:token', async (request: FastifyRequest<{
    Params: { futId: string; token: string };
  }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' });
    }

    const { futId, token } = request.params;
    const callerMember = await dal.getFutMember(futId, request.user.uid);
    if (!callerMember || callerMember.role !== 'admin') {
      return reply.status(403).send({ error: 'Apenas administradores podem revogar convites' });
    }

    try {
      await dal.revokeInvite(token);
      reply.status(200).send({ message: 'Convite revogado com sucesso' });
    } catch (error) {
      console.error('Erro ao revogar convite:', error);
      reply.status(500).send({ error: 'Erro ao revogar convite' });
    }
  });

  // GET /invite/:token - Get invite info (authenticated)
  app.get('/invite/:token', async (request: FastifyRequest<{
    Params: { token: string };
  }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' });
    }

    const { token } = request.params;
    try {
      const invite = await dal.getInviteByToken(token);
      if (!invite) return reply.status(404).send({ error: 'Convite não encontrado' });
      reply.status(200).send(invite);
    } catch (error) {
      console.error('Erro ao buscar convite:', error);
      reply.status(500).send({ error: 'Erro ao buscar convite' });
    }
  });

  // POST /invite/:token/accept - Accept invite (authenticated)
  app.post('/invite/:token/accept', async (request: FastifyRequest<{
    Params: { token: string };
  }>, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' });
    }

    const { token } = request.params;
    try {
      const result = await dal.acceptInvite(
        token,
        request.user.uid,
        request.user.email || '',
        request.user.name || ''
      );
      reply.status(200).send(result);
    } catch (error: any) {
      console.error('Erro ao aceitar convite:', error);
      const message = error.message || 'Erro ao aceitar convite';
      const status = message.includes('não encontrado') ? 404 : 400;
      reply.status(status).send({ error: message });
    }
  });

  // GET /user/primary-fut - Get user's primary fut ID
  app.get('/user/primary-fut', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Autenticação necessária' });
    }

    try {
      const primaryFutId = await dal.getUserPrimaryFutId(request.user.uid);
      reply.status(200).send({ primaryFutId });
    } catch (error) {
      console.error('Erro ao buscar fut primário:', error);
      reply.status(500).send({ error: 'Erro ao buscar fut primário' });
    }
  });
}
