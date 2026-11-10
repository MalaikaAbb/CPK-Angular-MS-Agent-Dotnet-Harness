import { Component } from '@angular/core';

import { RouteHeader } from '../components/route-header';
import { Callout, Panel, SourceCode, TryIt } from '../components/ui';

@Component({
  selector: 'app-quickstart-page',
  imports: [RouteHeader, Panel, Callout, TryIt, SourceCode],
  template: `
    <app-route-header path="/quickstart" />

    <div class="space-y-6">
      <ui-try-it>
        <p class="mt-1 text-slate-700">
          Open the demo and send <em>Can you tell me a joke?</em>
        </p>
        <p class="mt-2 text-slate-700">
          <strong>Pass:</strong> tokens stream in one at a time and render as
          markdown.
          <strong>Fail:</strong> nothing streams — check the connection panel on
          the Introduction route; one of the two backends is down.
        </p>
      </ui-try-it>

      <ui-panel heading="1 · The runtime, with an HttpAgent">
        <p class="mb-3 text-sm text-slate-700">
          The Angular quickstart's backend step defers to the selected
          integration: "Configure Copilot Runtime to register this backend as
          the <code>default</code> agent at <code>/api/copilotkit</code>." So
          the Node server below is the quickstart's, with
          <code>BuiltInAgent</code> replaced by the generic
          <code>HttpAgent</code> from <code>&#64;ag-ui/client</code> — the
          binding for any AG-UI-over-HTTP server, which is exactly what
          <code>app.MapAGUI(...)</code> mounts in the Microsoft Agent Framework
          (.NET) Agent Harness backend.
        </p>
        <ui-source path="server.ts" />
      </ui-panel>

      <ui-panel heading="1b · The agent backend (.NET)">
        <p class="mb-3 text-sm text-slate-700">
          The guide's backend step is empty for this framework — the published
          page carries <code>&lt;!-- setup skipped: agent-setup is not bundled
          for ms-agent-harness-dotnet --&gt;</code> where the setup should be, and
          defers to the runtime guide, which is TypeScript only. This host is
          therefore self-defined, built from the showcase's
          <code>Program.cs</code> pieces: <code>AddAGUI()</code>,
          <code>MapAGUI("/", agent)</code>, and an agent built with
          <code>chatClient.AsHarnessAgent(...)</code>.
        </p>
        <ui-source path="../backend/Program.cs" />
      </ui-panel>

      <ui-panel heading="2 · Import the styles">
        <p class="mb-3 text-sm text-slate-700">
          The package stylesheet is self-contained — the chat renders without
          any other CSS. It is the first import in the global stylesheet, ahead
          of this harness's own chrome.
        </p>
        <ui-source path="src/styles.css" note="first ~10 lines are the doc step" />
      </ui-panel>

      <ui-panel heading="3 · Connect to Copilot Runtime">
        <p class="mb-3 text-sm text-slate-700">
          One provider at the application root. The extra
          <code>a2ui</code> and <code>openGenerativeUI</code> options belong to
          later guides; the quickstart needs only <code>runtimeUrl</code>.
        </p>
        <ui-source path="src/app/app.config.ts" />
      </ui-panel>

      <ui-panel heading="4 · Add the chat UI">
        <ui-source path="src/app/features/quickstart/quickstart-chat.ts" />
      </ui-panel>

      <ui-callout title="Verify the runtime before blaming the frontend">
        The quickstart's troubleshooting box prescribes one check:
        <code>http://localhost:8250/api/copilotkit/info</code> should report the
        registered agents. The Introduction route probes exactly that.
      </ui-callout>

      <ui-panel heading="5 · Open Inspector and confirm setup">
        <p class="mb-3 text-sm text-slate-700">
          The final step no longer routes Angular readers through a manual
          mount. It reads, in full:
          <em>"On localhost, click the Inspector button in the corner of the
          app."</em> Nothing here mounts the Inspector — the step is testing
          that <code>&#64;copilotkit/angular</code> mounts it for you, which
          landed in <code>0.4.0</code>.
        </p>
        <p class="mb-3 text-sm text-slate-700">
          The button belongs to the running app, not to a notes page, so it
          appears on <code>/quickstart/demo</code> rather than on this route.
          The three checks the step then prescribes:
        </p>
        <ol
          class="ml-5 list-decimal space-y-1 text-sm text-slate-700 marker:text-slate-400"
        >
          <li>
            Open <strong>Agents</strong>, then <strong>Agent</strong>. Your
            agent is listed.
          </li>
          <li>
            Send a chat message. Open <strong>Agents</strong>, then
            <strong>AG-UI Events</strong>. Events are moving.
          </li>
          <li>
            Open <strong>Rich Threads</strong>. The list is unlocked (Intelligence is
            on), or locked with Enable Intelligence (Intelligence is off). This
            repo runs no license key, so <strong>locked is the pass</strong>
            here — see the Threads route.
          </li>
        </ol>
      </ui-panel>

    </div>
  `,
})
export default class QuickstartPage {
  protected readonly builtInAgentSample = `const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: "openai:gpt-5.4-mini",
      prompt: "You are a helpful assistant for an Angular app.",
    }),
  },
});`;
}
