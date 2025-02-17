import * as v from 'valibot';

const ModeSchema = v.union([v.literal('file'), v.literal('component')]);

export const BaseConfigSchema = v.object({
  src: v.optional(v.string()),
  dest: v.optional(v.string()),
  mode: v.optional(ModeSchema),
  ts: v.optional(v.boolean()),
  cache: v.optional(v.boolean()),
  flatten: v.optional(v.boolean()),
  prefix: v.optional(v.string()),
  color: v.optional(v.boolean()),
  showPerformance: v.optional(v.boolean()),
  baseUrl: v.optional(v.string()),
});

export type BaseConfig = v.InferOutput<typeof BaseConfigSchema>;

export const CliOptionsSchema = v.object({
  ...BaseConfigSchema.entries,
  ci: v.boolean(),
  config: v.union([v.literal(false), v.string()]),
});

export type CliOptions = v.InferOutput<typeof CliOptionsSchema>;

export const FinalConfigSchema = v.object({
  src: v.string(),
  dest: v.string(),
  ci: v.boolean(),
  mode: ModeSchema,
  ts: v.boolean(),
  cache: v.boolean(),
  flatten: v.boolean(),
  prefix: v.optional(v.string()),
  color: v.boolean(),
  showPerformance: v.boolean(),
  baseUrl: v.optional(v.string()),
});

export type Config = v.InferOutput<typeof FinalConfigSchema>;
