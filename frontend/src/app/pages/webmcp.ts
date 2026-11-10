import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RouteHeader } from '../components/route-header';
import { Callout, Panel, SourceCode, TryIt } from '../components/ui';

@Component({
  selector: 'app-webmcp-page',
  imports: [RouterLink, RouteHeader, Panel, Callout, TryIt, SourceCode],
  template: `
    <app-route-header path="/webmcp" />

    <div class="space-y-6">
      <ui-try-it>
        <p class="mt-1 text-slate-700">
          <strong>Agent path, any browser:</strong> open the demo and send
          <em>Which of my orders are still open?</em>
        </p>
        <p class="mt-2 text-slate-700">
          <strong>Pass:</strong> the agent calls <code>searchOrders</code> with
          <code>status: "open"</code> and names the keyboard and the desk
          lamp. <strong>Fail:</strong> it guesses — the frontend tool is not
          registered.
        </p>
        <p class="mt-3 text-slate-700">
          <strong>Browser-agent path, Chrome 149+ only:</strong> enable the
          WebMCP origin trial or
          <code>chrome://flags/#enable-webmcp-testing</code>, open the demo, and
          use Chrome's Model Context Tool Inspector to find and call
          <code>searchOrders</code>.
        </p>
        <p class="mt-2 text-slate-700">
          <strong>Pass:</strong> the panel reads
          <code>document.modelContext: available</code>, and the inspector lists
          <code>searchOrders</code> with <code>readOnlyHint</code> and returns
          the matching orders. Elsewhere the panel reads
          <em>not available</em> and CopilotKit registers nothing — expected.
        </p>
      </ui-try-it>

      <ui-panel heading="Angular frontend tool">
        <ui-source path="src/app/features/webmcp/order-search.component.ts" />
      </ui-panel>

      <ui-panel heading="Mounted beside a chat">
        <ui-source path="src/app/features/webmcp/webmcp-chat.component.ts" />
      </ui-panel>

      <ui-panel heading="WebMCP only, with no agent">
        <p class="mb-3 text-sm text-slate-700">
          No Runtime and no agent: the tool is registered straight on a
          <code>CopilotKitCore</code>. It runs on its own route,
          <a routerLink="/webmcp/core-demo" class="underline">/webmcp/core-demo</a>,
          and the instance stays alive for the rest of the page's life.
        </p>
        <ui-source path="src/app/features/webmcp/webmcp.ts" />
        <div class="mt-3">
          <ui-source
            path="src/app/features/webmcp/webmcp-core-demo.component.ts"
          />
        </div>
      </ui-panel>

      <ui-callout title="searchOrders is self-defined">
        Both of the guide's examples call <code>searchOrders(status)</code>
        without defining it. <code>search-orders.ts</code> is this repo's own
        stand-in over four fixed orders — not from the docs or the showcase,
        which has no Angular WebMCP demo.
      </ui-callout>

      <ui-panel heading="search-orders.ts (self-defined)">
        <ui-source path="src/app/features/webmcp/search-orders.ts" />
      </ui-panel>

      <ui-callout title="Agent scope does not scope WebMCP">
        WebMCP tools are page-level. If you load both demos in one page
        session, two registries publish <code>searchOrders</code>; CopilotKit
        keeps the first and logs a warning for the duplicate.
      </ui-callout>
    </div>
  `,
})
export default class WebmcpPage {}
