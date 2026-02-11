import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminAuth } from '../lib/firebase-admin';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      uid: string;
      email?: string;
      name?: string;
    };
  }
}

export async function authMiddleware(app: FastifyInstance) {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Phase 1: permissive mode — log but don't block
      request.log.warn('Request without auth token');
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      request.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
      };
    } catch (error) {
      // Phase 1: permissive mode — log but don't block
      request.log.warn('Invalid auth token');
    }
  });
}
