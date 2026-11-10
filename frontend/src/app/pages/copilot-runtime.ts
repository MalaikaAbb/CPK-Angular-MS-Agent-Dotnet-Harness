import { Component } from '@angular/core';

import { RouteHeader } from '../components/route-header';
import { Callout, Panel, SourceCode, TryIt } from '../components/ui';

@Component({
  selector: 'app-copilot-runtime-page',
  imports: [RouteHeader, Panel, Callout, TryIt, SourceCode],
  template: `
    <app-route-header path="/copilot-runtime" />

    <div class="space-y-6">
      <ui-try-it>
        <p class="mt-1 text-slate-700">
          Run <code>curl http://localhost:8250/api/copilotkit/info</code> and
          find <code>default</code>, <code>support</code>,
          <code>subagents</code> and <code>research-agent</code> among the
          returned agents. Then open the demo and send
          <em>What is a black hole?</em> to each chat.
        </p>
        <p class="mt-2 text-slate-700">
          <strong>Pass:</strong> <code>/info</code> lists all four keys; the
          left chat (no <code>agentId</code>) answers as the default assistant,
          and the right chat answers with a short bulleted list of facts.
          <strong>Fail:</strong> a chat raises
          <code>CopilotKitAgentDiscoveryError</code> — the
          <code>agentId</code> is not a key of the runtime's
          <code>agents</code> map.
        </p>
      </ui-try-it>

      <ui-panel heading="Several agents, one runtime">
        <p class="mb-3 text-sm text-slate-700">
          The <code>agents</code> map in <code>server.ts</code>. Each key is
          the only name the frontend can ask for; an agent's own
          <code>name</code> is never used for routing.
          <code>default</code> powers any chat that names no agent.
        </p>
        <ui-source path="server.ts" />
      </ui-panel>

      <ui-panel heading="Addressing agents from the frontend">
        <ui-source
          path="src/app/features/copilot-runtime/multi-agent-chat.component.ts"
        />
      </ui-panel>

      <ui-callout title="What this repo does not run from the guide">
        The guide's server examples are Next.js route handlers; this repo
        serves the same runtime from Node in <code>server.ts</code>, set up by
        the quickstart. <code>a2ui: {{ '{' }}{{ '}' }}</code> is already on, from
        the A2UI guide. <code>mcpApps</code> needs an MCP server, and
        <code>selfManagedAgents</code> bypasses the runtime entirely, so
        neither is wired here — this route shows multiple agents on the
        current runtime only.
      </ui-callout>
    </div>
  `,
})
export default class CopilotRuntimePage {}
