/**
 * "Rendering a live delegation log", from
 * https://docs.copilotkit.ai/angular/ms-agent-harness-dotnet/multi-agent/subagents
 *
 * The class members between the region markers are the guide's snippet,
 * unchanged. The two fields it reads but does not show are resolved the way
 * the Angular Showcase's agent-state-feature.component.ts resolves them for
 * this demo: `feature` is "subagents", and `agentId` is the runtime key the
 * supervisor is registered under in server.ts. Template and layout come from
 * that same showcase component, with its showcase chat host replaced by a
 * plain copilot-chat on the same agent.
 */
import { Component, computed } from "@angular/core";
import {
  CopilotChat,
  injectAgentStore,
  registerRenderToolCall,
} from "@copilotkit/angular";

import { DelegationLogComponent } from "./subagent-cards";
import type { SubAgentName } from "./subagent-model";
import { readDelegations } from "./subagent-model";
import { subAgentRendererConfig } from "./subagent-renderer-config";

@Component({
  selector: "app-subagents-chat",
  imports: [CopilotChat, DelegationLogComponent],
  template: `
    <main class="agent-state-page subagents">
      <aside aria-label="Live supervisor delegation state">
        <showcase-delegation-log [delegations]="delegations()" />
      </aside>
      <section class="chat-surface" aria-label="CopilotKit assistant">
        <copilot-chat [agentId]="agentId" />
      </section>
    </main>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }
    .agent-state-page {
      height: 100%;
      min-height: 0;
      background: #eef3f7;
    }
    .chat-surface {
      min-width: 0;
      height: 100%;
      background: #fff;
    }
    .subagents {
      display: grid;
      grid-template-columns: minmax(18rem, 0.85fr) minmax(0, 1.35fr);
      gap: 1rem;
      padding: 1rem;
    }
    .subagents aside {
      min-width: 0;
      overflow: auto;
    }
    .subagents .chat-surface {
      overflow: hidden;
      border: 1px solid #d8e0ea;
      border-radius: 1rem;
    }
    @media (max-width: 52rem) {
      .subagents {
        grid-template-columns: 1fr;
        grid-template-rows: auto minmax(30rem, 55vh);
        overflow: auto;
      }
    }
  `,
})
export class SubagentsChatComponent {
  protected readonly feature = "subagents";
  protected readonly agentId = "subagents";
  // subagents : rendering a live delegation log start
  private readonly agentStore = injectAgentStore(this.agentId);
  protected readonly delegations = computed(() =>
    readDelegations(this.agentStore().state()),
  );

  constructor() {
    if (this.feature === "subagents") {
      this.registerSubAgent("research_agent");
      this.registerSubAgent("writing_agent");
      this.registerSubAgent("critique_agent");
    }
  }

  private registerSubAgent(name: SubAgentName): void {
    registerRenderToolCall(subAgentRendererConfig(name));
  }
  // subagents : rendering a live delegation log end
}
