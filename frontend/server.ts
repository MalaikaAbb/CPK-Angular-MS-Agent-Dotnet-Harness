/**
 * Copilot Runtime for this harness.
 *
 * Shape comes from the Angular quickstart's Node runtime server, with the
 * agent swapped for the Microsoft Agent Framework (.NET) backend in
 * `../backend`.
 *
 * That backend exposes plain AG-UI endpoints — `app.MapAGUI(...)` in
 * backend/Program.cs mounts `POST /` (the default agent), `POST /subagents`
 * (the Sub-Agents supervisor) and `POST /research` (the AG-UI guide's
 * `research-agent`), each streaming AG-UI events over SSE.
 *
 * `default` and `support` resolve to the same Agent Framework agent.
 * `support` exists so the doc snippets that use `agentId="support"` (Chat UI,
 * Threads) run verbatim. The agents-map key is the only name the frontend can
 * ask for (Copilot Runtime guide, "Which name identifies an agent").
 *
 * `a2ui: {}` enables A2UIMiddleware for every registered agent, per
 * https://docs.copilotkit.ai/angular/ms-agent-harness-dotnet/backend/copilot-runtime
 * — it is a runtime-side middleware and is independent of which agent binding
 * is used.
 *
 * Ports: backend/Program.cs binds 8251, so the runtime takes 8250. Override
 * either side with PORT / MICROSOFT_AGENT_FRAMEWORK_URL.
 */
// quickstart : copilot runtime
import { createServer } from "node:http";
import { CopilotRuntime, CopilotKitIntelligence } from "@copilotkit/runtime/v2";
import { createCopilotNodeListener } from "@copilotkit/runtime/v2/node";
import { HttpAgent } from "@ag-ui/client";

const agentUrl =
  process.env["MICROSOFT_AGENT_FRAMEWORK_URL"] ?? "http://localhost:8251/";

/**
 * Intelligence client, verbatim from
 * https://docs.copilotkit.ai/angular/ms-agent-harness-dotnet/intelligence/connect-your-runtime
 * ("Wire the runtime"). Thread endpoints are served by Intelligence, so the
 * Threads guide's `injectThreads` list and `CopilotThreadsDrawer` resolve to
 * nothing until this is passed — which that guide never says.
 *
 * `apiUrl`/`wsUrl` default to the managed platform, so both stay unset.
 */
const intelligence = new CopilotKitIntelligence({
  apiKey: process.env["CPK_INTELLIGENCE_API_KEY"]!,
});

// quickstart : copilot runtime start
const runtime = new CopilotRuntime({
  agents: {
    // quickstart : connect selected agent backend
    default: new HttpAgent({ url: agentUrl }),
    // chat ui : support agent
    support: new HttpAgent({ url: agentUrl }),
    // subagents : supervisor agent (backend/SubagentsAgent.cs)
    subagents: new HttpAgent({ url: `${agentUrl}subagents` }),
    // ag-ui : research agent (backend/ResearchAgent.cs, self-defined)
    "research-agent": new HttpAgent({ url: `${agentUrl}research` }),
  },
  // a2ui : enable a2ui middleware start
  a2ui: {},
  // a2ui : enable a2ui middleware end
  intelligence,
  // Threads are per-user. Without this every visitor shares one history.
  identifyUser: (request) => ({
    id: request.headers.get("x-user-id") ?? "anonymous",
    name: request.headers.get("x-user-name") ?? "Anonymous",
  }),
});
// quickstart : copilot runtime end

const port = Number(process.env["PORT"] ?? 8250);

/**
 * The app is served from another origin than the runtime: `ng serve`
 * (package.json `start`) and the built SSR server (src/server.ts). Both are
 * listed, with the headers the client sends (`content-type`, the license
 * header `provideCopilotKit` adds when a key is set, and the `x-user-*`
 * headers `identifyUser` reads).
 *
 * The ms-agent-dotnet harness also enables credentials here, for its
 * Authentication guide; that guide is not part of this harness.
 */
const cors = {
  origin: ["http://localhost:4250", "http://localhost:4252"],
  allowHeaders: [
    "content-type",
    "x-copilotcloud-public-api-key",
    "x-user-id",
    "x-user-name",
  ],
};


// quickstart : create copilot node listener start
const listener = createCopilotNodeListener({
  runtime,
  basePath: "/api/copilotkit",
  cors,
});

createServer(listener).listen(port, () => {
  console.log(
    `Copilot Runtime listening at http://localhost:${port}/api/copilotkit`,
  );
  console.log(`Microsoft Agent Framework (.NET) agent: ${agentUrl}`);
});
// quickstart : create copilot node listener end
