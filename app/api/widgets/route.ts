import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { widgets, widgetMcpServers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { widgetCreateSchema } from "@/lib/validation/widget"

// GET /api/widgets - Get all widgets
export async function GET() {
  try {
    const allWidgets = await db.query.widgets.findMany({
      with: {
        mcpServers: true,
      },
    })

    const safeWidgets = allWidgets.map(({ apiKey, ...widget }) => ({
      ...widget,
      hasApiKey: Boolean(apiKey),
    }))

    return NextResponse.json(safeWidgets)
  } catch (error) {
    console.error("Failed to get widgets:", error)
    return NextResponse.json({ error: "Failed to get widgets" }, { status: 500 })
  }
}

// POST /api/widgets - Create a new widget
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = widgetCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid widget configuration", details: parsed.error.flatten() }, { status: 400 })
    }

    const { mcpServers, apiKey, ...widgetData } = parsed.data

    const insertData = {
      ...widgetData,
      defaultProvider: widgetData.defaultProvider || "openai-compatible",
      apiKey: apiKey?.trim() ? apiKey.trim() : null,
    }

    const [widget] = await db.insert(widgets).values(insertData).returning()

    // Create MCP servers if provided
    if (mcpServers && Array.isArray(mcpServers) && mcpServers.length > 0) {
      await db.insert(widgetMcpServers).values(
        mcpServers.map((server: any) => {
          // Extract only the fields we need, excluding any date fields
          const { id: serverId, createdAt, updatedAt, ...serverData } = server;
          return {
            ...serverData,
            widgetId: widget.id,
            // Set the dates explicitly
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }),
      )
    }

    // Get the complete widget with its MCP servers
    const completeWidget = await db.query.widgets.findFirst({
      where: eq(widgets.id, widget.id),
      with: {
        mcpServers: true,
      },
    })

    if (!completeWidget) {
      return NextResponse.json({ error: "Failed to load created widget" }, { status: 500 })
    }

    const { apiKey: createdApiKey, ...safeWidget } = completeWidget
    return NextResponse.json({ ...safeWidget, hasApiKey: Boolean(createdApiKey) }, { status: 201 })
  } catch (error) {
    console.error("Failed to create widget:", error)
    return NextResponse.json({ error: "Failed to create widget" }, { status: 500 })
  }
}
