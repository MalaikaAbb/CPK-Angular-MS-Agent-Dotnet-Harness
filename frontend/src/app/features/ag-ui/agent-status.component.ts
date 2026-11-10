// ag-ui : agent status component start
/**
 * "Accessing your agent with injectAgentStore", verbatim.
 * https://docs.copilotkit.ai/angular/ms-agent-harness-dotnet/ag-ui
 *
 * `research-agent` is registered in server.ts and backed by
 * backend/ResearchAgent.cs, so the guide's id resolves.
 */
import { Component, computed } from "@angular/core";
import { injectAgentStore } from "@copilotkit/angular";

@Component({
  selector: "app-agent-status",
  template: `
    <p>{{ messageCount() }} messages</p>
    @if (store().isRunning()) {
      <p>Agent is running…</p>
    }
  `,
})
export class AgentStatusComponent {
  readonly store = injectAgentStore("research-agent");
  readonly messageCount = computed(() => this.store().messages().length);
}
// ag-ui : agent status component end
