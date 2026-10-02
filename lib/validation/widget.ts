import { z } from "zod"

export const openAICompatibleWidgetSchema = z.object({
  defaultProvider: z.string().min(1).max(50).default("openai-compatible"),
  model: z.string().trim().min(1).max(255).nullish(),
  baseUrl: z.string().trim().url().max(2048).nullish().or(z.literal("")),
  apiKey: z.string().trim().max(2048).nullish(),
})

export const widgetCreateSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(1000).nullish(),
  systemPrompt: z.string().nullish(),
  defaultProvider: z.string().trim().min(1).max(50).default("openai-compatible"),
  position: z.string().trim().max(50).default("bottom-right"),
  size: z.string().trim().max(10).default("md"),
  model: z.string().trim().max(255).nullish(),
  baseUrl: z.string().trim().url().max(2048).nullish().or(z.literal("")),
  apiKey: z.string().trim().max(2048).nullish(),
  mcpServers: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(255),
        url: z.string().trim().url().max(255),
        type: z.enum(["sse", "http"]).default("sse"),
        isDefault: z.boolean().optional(),
        headers: z.record(z.string(), z.string()).optional(),
      }),
    )
    .optional(),
})

export const widgetUpdateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(1000).nullish().optional(),
  systemPrompt: z.string().nullish().optional(),
  defaultProvider: z.string().trim().min(1).max(50).optional(),
  position: z.string().trim().max(50).optional(),
  size: z.string().trim().max(10).optional(),
  model: z.string().trim().max(255).nullish().optional(),
  baseUrl: z.string().trim().url().max(2048).nullish().or(z.literal("")).optional(),
  apiKey: z.string().trim().max(2048).nullish().optional(),
  mcpServers: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(255),
        url: z.string().trim().url().max(255),
        type: z.enum(["sse", "http"]).default("sse"),
        isDefault: z.boolean().optional(),
        headers: z.record(z.string(), z.string()).optional(),
      }),
    )
    .optional(),
})

export const chatRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1),
  provider: z.string().optional(),
  model: z.string().optional(),
  baseUrl: z.string().optional(),
  apiKey: z.string().optional(),
  mcpServers: z.array(z.any()).optional(),
})

export type WidgetCreateInput = z.infer<typeof widgetCreateSchema>
export type WidgetUpdateInput = z.infer<typeof widgetUpdateSchema>
export type ChatRequestInput = z.infer<typeof chatRequestSchema>
