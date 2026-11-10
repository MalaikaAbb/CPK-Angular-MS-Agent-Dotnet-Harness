/**
 * Two agents behind the one Copilot Runtime in server.ts, from
 * https://docs.copilotkit.ai/angular/ms-agent-harness-dotnet/copilot-runtime
 *
 * - "The Default Agent": a copilot-chat with no agentId resolves the
 *   `default` key.
 * - "Which name identifies an agent": the guide's
 *   `<copilot-chat agentId="my_agent" />`, addressed instead to a key this
 *   runtime actually registers — `research-agent`. The key is the only name
 *   the frontend can ask for; the .NET agent's own `name` is never used for
 *   routing.
 *
 * The side-by-side layout is this harness's own; it is not in the guide.
 */
import { Component } from '@angular/core';
import { CopilotChat } from '@copilotkit/angular';

@Component({
  selector: 'app-multi-agent-chat',
  imports: [CopilotChat],
  template: `
    <div style="display: flex; height: 100%; gap: 1rem; padding: 1rem">
      <section style="flex: 1; min-width: 0; display: flex; flex-direction: column">
        <h2 style="margin: 0 0 0.5rem; font-size: 0.875rem; font-weight: 600">
          default
        </h2>
        <div style="flex: 1; min-height: 0">
          <!-- copilot runtime : default agent start -->
          <copilot-chat />
          <!-- copilot runtime : default agent end -->
        </div>
      </section>
      <section style="flex: 1; min-width: 0; display: flex; flex-direction: column">
        <h2 style="margin: 0 0 0.5rem; font-size: 0.875rem; font-weight: 600">
          research-agent
        </h2>
        <div style="flex: 1; min-height: 0">
          <!-- copilot runtime : agent by key start -->
          <copilot-chat agentId="research-agent" />
          <!-- copilot runtime : agent by key end -->
        </div>
      </section>
    </div>
  `,
})
export class MultiAgentChatComponent {}
