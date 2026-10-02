import { streamText } from "ai"
import { createOpenAICompatibleModel } from "@/lib/openai-compatible-provider"
import { initializeMCPClients, type MCPServerConfig } from "@/lib/mcp-client"
import { chatRequestSchema } from "@/lib/validation/widget"
import { toModelMessages } from "@/lib/chat-messages"

export const maxDuration = 30

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = chatRequestSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: "Invalid chat request", details: parsed.error.flatten() }, { status: 400 })
  }

  const { messages, model: requestedModel, baseUrl, apiKey, mcpServers = [] } = parsed.data

  // Initialize MCP clients if provided
  let mcpTools: Record<string, any> = {}
  let mcpManager: Awaited<ReturnType<typeof initializeMCPClients>> | null = null

  if (mcpServers && mcpServers.length > 0) {
    try {
      mcpManager = await initializeMCPClients(mcpServers as MCPServerConfig[])
      mcpTools = mcpManager.tools
    } catch (error) {
      console.error("Failed to initialize MCP clients:", error)
    }
  }

  try {
    const model = createOpenAICompatibleModel({ model: requestedModel, baseUrl, apiKey })

    const result = streamText({
      model,
      messages: await toModelMessages(messages),
      tools: Object.keys(mcpTools).length > 0 ? mcpTools : undefined,
    })

    return result.toUIMessageStreamResponse()
  } finally {
    // Clean up MCP clients
    if (mcpManager) {
      await mcpManager.cleanup()
    }
  }
}
