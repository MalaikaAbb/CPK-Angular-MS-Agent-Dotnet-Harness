/**
 * Mounts the AG-UI guide's two `research-agent` snippets beside a chat bound
 * to the same agent, so a run has something to count and log.
 * https://docs.copilotkit.ai/angular/ms-agent-harness-dotnet/ag-ui
 */
import { Component } from '@angular/core';
import { CopilotChat } from '@copilotkit/angular';

import { AgentEventsComponent } from './agent-events.component';
import { AgentStatusComponent } from './agent-status.component';

@Component({
  selector: 'app-ag-ui-chat',
  imports: [CopilotChat, AgentStatusComponent, AgentEventsComponent],
  template: `
    <div style="display: flex; height: 100%; gap: 1rem">
      <div style="width: 20rem; overflow-y: auto; padding: 1rem">
        <app-agent-status />
        <app-agent-events />
      </div>
      <div style="flex: 1; min-width: 0">
        <copilot-chat agentId="research-agent" />
      </div>
    </div>
  `,
})
export class AgUiChatComponent {}
