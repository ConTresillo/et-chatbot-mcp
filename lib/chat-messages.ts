import { convertToModelMessages, type ModelMessage, type UIMessage } from "ai"

type UnknownMessage = Record<string, unknown>

function isUnknownMessage(value: unknown): value is UnknownMessage {
  return typeof value === "object" && value !== null
}

/**
 * AI SDK v7 clients send UIMessages, whose text lives in `parts[]`.
 * Older/hand-rolled payloads still use a flat `content` string.
 */
export function extractMessageText(message: unknown): string {
  if (typeof message === "string") {
    return message
  }

  if (!isUnknownMessage(message)) {
    return ""
  }

  if (typeof message.content === "string" && message.content.length > 0) {
    return message.content
  }

  const parts = message.parts
  if (!Array.isArray(parts)) {
    return ""
  }

  return parts
    .filter((part): part is { type: string; text?: string } => isUnknownMessage(part) && typeof part.type === "string")
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("")
}

/**
 * Normalise an incoming request payload into ModelMessages for streamText.
 * UIMessages are converted via the AI SDK; legacy `{ role, content }` payloads
 * are passed through unchanged so existing integrations keep working.
 */
export async function toModelMessages(messages: unknown[]): Promise<ModelMessage[]> {
  const looksLikeUIMessages = messages.some(
    (message) => isUnknownMessage(message) && Array.isArray(message.parts) && message.content === undefined,
  )

  if (!looksLikeUIMessages) {
    return messages as ModelMessage[]
  }

  return convertToModelMessages(messages as UIMessage[])
}
