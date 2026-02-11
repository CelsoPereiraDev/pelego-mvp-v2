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
      // No token — user stays unauthenticated
      // Route handlers check request.user and return 401 if needed
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
      request.log.warn('Invalid auth token');
      // Invalid token — request proceeds without user
    }
  });
}
