/**
 * Runs the guide's "WebMCP only, with no agent" module. Importing ./webmcp
 * creates its CopilotKitCore; no chat, Runtime or agent is involved. The panel
 * lists the tool names that core keeps registered on `document.modelContext`.
 * https://docs.copilotkit.ai/angular/ms-agent-harness-dotnet/webmcp
 */
import { Component, afterNextRender, signal } from '@angular/core';

@Component({
  selector: 'app-webmcp-core-demo',
  template: `
    <div style="padding: 1rem">
      <p>
        <code>document.modelContext</code>:
        <strong>{{ available() ? 'available' : 'not available' }}</strong>
      </p>
      <p>
        CopilotKitCore created with tools:
        <code>{{ tools().join(', ') || '—' }}</code>
      </p>
    </div>
  `,
})
export class WebmcpCoreDemoComponent {
  protected readonly available = signal(false);
  protected readonly tools = signal<string[]>([]);

  constructor() {
    afterNextRender(async () => {
      this.available.set('modelContext' in document);
      const { copilotkit } = await import('./webmcp');
      this.tools.set(copilotkit.tools.map((tool) => tool.name));
    });
  }
}
