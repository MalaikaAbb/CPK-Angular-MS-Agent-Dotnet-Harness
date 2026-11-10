import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BackendHealth } from '../components/backend-health';
import { DocDriftPanel } from '../components/doc-drift-panel';
import { RouteHeader } from '../components/route-header';
import { Callout, Panel, SourceCode } from '../components/ui';
import { NAV } from '../lib/nav-config';

@Component({
  selector: 'app-introduction-page',
  imports: [
    RouterLink,
    RouteHeader,
    BackendHealth,
    DocDriftPanel,
    Panel,
    Callout,
    SourceCode,
  ],
  template: `
    <app-route-header path="/" />

    <div class="space-y-6">
      <app-backend-health />

      <doc-drift-panel />

      <ui-panel heading="What this is">
        <p class="text-sm text-slate-700">
          A navigable test harness for the Angular + Microsoft Agent Harness
          (.NET) section of the
          CopilotKit docs. Every guide listed in the sidebar is a route, and
          each route runs the thing its doc page teaches rather than restating
          it.
        </p>
        <p class="mt-3 text-sm text-slate-700">
          Routes with a live feature are split in two: the route itself holds
          the notes, pass/fail criteria, and the exact source that runs, and
          <code class="rounded bg-slate-100 px-1">&lt;route&gt;/demo</code>
          holds just the running feature with no page chrome.
        </p>
      </ui-panel>

      <ui-panel heading="Architecture">
        <pre
          class="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100"
        ><code>Browser (Angular 22, zoneless)
  &#124;  &#64;copilotkit/angular — provideCopilotKit, copilot-chat, signal APIs
  &#124;  POST http://localhost:8250/api/copilotkit
  v
Copilot Runtime  ·  localhost:8250        &#8592; Node, frontend/server.ts
  &#124;  agents: &#123; default, support &#125; &#8594; new HttpAgent(&#123; url &#125;)
  &#124;  POST http://localhost:8251/        &#8592; AG-UI over SSE
  v
Microsoft Agent Framework  ·  localhost:8251   &#8592; .NET / ASP.NET Core
  &#124;  app.MapAGUI("/", agent) · "/subagents" · "/research"
  &#124;  agents built with chatClient.AsHarnessAgent(...)
  v
OpenAI  (OPENAI_CHAT_MODEL_ID, default gpt-5.4-mini;
         the sub-agents supervisor hard-codes gpt-6-luna)</code></pre>

        <p class="mt-3 text-sm text-slate-700">
          Three processes, not two. Unlike the React quickstart — where the
          runtime lives inside the Next app — Angular has no server route, so
          the runtime is its own Node process. The model key only ever reaches
          the Agent Framework process.
        </p>
      </ui-panel>

      <ui-callout title="Both backends must be running">
        The chat will not stream if either process is down. Start the Microsoft
        Agent Framework agent with <code>dotnet run</code> from
        <code>backend/</code>, and the
        runtime with <code>npm run runtime</code> from <code>frontend/</code>.
      </ui-callout>

      <ui-panel heading="Routes">
        <ul class="space-y-4 text-sm">
          @for (group of nav; track group.title) {
            <li>
              <p class="font-semibold text-slate-900">{{ group.title }}</p>
              <ul class="mt-1 space-y-1">
                @for (route of group.routes; track route.path) {
                  <li>
                    <a
                      [routerLink]="route.path"
                      class="text-blue-700 underline decoration-dotted"
                      >{{ route.title }}</a
                    >
                    <span class="text-slate-600"> — {{ route.summary }}</span>
                  </li>
                }
              </ul>
            </li>
          }
        </ul>
      </ui-panel>

      <ui-panel heading="Inspector">
        <p class="text-sm text-slate-700">
          <code>/angular/ms-agent-harness-dotnet</code> and
          <code>/angular/ms-agent-harness-dotnet/quickstart</code> are the same page, so
          the "Open Inspector and confirm setup" step lands on this route too.
          As of <code>&#64;copilotkit/angular&#64;0.4.0</code> the package
          mounts <code>cpk-web-inspector</code> itself, but only inside a
          running CopilotKit surface and only in dev mode — this notes route
          has neither, so no button appears here.
          <a
            routerLink="/quickstart"
            class="text-blue-700 underline decoration-dotted"
            >The Quickstart route</a
          >
          carries the step and its three checks.
        </p>
      </ui-panel>

      <ui-panel heading="The runtime binding">
        <p class="mb-3 text-sm text-slate-700">
          This is the one file that ties CopilotKit to the Microsoft Agent
          Framework backend. It is read off disk
          at build time, so what you see is what runs.
        </p>
        <ui-source path="server.ts" />
      </ui-panel>
    </div>
  `,
})
export default class IntroductionPage {
  protected readonly nav = NAV;
}
