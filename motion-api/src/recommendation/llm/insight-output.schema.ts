import { z } from 'zod';
import { RecommendationType } from '../../generated/prisma/enums.js';

export const HIGHLIGHT_KINDS = [
  'goal',
  'consistency',
  'volume',
  'variety',
  'intensity',
] as const;

const HighlightSchema = z.object({
  kind: z.enum(HIGHLIGHT_KINDS),
  label: z.string().trim().min(1).max(30),
  text: z.string().trim().min(1).max(120),
});

const NextStepSchema = z.object({
  type: z.enum(RecommendationType),
  durationMinutes: z.int().min(5).max(300).nullable(),
  distanceMeters: z.int().min(100).max(100_000).nullable(),
  explanation: z.string().trim().min(1).max(200),
});

export const InsightOutputSchema = z.object({
  title: z.string().trim().min(1).max(60),
  summary: z.string().trim().min(1).max(300),
  highlights: z.array(HighlightSchema).min(2).max(4),
  nextStep: NextStepSchema,
});

export type InsightOutput = z.infer<typeof InsightOutputSchema>;