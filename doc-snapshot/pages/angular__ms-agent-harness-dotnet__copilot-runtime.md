# Copilot Runtime

> The Copilot Runtime is the backend that connects your frontend to your AI agents, providing authentication, middleware, routing, and more.


The Copilot Runtime is the backend layer that connects your frontend application to your AI agents. It's set up during the [quickstart](/angular/ms-agent-harness-dotnet/quickstart) and is the recommended way to use CopilotKit.

## Runtime languages

**TypeScript is the default and most fully featured runtime. It is the only runtime that can run without CopilotKit Intelligence.** Use it for an open-source setup, or connect it to Intelligence when you need its services.

Python, Go, Ruby, and C#/.NET runtimes require an Intelligence project and server-side API key. They work with both [cloud-hosted](/angular/ms-agent-harness-dotnet/intelligence/managed-intelligence-platform) and [self-hosted](/angular/ms-agent-harness-dotnet/intelligence/self-hosting) Intelligence; they do not provide an in-memory or SQLite runner.

| Language | Host | Without Intelligence |
| --- | --- | --- |
| TypeScript | Next.js, Express, Hono, and other JavaScript servers | Yes |
| Python | ASGI, with Python 3.11+ | No |
| Go | `net/http`, with Go 1.22+ | No |
| Ruby | Rack, including Rails and Sinatra, with Ruby 2.7+ | No |
| C#/.NET | ASP.NET Core, with .NET 8 | No |

Your runtime language does not have to match your agent language. Each runtime can connect to a remote AG-UI agent. A Python agent can stay behind a TypeScript runtime, for example.

Use the [Intelligence quickstart](/angular/ms-agent-harness-dotnet/intelligence/quickstart#connect-your-runtime) for language-specific installation, authentication, and server setup. Shared Intelligence capabilities do not imply identical runtime APIs: TypeScript options such as `BuiltInAgent`, custom `AgentRunner` classes, audio transcription, and Open Generative UI are not available in every implementation.

The examples below use the TypeScript runtime.


## Setting Up the Runtime

The runtime is a lightweight server endpoint that you add to your backend:

```npm
npm install @copilotkit/runtime
```

Here's a minimal example using Next.js. `createCopilotRuntimeHandler` returns a
plain fetch handler. It lives at a **catch-all**
path and exports **GET, POST, PATCH, and DELETE**, so the runtime can serve its sub-routes (`/info`,
agent runs, threads) rather than a single URL:

```ts title="app/api/copilotkit/[[...slug]]/route.ts" doctest="component"
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";

const runtime = new CopilotRuntime({
  agents: {
    // your agents go here
  },
  runner: new InMemoryAgentRunner(),
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
```

With the route in place, `GET /api/copilotkit/info` returns a JSON description of the
runtime and the agents it has registered. That route is how tooling — and the frontend's
transport auto-detection — discovers your runtime, so it is the quickest way to confirm
the endpoint is wired up.

Then point your frontend at the endpoint:




```ts title="src/app/app.config.ts"
import { provideCopilotKit } from "@copilotkit/angular";

provideCopilotKit({
  runtimeUrl: "/api/copilotkit",
})
```


For setup with other backend frameworks (Express, NestJS, Node.js HTTP), see the [quickstart](/angular/ms-agent-harness-dotnet/quickstart).

## Which name identifies an agent

The name you use to address an agent from the frontend must equal a **key of the
runtime's `agents` map**. That key is the only name the frontend can ask for. An
agent's own `name`, `id`, or class name is never used for routing, and the two are
free to differ.

```ts title="app/api/copilotkit/[[...slug]]/route.ts"
const runtime = new CopilotRuntime({
  agents: {
    // `my_agent` is the key — the one string the frontend may ask for.
    my_agent: new HttpAgent({ url: "http://localhost:8000/" }),
  },
});
```




```html title="src/app/app.component.html"
<copilot-chat agentId="my_agent" />
```


Most integrations write that key literally in the runtime route, as above, so the
binding is visible in one file. Some derive it instead, and that is where the rule
stops being obvious:

- **Mastra** — `MastraAgent.getRemoteAgents` and `getLocalAgents` both build the map
  from `listAgents()`, which is keyed by the **record key** in
  `new Mastra({ agents: { ... } })`, not by the agent's `id`. Given
  `new Agent({ name: "My Agent" })` exported as `myAgent` and registered as
  `agents: { myAgent }`, the runtime key is `myAgent`.
- **LangGraph** — `graphId` is a *separate* binding, from the runtime to a key in your
  deployment's `langgraph.json`. It does not have to equal the runtime's agents-map
  key, and it is not the name the frontend asks for. The starter template happens to
  use `sample_agent` for both.

<Callout type="warn" title="An agent's declared name is not its routing key">
  Asking for a name the runtime did not register resolves no agent, and the frontend
  raises `CopilotKitAgentDiscoveryError` — see [Agent discovery
  failed](/angular/ms-agent-harness-dotnet/guides/troubleshooting). The error message lists the keys the
  runtime actually returned, which is the quickest way to see the real names.
</Callout>

To read the registered keys directly, hit `GET {runtimeUrl}/info`. It returns the
agents the runtime advertises, under exactly the names the frontend must use.


## The Default Agent

If you register an agent with the name `"default"`, CopilotKit's prebuilt UI components will use it automatically without any additional configuration on the frontend. This is useful when you have one primary agent and don't want to specify an `agentId` everywhere.

```ts title="app/api/copilotkit/[[...slug]]/route.ts"
const runtime = new CopilotRuntime({
  agents: {
    // Frontend APIs use this agent when no other agent id is selected.
    default: new HttpAgent({ url: "https://my-agent.example.com" }),
  },
});
```

When you register multiple agents, the `"default"` agent powers the chat unless a specific agent is selected. Other agents remain addressable through the frontend agent API.

## What the Runtime Provides

### Authentication and Security

The runtime runs on your server, which means agent communication stays server-side. This gives you a trusted environment to enforce authentication, validate requests, and keep API keys secure. When you use the runtime, safe defaults are put in place so your agent endpoints are not exposed to unauthenticated access.

### AG-UI Middleware

The [AG-UI protocol](/angular/ms-agent-harness-dotnet/agentic-protocols/ag-ui) supports a middleware layer (`agent.use`) for logging, guardrails, request transformation, and more. Because the runtime runs server-side, this middleware executes in a trusted environment where it cannot be tampered with by the client.

### Agent Routing

When you register multiple agents with the runtime, it handles discovery and routing automatically. Your frontend doesn't need to know the details of where each agent lives or how to reach it.

### CopilotKit Intelligence

Features like [threads](/angular/ms-agent-harness-dotnet/guides/threads-memory-attachments-headless) and the [inspector](/angular/ms-agent-harness-dotnet/inspector) are provided through the runtime and CopilotKit Intelligence. These give you conversation persistence and debugging capabilities out of the box.

## Built-in Middleware

The runtime supports two first-class middleware options you can enable directly on `CopilotRuntime` without calling `.use()` on each agent manually.

### A2UI

Pass `a2ui: {}` to automatically apply `A2UIMiddleware` to all registered agents:

```ts title="app/api/copilotkit/[[...slug]]/route.ts"
const runtime = new CopilotRuntime({
  agents: { default: myAgent },
  a2ui: {}, // enables A2UI rendering for all agents
});
```

To scope it to specific agents only, pass an `agents` list:

```ts
a2ui: {
  agents: ["my-agent"];
}
```

On the frontend, the A2UI renderer activates automatically. Configure `a2ui`
only when you want to override its defaults:




```ts title="src/app/app.config.ts"
provideCopilotKit({
  runtimeUrl: "/api/copilotkit",
  a2ui: { theme: myCustomTheme },
})
```


### mcpApps

Pass `mcpApps` to configure MCP servers for all agents from a single place:

```ts title="app/api/copilotkit/[[...slug]]/route.ts"
const runtime = new CopilotRuntime({
  agents: { default: myAgent },
  mcpApps: {
    servers: [
      { type: "http", url: "http://localhost:3108/mcp", serverId: "my-server" },
    ],
  },
});
```

Each server entry optionally accepts an `agentId` field to scope that server to a single agent. Without it, the server is available to all agents.

## What If I Want to Connect to My AG-UI Agent Directly?

CopilotKit is built on the [AG-UI protocol](/angular/ms-agent-harness-dotnet/agentic-protocols/ag-ui), which is an open standard. If you want to connect your frontend directly to an AG-UI-compatible agent without the runtime, pass the agent instance in your frontend configuration:




```ts title="src/app/app.config.ts"
import { HttpAgent } from "@ag-ui/client";
import { provideCopilotKit } from "@copilotkit/angular";

provideCopilotKit({
  selfManagedAgents: {
    "my-agent": new HttpAgent({
      url: "https://my-agent.example.com",
    }),
  },
})
```


<Callout type="warn">
  Direct agent connections are intended for development and prototyping. This
  approach is not recommended for production unless you are confident in your
  setup, and is not officially supported by CopilotKit. If you run into issues
  with a direct connection, you will need to troubleshoot on your own.
</Callout>

There are important things to understand before going this route:

1. **Authentication is your responsibility.** When you use the Copilot Runtime, safe defaults are put in place so that your agent endpoints are not exposed to unauthenticated access. When you connect directly, it is entirely up to you to secure your agent endpoint and manage authentication.

2. **Many ecosystem features won't work.** The AG-UI protocol supports a middleware layer designed to run on the backend. Many features in the CopilotKit ecosystem depend on this server-side middleware. Without the runtime, these features — including [threads](/angular/ms-agent-harness-dotnet/guides/threads-memory-attachments-headless) and other capabilities — will not be available.

### Comparison

|                        | With Runtime                | Direct Connection |
| ---------------------- | --------------------------- | ----------------- |
| **Authentication**     | Safe defaults provided      | You manage it     |
| **AG-UI Middleware**   | Runs server-side            | Not available     |
| **Agent Routing**      | Automatic                   | Manual            |
| **Ecosystem Features** | Full support                | Limited           |
| **CopilotKit Support** | Supported                   | Not supported     |
| **Setup**              | Requires a backend endpoint | Frontend-only     |
