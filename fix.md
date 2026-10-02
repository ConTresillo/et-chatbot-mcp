# fix.md

OpenAI-compatible provider refactor plus the runtime fixes required to make chat
actually work end-to-end.

---

## 1. Provider: OpenAI â†’ generic OpenAI-compatible

Any endpoint that speaks the OpenAI Chat Completions API now works: OpenAI,
LM Studio, Ollama, OpenRouter, vLLM, and others. Configurable per widget
(`baseUrl`, `model`, `apiKey`) with environment fallbacks.

### New: `lib/openai-compatible-provider.ts`

Single resolver used by both chat routes.

| Setting | Precedence |
| --- | --- |
| API key | widget `apiKey` â†’ `OPENAI_COMPATIBLE_API_KEY` â†’ `OPENAI_API_KEY` â†’ `not-needed` (local hosts only) |
| Base URL | widget `baseUrl` â†’ `OPENAI_COMPATIBLE_BASE_URL` â†’ `OPENAI_BASE_URL` â†’ `https://api.openai.com/v1` |
| Model | widget `model` â†’ `OPENAI_COMPATIBLE_MODEL` â†’ `gpt-4o` |

Two details that are load-bearing:

- **`.chat()`, not `provider(modelId)`.** In `@ai-sdk/openai@4` calling the
  provider directly targets OpenAI's **Responses API** (`/v1/responses`), which
  LM Studio, Ollama and vLLM do not implement â€” they return an empty
  completion. `.chat()` targets `/v1/chat/completions`. This preserves real
  OpenAI behaviour, which also serves `/v1/chat/completions`.
- **`normalizeBaseUrl()`** appends `/v1` when the URL has no path. The SDK
  appends `/chat/completions` to the base URL, so `http://localhost:1234`
  requests `/chat/completions`; LM Studio only mounts `/v1/chat/completions`
  and answers with a JSON error the SDK silently reports as empty text. A URL
  that already carries a path (e.g. OpenRouter's `/api/v1`) is left untouched.

### Anthropic removed

Dropped from `package.json`, both chat routes, the provider selector, the model
settings UI, the widget preview, the admin dashboard, the landing page, and all
READMEs. No Anthropic behaviour is retained.

---

## 2. Runtime bugs fixed

These were pre-existing and unrelated to the provider refactor, but each one
blocked the chatbot from working.

### 2.1 Database driver could not connect at all â€” `ENOTFOUND`

`lib/db/index.ts` and `lib/db/migrate.ts` used `@neondatabase/serverless`
against a **Supabase** URL. The Neon driver rewrites
`db.<ref>.supabase.co` â†’ `api.<ref>.supabase.co`, which does not exist, so
every query failed:

```
getaddrinfo ENOTFOUND api.<project-ref>.supabase.co
```

Switched to `postgres` + `drizzle-orm/postgres-js` (`postgres` was already a
dependency â€” no new install), with `ssl: "require"` and `prepare: false`.

### 2.2 Proxy routes pointed at a dead host â€” `ERR_CONNECTION_REFUSED`

All six `app/api/proxy/**` routes and `components/full-screen-chat.tsx`
hardcoded `https://mcpwrapper.app`, so the embedded widget forwarded its config
fetch off-site to a host that no longer resolves.

New `lib/proxy-origin.ts` resolves the upstream from `NEXT_PUBLIC_URL`, falling
back to the incoming request origin. `loader.js` and the embed-code generator
likewise fall back to `request.nextUrl.origin`, so embed snippets work on any
host.

### 2.3 AI SDK v7 message shape â€” 500 that killed the server

v7 clients send UIMessages (`{ id, role, parts[] }`) with no `content` field.
The route read `userMessage.content` â†’ `undefined` â†’ `null`:

```
null value in column "content" of relation "widget_messages" violates not-null constraint
```

Two consequences:

- The insert failed on every message.
- `onFinish` is an async callback; its rejection was unhandled, which
  **terminated the server process**. That is why the browser saw
  `ERR_CONNECTION_REFUSED` on the *retry* â€” the API was already dead.

New `lib/chat-messages.ts`:

- `extractMessageText()` reads text from `parts[]`, falling back to a flat
  `content` string so older/hand-rolled payloads keep working.
- `toModelMessages()` routes through `convertToModelMessages()` (async in v7)
  so `streamText` receives real ModelMessages, and passes legacy
  `{ role, content }` payloads through untouched.

`onFinish` persistence is now wrapped in `try/catch` so a database error can
never take down the process mid-stream again.

### 2.4 System prompt rejected by the SDK

v7 refuses system messages inside `messages`. The widget system prompt now goes
through the `instructions` option.

### 2.5 AI SDK v7 upgrade debt (blocked type-checking)

`tsc --noEmit` failed on `main` before any of this work:

| Broken | Fixed |
| --- | --- |
| `ai/react` (removed in v7) | `@ai-sdk/react` |
| `experimental_createMCPClient` from `ai` | `@ai-sdk/mcp` |
| `zod@3.24.4` lacks the `zod/v4` subpath `ai@7` imports | `zod@^3.25.76` |
| `useChat` lost `input`/`handleSubmit`/`isLoading`/`api` | local input state + `sendMessage`, `DefaultChatTransport` |
| `message.parts` tool shape | `isToolUIPart()` / `getToolName()` |
| `toDataStreamResponse` | `toUIMessageStreamResponse` |
| `maxSteps` | `stopWhen: stepCountIs(20)` |

MCP tool calling and multi-step tool loops are preserved.

---

## 3. Schema, API and admin UI

`lib/db/schema.ts` gains `model`, `baseUrl`, `apiKey`; `defaultProvider`
defaults to `openai-compatible`.

Migration `drizzle/0001_familiar_black_bird.sql` (generated and applied):

```sql
ALTER TABLE "widgets" ALTER COLUMN "default_provider" SET DEFAULT 'openai-compatible';
ALTER TABLE "widgets" ADD COLUMN "model" varchar(255);
ALTER TABLE "widgets" ADD COLUMN "base_url" varchar(2048);
ALTER TABLE "widgets" ADD COLUMN "api_key" text;
```

**Secret handling.** `apiKey` is write-only over HTTP. `GET /api/widgets` and
`GET /api/widgets/[id]` strip the column and return `hasApiKey: boolean`
instead. Keys are read only server-side in the chat route.

**Validation.** New `lib/validation/widget.ts` (zod) covers widget create,
widget update and chat requests, replacing the previous pass-through of
unvalidated request bodies straight into Drizzle.

**Admin UI.** Model Settings is now Base URL / Model / API Key inputs instead of
a provider dropdown plus a fixed model list. Blank API key on edit keeps the
stored key; blank on create falls back to the environment.

---

## 4. Verification

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | clean (previously failed) |
| `pnpm build` | success |
| `pnpm build:webcomponent` / `build:fullscreen` | success |
| `pnpm db:migrate` | applied |
| `POST /api/widgets` | 201, no `apiKey` in response |
| `GET /api/widgets` / `DELETE` / `/admin` | 200 |
| `POST /api/widgets/2/chat` | 200 `text/event-stream`, `finishReason: stop`, text deltas |

Live stream against local `qwen3-0.6b`:

```
data: {"type":"text-delta","id":"0","delta":"Hi"}
data: {"type":"text-delta","id":"0","delta":" there"}
data: {"type":"text-delta","id":"0","delta":"!"}
data: {"type":"finish","finishReason":"stop"}
data: [DONE]
```

---

## 5. Configuration

```bash
OPENAI_API_KEY=sk-...                              # or OPENAI_COMPATIBLE_API_KEY
OPENAI_COMPATIBLE_BASE_URL=https://api.openai.com/v1
OPENAI_COMPATIBLE_MODEL=gpt-4o
```

| Provider | Base URL | Model | API key |
| --- | --- | --- | --- |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` | required |
| LM Studio | `http://localhost:1234` | loaded model name | not needed |
| Ollama | `http://localhost:11434` | `llama3.1` | not needed |
| OpenRouter | `https://openrouter.ai/api/v1` | `openai/gpt-4o` | required |
| vLLM | `http://localhost:8000` | served model name | usually not needed |

`/v1` is optional in the base URL â€” it is appended automatically when the URL
has no path.

---

## 6. Known issues (not addressed)

- **Build memory.** `pnpm build` intermittently dies in webpack's `WasmHash`
  with `Cannot read properties of undefined (reading 'length')`. It is an OOM
  in the build worker, not a code error â€” `tsc` is clean and the build succeeds
  with `NODE_OPTIONS=--max-old-space-size=10240`. Pre-existing; not fixed here.
- **`pnpm lint`** prompts for ESLint setup because the repo has no ESLint
  config. Pre-existing; `next.config.mjs` sets `ignoreDuringBuilds: true`.
- **No tests.** The repository has no test suite, so verification is limited to
  type-checking, building and the manual HTTP checks above.
