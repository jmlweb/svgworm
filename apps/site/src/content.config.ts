import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';

// The consumer docs (ADR-0018). A file that breaks this schema fails the build.
const docs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string().min(1),
    /** Shorter label for the sidebar when the title is long. */
    navTitle: z.string().min(1).optional(),
    description: z.string().min(1),
    order: z.number().int(),
  }),
});

export const collections = { docs };
