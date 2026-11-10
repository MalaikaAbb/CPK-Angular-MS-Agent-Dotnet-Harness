/**
 * Mounts the guide's Angular frontend tool beside a chat, so the same
 * `searchOrders` handler can be called two ways: by the CopilotKit agent
 * through the chat, and by a WebMCP-aware browser agent through
 * `document.modelContext`. The panel only reports whether the page has
 * `document.modelContext` at all — without it CopilotKit registers nothing,
 * by design.
 * https://docs.copilotkit.ai/angular/ms-agent-harness-dotnet/webmcp
 */
import { Component, afterNextRender, signal } from '@angular/core';
import { CopilotChat } from '@copilotkit/angular';

import { OrderSearchComponent } from './order-search.component';

@Component({
  selector: 'app-webmcp-chat',
  imports: [CopilotChat, OrderSearchComponent],
  template: `
    <app-order-search />
    <div style="display: flex; height: 100%; gap: 1rem">
      <div style="width: 20rem; overflow-y: auto; padding: 1rem">
        <p>
          <code>document.modelContext</code>:
          <strong>{{ available() ? 'available' : 'not available' }}</strong>
        </p>
      </div>
      <div style="flex: 1; min-width: 0">
        <copilot-chat />
      </div>
    </div>
  `,
})
export class WebmcpChatComponent {
  protected readonly available = signal(false);

  constructor() {
    afterNextRender(() =>
      this.available.set('modelContext' in document),
    );
  }
}
