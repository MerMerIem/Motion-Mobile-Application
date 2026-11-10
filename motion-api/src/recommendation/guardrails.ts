import type { LlmOutput } from './llm/llm-output.schema.js';
import { EffortLevel, RecommendationType } from '../generated/prisma/enums.js';

export type GuardContext = {
  preferredActivities: string[]; // 'Walking', 'Running', ...
  minutesPerSession: number;
  lastSession: { effort: string | null; hoursAgo: number } | null;
  recentNotSuitableTypes: string[]; // NotSuitable feedback within 14 days
};

// returns the (possibly adjusted) output, or null if it must be rejected
export function applyGuardrails(out: LlmOutput, ctx: GuardContext): LlmOutput | null {
  // hard safety: a hard session less than 24h ago -> rest
  if (ctx.lastSession?.effort === EffortLevel.Hard && ctx.lastSession.hoursAgo < 24) {
    return {
      type: RecommendationType.Rest,
      durationMinutes: null,
      distanceMeters: null,
      explanation: 'Your last session was hard, so today is a good day to recover.',
    };
  }
  if (out.type === RecommendationType.Rest) {
    return { ...out, durationMinutes: null, distanceMeters: null };
  }
  if (!ctx.preferredActivities.includes(out.type)) return null;
  if (ctx.recentNotSuitableTypes.includes(out.type)) return null;

  // cap duration at 1.5x the user's usual session length
  const cap = Math.round(ctx.minutesPerSession * 1.5);
  const durationMinutes =
    out.durationMinutes === null ? ctx.minutesPerSession : Math.min(out.durationMinutes, cap);
  return { ...out, durationMinutes };
}

export function fallbackRecommendation(ctx: GuardContext): LlmOutput {
  const type = (ctx.preferredActivities.find((t) => !ctx.recentNotSuitableTypes.includes(t)) ??
    RecommendationType.Walking) as LlmOutput['type'];
  return {
    type,
    durationMinutes: ctx.minutesPerSession,
    distanceMeters: null,
    explanation: `A ${ctx.minutesPerSession}-minute ${type} session fits your routine.`,
  };
}