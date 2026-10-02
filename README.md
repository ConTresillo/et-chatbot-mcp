# ChatMCP Widgets
![image](https://github.com/user-attachments/assets/589bd755-491c-4dfb-bfaf-56d9a7cd155e)
![ChatMCP Widgets](https://img.shields.io/badge/ChatMCP-Widgets-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)

A lightweight self-hosted platform for hosting and configuring MCP-enabled chat widgets remotely. Deploy, create and manage AI chat widgets to embed on your website. Add an MCP client toyour websites, dashboards, and applications with access to advanced AI models and external tools.

[Watch Demo 1 ](https://stream.new/v/CvQxjzLQ66402W90000neGB7YxAPIdRMxRspzQkO9hRwNI) | 
[Watch Demo 2 ](https://stream.new/v/CvQxjzLQ66402W90000neGB7YxAPIdRMxRspzQkO9hRwNI) 
```
┌─────────────────────────────────────────┐
│                                         │
│  ChatMCP Widgets                     ×  │
│ ┌─────────────────────────────────────┐ │
│ │ AI Assistant                        │ │
│ │                                     │ │
│ │ Hello! How can I help you today?    │ │
│ │                                     │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ Tell me about MCP tools.        │ │ │
│ │ └─────────────────────────────────┘ │ │
│ │                                     │ │
│ │ MCP tools provide powerful          │ │
│ │ capabilities like file access,      │ │
│ │ API integrations, database          │ │
│ │ connections, and more.              │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Message                          ▶  │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

## 🌟 Features
![image](https://github.com/user-attachments/assets/ca477edb-a265-4c60-ac7c-053368b515fa)

- **Customizable Widgets**: Create chat widgets with custom positions, sizes, and AI providers.
- **Full Screen Chat**: Integrate a full screen chat experience that fills its parent container.
- **MCP Tool Support**: Connect to MCP servers to give your chat widgets access to powerful tools like file access, API integrations, and more.
- **OpenAI-compatible Providers**: Use OpenAI, LM Studio, Ollama, OpenRouter, vLLM, or other compatible endpoints for each widget.
- **Conversation History**: Chat history is automatically saved for each session. Users can continue conversations where they left off.
- **Easy Integration**: Simple embed code to add widgets to any website or application.
- **Responsive Design**: Chat widgets work seamlessly on desktop and mobile devices.

## 📋 Requirements

- Node.js 18.x or later
- PostgreSQL database
- OpenAI-compatible API key (for hosted providers; optional for local endpoints like LM Studio/Ollama)
- MCP server endpoints (optional, for tool capabilities)

## 🚀 Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/chatmcp-widgets.git
   cd chatmcp-widgets
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/chatmcp"
   OPENAI_API_KEY="your-openai-compatible-api-key"
   OPENAI_COMPATIBLE_BASE_URL="https://api.openai.com/v1"
   OPENAI_COMPATIBLE_MODEL="gpt-4o"
   NEXTAUTH_SECRET="your-auth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

### Database Setup

This project uses Drizzle ORM with PostgreSQL. The database schema is defined in `lib/db/schema.ts`.

```bash
# Generate migration files based on your schema
pnpm db:generate

# Push schema changes directly to the database (for development)
pnpm db:push

# Run migrations
pnpm db:migrate

# Open Drizzle Studio to view and edit your database
pnpm db:studio
```

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧰 Usage

### Creating a Chat Widget

1. Navigate to the Admin dashboard at `/admin`
2. Click "New Widget" to create a new chat widget
3. Configure the following settings:
   - Name: A descriptive name for your widget
   - Description: (Optional) A brief description
   - Default Provider: OpenAI-compatible (configured by Base URL/model/API key)
   - Position: Select where the widget should appear on the page
   - Size: Choose the size of the chat widget
   - System Prompt: Define the behavior and capabilities of your assistant

### OpenAI-Compatible Provider Configuration

The chat backend now uses a single OpenAI-compatible provider. Widgets can override the provider with `model`, `baseUrl`, and `apiKey`; otherwise the server falls back to environment variables.

Environment variables:

```bash
OPENAI_API_KEY="..."                         # or OPENAI_COMPATIBLE_API_KEY
OPENAI_COMPATIBLE_BASE_URL="https://api.openai.com/v1"
OPENAI_COMPATIBLE_MODEL="gpt-4o"
```

Examples:

| Provider | Base URL | Model | API Key |
| --- | --- | --- | --- |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` | required |
| LM Studio | `http://localhost:1234/v1` | your loaded model | optional/dummy |
| Ollama | `http://localhost:11434/v1` | `llama3.1` | optional/dummy |
| OpenRouter | `https://openrouter.ai/api/v1` | `openai/gpt-4o` | required |
| vLLM | `http://localhost:8000/v1` | served model name | optional/dummy or required |

### MCP Server Configuration

To enable tool capabilities, you can connect your widget to one or more MCP servers:

1. In the widget creation/edit form, add a new MCP server
2. Configure the server settings:
   - Server Name: A descriptive name for the server
   - Server URL: The endpoint URL for your MCP server
   - Server Type: Choose between SSE (Server-Sent Events) or HTTP
   - Default Server: Set as default if you have multiple servers

### Testing Your Widget

1. Navigate to the Demo page at `/demo`
2. Enter your widget ID (found in the admin dashboard)
3. Click "Load Widget" to test your chat widget in real-time

### Embedding Your Widget

You have two options for embedding your chat widget on your website:

#### Option 1: Traditional Script Embed

Add the following code to your HTML:

```html
<script src="https://your-chatmcp-domain.com/widget.js" defer></script>
<script>
  window.addEventListener('load', function() {
    ChatMCPWidget.init({
      widgetId: YOUR_WIDGET_ID,
    });
  });
</script>
```

Replace `YOUR_WIDGET_ID` with the ID of your chat widget from the admin dashboard.

#### Option 2: Web Component (Recommended)

Use the chat widget as a standard web component:

```html
<!-- Include the web component script -->
<script src="https://your-chatmcp-domain.com/dist/mcp-chat-widget.js"></script>

<!-- Use the web component in your HTML -->
<mcp-chat-widget 
  widget-id="123" 
  name="My Chat Widget"
  description="A customizable chat widget"
  position="bottom-right"
  size="md">
</mcp-chat-widget>
```

The web component approach offers several advantages:
- Standard HTML element that works with any framework
- Declarative configuration through HTML attributes
- Better encapsulation and isolation
- Easier to integrate with modern web frameworks
- Tailwind CSS styles encapsulated in Shadow DOM

The web component is built using [@r2wc/react-to-web-component](https://www.npmjs.com/package/@r2wc/react-to-web-component), which converts React components to custom elements with proper prop handling.

To build the web component:

```bash
npm run build:webcomponent
```

This will generate the web component bundle in `public/dist/mcp-chat-widget.js`.

For a live example, visit `/webcomponent-example` in your browser or check out the standalone HTML example at `/webcomponent-example.html`.

## 🧩 Architecture

ChatMCP Widgets is built with:

- **Next.js**: React framework for server-rendered applications
- **TypeScript**: For type safety and better developer experience
- **Drizzle ORM**: For database interactions with PostgreSQL
- **shadcn/ui**: Component library for modern UI elements
- **Tailwind CSS**: Utility-first CSS framework for styling

## 📝 License

[MIT](LICENSE)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support or questions, please open an issue in the GitHub repository or contact the maintainers.

### Using the FullScreenChat Component

For applications that need a chat interface that fills the entire container rather than a floating widget, you can use the `FullScreenChat` component:

```jsx
import { FullScreenChat } from "chatmcp-widgets/components";

function ChatPage() {
  return (
    <div className="h-screen">
      <FullScreenChat 
        widgetId={123}
        initialConfig={{
          name: "Full Screen Assistant",
          description: "AI assistant that fills the entire container",
          systemPrompt: "You are a helpful assistant...",
          mcpServers: [
            {
              name: "My MCP Server",
              url: "https://your-mcp-server.com",
              isDefault: true
            }
          ]
        }}
      />
    </div>
  );
}
```

The `FullScreenChat` component accepts the same configuration options as the widget but is designed to adapt to the size of its parent container. This is ideal for applications where you want to dedicate a full page or section to the chat interface rather than having a floating widget.

To see a live example of the `FullScreenChat` component, visit `/full-screen-chat-example` in your browser.
