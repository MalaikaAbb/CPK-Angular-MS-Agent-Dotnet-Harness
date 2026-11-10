import { Component } from '@angular/core';

import { RouteHeader } from '../components/route-header';
import { Callout, DocSample, Panel, SourceCode, TryIt } from '../components/ui';

@Component({
  selector: 'app-ag-ui-page',
  imports: [RouteHeader, Panel, Callout, TryIt, SourceCode, DocSample],
  template: `
    <app-route-header path="/ag-ui" />

    <div class="space-y-6">
      <ui-try-it>
        <p class="mt-1 text-slate-700">
          Open the demo with the browser console open, and send
          <em>Tell me about the James Webb Space Telescope.</em>
        </p>
        <p class="mt-2 text-slate-700">
          <strong>Pass:</strong> the panel on the left shows
          <em>Agent is running…</em> during the run and the message count
          rises; the console logs a stream of <code>Streaming text:</code>
          lines, and the reply is a short bulleted list of facts.
          <strong>Fail:</strong> the count stays at 0 — the store is not bound
          to the agent the chat is driving.
        </p>
      </ui-try-it>

      <ui-panel heading="Accessing your agent with injectAgentStore">
        <ui-source path="src/app/features/ag-ui/agent-status.component.ts" />
      </ui-panel>

      <ui-panel heading="Subscribing to AG-UI events">
        <p class="mb-3 text-sm text-slate-700">
          The guide gives only the class members. They are mounted unchanged
          inside the smallest component that can hold them.
          <code>research_agent</code> has no tools, so
          <code>onToolCallEndEvent</code> does not fire here.
        </p>
        <ui-source path="src/app/features/ag-ui/agent-events.component.ts" />
      </ui-panel>

      <ui-panel heading="Both, beside a chat on the same agent">
        <ui-source path="src/app/features/ag-ui/ag-ui-chat.component.ts" />
      </ui-panel>

      <ui-panel heading="The proxy pattern">
        <p class="mb-3 text-sm text-slate-700">
          Quoted from the guide; illustrative rather than a separate file. The
          components above are this pattern running: the store resolves a proxy
          for <code>research-agent</code> from the runtime's
          <code>/info</code>.
        </p>
        <ui-doc-sample caption="What your component sees" [code]="proxySample" />
        <div class="mt-3">
          <ui-doc-sample
            caption="What happens underneath"
            [code]="underneathSample"
          />
        </div>
      </ui-panel>

      <ui-callout title="research-agent is self-defined">
        The guide asks for <code>research-agent</code> but never defines it.
        <code>backend/ResearchAgent.cs</code> is this repo's own: a plain
        harness agent (<code>AsHarnessAgent</code>) built like the default one
        in <code>Program.cs</code>, reusing the showcase's research sub-agent
        prompt.
        It is mounted at <code>/research</code> and registered in
        <code>server.ts</code> under the key <code>research-agent</code>.
      </ui-callout>

      <ui-panel heading="backend/ResearchAgent.cs">
        <ui-source path="../backend/ResearchAgent.cs" />
      </ui-panel>
    </div>
  `,
})
export default class AgUiPage {
  protected readonly proxySample = `const store = injectAgentStore("default");
const agent = store().agent;
store().messages();
store().state();
agent.subscribe({ /* … */ });`;
  protected readonly underneathSample = `// injectAgentStore() → registry checks /info → resolves a proxy agent
// core.runAgent({ agent }) → runtime POST → agent execution → SSE events`;
}
