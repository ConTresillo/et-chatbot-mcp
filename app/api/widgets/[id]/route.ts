import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { widgets, widgetMcpServers, widgetConversations } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { widgetUpdateSchema } from "@/lib/validation/widget"

// GET /api/widgets/[id] - Get a specific widget
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const unwrappedParams = await params;
    const id = Number.parseInt(unwrappedParams.id)

    const widget = await db.query.widgets.findFirst({
      where: eq(widgets.id, id),
      with: {
        mcpServers: true,
      },
    })

    if (!widget) {
      return NextResponse.json({ error: "Widget not found" }, { status: 404 })
    }

    const { apiKey, ...safeWidget } = widget
    return NextResponse.json({ ...safeWidget, hasApiKey: Boolean(apiKey) })
  } catch (error) {
    console.error("Failed to get widget:", error)
    return NextResponse.json({ error: "Failed to get widget" }, { status: 500 })
  }
}

// PUT /api/widgets/[id] - Update a widget
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const unwrappedParams = await params;
    const id = Number.parseInt(unwrappedParams.id)
    const body = await request.json()
    const parsed = widgetUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid widget configuration", details: parsed.error.flatten() }, { status: 400 })
    }

    const { mcpServers, apiKey, ...widgetData } = parsed.data

    const updateData: Partial<typeof widgets.$inferInsert> = {}
    for (const field of ["name", "description", "systemPrompt", "defaultProvider", "position", "size", "model", "baseUrl"] as const) {
      const value = widgetData[field]
      if (value !== undefined) {
        ;(updateData as Record<string, string | null>)[field] = value === "" ? null : value
      }
    }

    if (apiKey !== undefined && apiKey !== null && apiKey.trim() !== "") {
      updateData.apiKey = apiKey.trim()
    }

    updateData.updatedAt = new Date()

    await db
      .update(widgets)
      .set(updateData)
      .where(eq(widgets.id, id))

    // Handle MCP servers if provided
    if (mcpServers && Array.isArray(mcpServers)) {
      // Delete existing MCP servers
      await db.delete(widgetMcpServers).where(eq(widgetMcpServers.widgetId, id))

    // Add new MCP servers
    if (mcpServers.length > 0) {
      await db.insert(widgetMcpServers).values(
        mcpServers.map((server: any) => {
          // Extract only the fields we need, excluding any date fields
          const { id: serverId, createdAt, updatedAt, ...serverData } = server;
          return {
            ...serverData,
            widgetId: id,
            // Set the dates explicitly
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }),
      )
    }
    }

    // Get the updated widget
    const updatedWidget = await db.query.widgets.findFirst({
      where: eq(widgets.id, id),
      with: {
        mcpServers: true,
      },
    })

    if (!updatedWidget) {
      return NextResponse.json({ error: "Widget not found" }, { status: 404 })
    }

    const { apiKey: updatedApiKey, ...safeUpdatedWidget } = updatedWidget
    return NextResponse.json({ ...safeUpdatedWidget, hasApiKey: Boolean(updatedApiKey) })
  } catch (error) {
    console.error("Failed to update widget:", error)
    return NextResponse.json({ error: "Failed to update widget" }, { status: 500 })
  }
}

// DELETE /api/widgets/[id] - Delete a widget
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const unwrappedParams = await params;
    const id = Number.parseInt(unwrappedParams.id)

    // First delete all associated conversations
    // This is necessary because widgetConversations doesn't have onDelete: "cascade"
    await db.delete(widgetConversations).where(eq(widgetConversations.widgetId, id))
    
    // Now delete the widget (cascade will handle other related records like widgetMcpServers)
    await db.delete(widgets).where(eq(widgets.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete widget:", error)
    return NextResponse.json({ error: "Failed to delete widget" }, { status: 500 })
  }
}
