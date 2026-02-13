import cors from '@fastify/cors';
import fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { authMiddleware } from './middleware/auth';
import { futRoutes } from './routes/futs/futs';
import { scopedRoutes } from './routes/futs/scoped-routes';

const app = fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000'];

app.register(cors, {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
});

// Auth middleware — extracts user from Firebase token
app.register(authMiddleware);

// Fut management routes (create/list futs, members, roles)
app.register(futRoutes, { prefix: '/api' });

// All domain routes scoped under /futs/:futId/
app.register(scopedRoutes, { prefix: '/api' });

app.listen({ port: 3334 }).then(() => {
  console.log('Server running on port 3334!');
});
