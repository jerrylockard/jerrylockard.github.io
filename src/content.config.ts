import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const writing = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/writing" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tag: z.string(),
    description: z.string(),
    draft: z.boolean().default(false),
  }),
});

// One entry per public meeting Jerry attends. Richer/more structured than
// `writing` on purpose — status tracking and topic tags are the point, not
// free-form reflection. See mcp/server/data/civic-voice-guide.md for the
// editorial rules (fact vs. attribution vs. opinion, what never gets
// published) that every entry in this collection has to follow.
const civicNotes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/civic-notes" }),
  schema: z.object({
    title: z.string(),
    meetingDate: z.coerce.date(),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date(),
    meetingType: z.string(),
    location: z.string(),
    attendance: z.enum(["full", "partial"]),
    recordingCoverage: z.string().optional(),
    status: z.enum(["proposed", "advanced-from-caucus", "approved", "deferred", "rejected", "implemented"]),
    nextActionDate: z.coerce.date().optional(),
    topics: z.array(z.string()).default([]),
    summary: z.string(),
    recordingUrl: z.string().url().optional(),
    officialAgendaUrl: z.string().url().optional(),
    officialPacketUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

// One entry per Mayor's Academy session Jerry attends. Sits between `writing`
// (free-form) and `civicNotes` (heavily structured) — enough structure to
// track where he is in the 8-session program, not a full status/topic system
// like civicNotes since there's no "decision" being tracked here.
const academyNotes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/academy-notes" }),
  schema: z.object({
    title: z.string(),
    sessionNumber: z.number(),
    sessionCount: z.number().default(8),
    sessionDate: z.coerce.date(),
    publishedDate: z.coerce.date(),
    speakers: z.array(z.string()),
    location: z.string(),
    description: z.string(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageCaption: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { writing, civicNotes, academyNotes };
