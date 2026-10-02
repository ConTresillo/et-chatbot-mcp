import { createOpenAI } from "@ai-sdk/openai"

export interface OpenAICompatibleConfigInput {
  apiKey?: string | null
  baseUrl?: string | null
  model?: string | null
}

export interface ResolvedOpenAICompatibleConfig {
  apiKey: string
  baseUrl: string
  model: string
  headers?: Record<string, string>
}

const DEFAULT_BASE_URL = "https://api.openai.com/v1"
const DEFAULT_MODEL = "gpt-4o"
const DEFAULT_LOCAL_API_KEY = "not-needed"

function isLocalBaseUrl(baseUrl: string) {
  try {
    const url = new URL(baseUrl)
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1"
  } catch {
    return false
  }
}

/**
 * The AI SDK appends `/chat/completions` to the configured base URL, so a
 * base URL of `http://localhost:1234` would request `/chat/completions` and a
 * server that only mounts the OpenAI API under `/v1` answers with a JSON error
 * that the SDK surfaces as an empty completion. Append `/v1` when the URL has
 * no path so LM Studio / Ollama / vLLM work with a bare host:port.
 */
export function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "")
  if (!trimmed) {
    return DEFAULT_BASE_URL
  }

  try {
    const url = new URL(trimmed)
    if (url.pathname === "" || url.pathname === "/") {
      url.pathname = "/v1"
      return url.toString().replace(/\/+$/, "")
    }
  } catch {
    return trimmed
  }

  return trimmed
}

export function getOpenAICompatibleConfig(input?: OpenAICompatibleConfigInput | null): ResolvedOpenAICompatibleConfig {
  const baseUrl = normalizeBaseUrl(
    input?.baseUrl?.trim() || process.env.OPENAI_COMPATIBLE_BASE_URL || process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL,
  )
  const model = input?.model?.trim() || process.env.OPENAI_COMPATIBLE_MODEL || DEFAULT_MODEL
  const apiKey =
    input?.apiKey?.trim() ||
    process.env.OPENAI_COMPATIBLE_API_KEY ||
    process.env.OPENAI_API_KEY ||
    (isLocalBaseUrl(baseUrl) ? DEFAULT_LOCAL_API_KEY : "")

  return { apiKey, baseUrl, model }
}

export function createOpenAICompatibleModel(input?: OpenAICompatibleConfigInput | null) {
  const config = getOpenAICompatibleConfig(input)
  const provider = createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    name: "openai-compatible",
  })

  // `.chat()` targets /chat/completions. Calling the provider directly targets
  // OpenAI's Responses API, which LM Studio, Ollama, vLLM and most compatible
  // servers do not implement -- they return an empty completion.
  return provider.chat(config.model)
}
