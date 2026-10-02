import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { widgets, widgetConversations, widgetMessages } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { streamText, stepCountIs } from "ai"
import { createOpenAICompatibleModel } from "@/lib/openai-compatible-provider"
import { extractMessageText, toModelMessages } from "@/lib/chat-messages"
import { initializeMCPClients } from "@/lib/mcp-client"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

export const maxDuration = 30

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const unwrappedParams = await params;
    const widgetId = Number.parseInt(unwrappedParams.id)
    const body = await request.json()
    const messages = Array.isArray(body?.messages) ? body.messages : null

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "messages is required" }, { status: 400 })
    }

    // Get the widget configuration
    const widget = await db.query.widgets.findFirst({
      where: eq(widgets.id, widgetId),
      with: {
        mcpServers: true,
      },
    })

    if (!widget) {
      return NextResponse.json({ error: "Widget not found" }, { status: 404 })
    }

    // Get or create a session ID from cookies
    const cookieStore = await cookies()
    let sessionId = cookieStore.get(`widget_${widgetId}_session`)?.value

    if (!sessionId) {
      sessionId = uuidv4()
      // Set the cookie in the response
      cookieStore.set(`widget_${widgetId}_session`, sessionId, { 
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        sameSite: 'strict',
      })
    }

    // Get or create a conversation for this session
    let conversation = await db.query.widgetConversations.findFirst({
      where: and(eq(widgetConversations.widgetId, widgetId), eq(widgetConversations.sessionId, sessionId)),
    })

    if (!conversation) {
      const [newConversation] = await db
        .insert(widgetConversations)
        .values({
          widgetId,
          sessionId,
        })
        .returning()

      conversation = newConversation
    } else {
      // Update the conversation's updatedAt timestamp
      await db
        .update(widgetConversations)
        .set({ updatedAt: new Date() })
        .where(eq(widgetConversations.id, conversation.id))
    }

    // Initialize MCP clients if the widget has MCP servers
    let mcpTools: Record<string, any> = {}
    let mcpManager: Awaited<ReturnType<typeof initializeMCPClients>> | null = null

    if (widget.mcpServers && widget.mcpServers.length > 0) {
      try {
        const mcpServers = widget.mcpServers.map((server) => ({
          url: server.url,
          type: server.type as "sse" | "http",
          headers: server.headers as any,
        }))

        mcpManager = await initializeMCPClients(mcpServers)
        mcpTools = mcpManager.tools
      } catch (error) {
        console.error("Failed to initialize MCP clients:", error)
      }
    }

    try {
      const model = createOpenAICompatibleModel({
        model: widget.model,
        baseUrl: widget.baseUrl,
        apiKey: widget.apiKey,
      })

      // AI SDK v7 requires the system prompt via `instructions`, not a
      // system-role entry inside `messages`.
      const modelMessages = await toModelMessages(messages)

      // Store user message in the database
      const userMessage = messages[messages.length - 1]
      const userText = extractMessageText(userMessage)
      if (userText.trim()) {
        await db.insert(widgetMessages).values({
          conversationId: conversation.id,
          role: userMessage.role,
          content: userText,
        })
      }

      // Track if the response has completed
      let responseCompleted = false

      // Stream the response
      const result = streamText({
        model,
        messages: modelMessages,
        instructions: widget.systemPrompt || undefined,
        // Pass MCP tools directly to streamText
        tools: Object.keys(mcpTools).length > 0 ? mcpTools : undefined,
        stopWhen: stepCountIs(20), // Allow multiple tool invocation steps
        onFinish: async (response) => {
          responseCompleted = true

          // Persisting must never reject: an unhandled rejection here would
          // take down the server process mid-stream.
          try {
            await db.insert(widgetMessages).values({
              conversationId: conversation.id,
              role: "assistant",
              content: response.text,
            })
          } catch (error) {
            console.error("Failed to store assistant message:", error)
          }

          // Clean up MCP clients only after response is complete
          if (mcpManager) {
            try {
              await mcpManager.cleanup()
            } catch (error) {
              console.error("Error cleaning up MCP clients:", error)
            }
          }
        },
        onError: ({ error }) => {
          responseCompleted = true
          console.error("Stream error:", error)
        },
      })

      // Register cleanup for request abort
      request.signal.addEventListener("abort", async () => {
        if (!responseCompleted) {
          console.log("Request aborted, cleaning up resources")
          try {
            if (mcpManager) {
              await mcpManager.cleanup()
            }
          } catch (error) {
            console.error("Error during cleanup on abort:", error)
          }
        }
      })

      // Return the response without consuming the stream
      // This allows the stream to be processed by the client
      return result.toUIMessageStreamResponse({
        sendReasoning: true,
      })
    } finally {
      // We don't need to clean up MCP clients here
      // as it's handled in onFinish and abort event listener
    }
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 })
  }
}
