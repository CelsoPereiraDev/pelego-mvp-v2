import { z } from 'zod';

export const playerOverallSchema = z.object({
  pace: z.string().min(0).max(100),
  shooting: z.string().min(0).max(100),
  passing: z.string().min(0).max(100),
  dribble: z.string().min(0).max(100),
  defense: z.string().min(0).max(100),
  physics: z.string().min(0).max(100),
});


export const playerGetOverallSchema = z.object({
  name: z.string().min(1, { message: 'Nome do jogador é obrigatório' }),
  country: z.string().optional(),
  team: z.string().optional(),
  image: z.string().optional(),
  position: z.enum(['MEI', 'ATK', 'DEF', 'GOL'], { message: 'Posição inválida' }),
  overall: playerOverallSchema,
});


