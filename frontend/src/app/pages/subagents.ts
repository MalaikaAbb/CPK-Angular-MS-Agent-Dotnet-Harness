import { Component } from '@angular/core';

import { RouteHeader } from '../components/route-header';
import { Callout, Panel, SourceCode, TryIt } from '../components/ui';

@Component({
  selector: 'app-subagents-page',
  imports: [RouteHeader, Panel, Callout, TryIt, SourceCode],
  template: `
    <app-route-header path="/subagents" />

    <div class="space-y-6">
      <ui-try-it>
        <p class="mt-1 text-slate-700">
          Open the demo and send
          <em>Research, write, and critique a short paragraph on solar
          panels.</em>
        </p>
        <p class="mt-2 text-slate-700">
          <strong>Pass:</strong> a card appears in the transcript as each
          sub-agent runs, and the delegation log on the left grows to three
          entries — research, writing, critique — each carrying that sub-agent's
          output. <strong>Fail:</strong> the cards render but the log stays
          empty — the supervisor's <code>DataContent</code> state snapshots are
          not reaching the <code>delegations</code> state slot.
        </p>
      </ui-try-it>

      <ui-panel heading="Backend — sub-agents exposed as tools">
        <p class="mb-3 text-sm text-slate-700">
          The guide's "Setting up sub-agents" and "Exposing sub-agents as
          tools" code is one file, <code>agent/SubagentsAgent.cs</code>, shown
          twice and cut off both times mid-<code>CreateAgent()</code>. Here it is
          whole, copied unchanged from the showcase. Each delegation tool
          appends a <code>running</code> entry to the
          <code>SubagentsStore</code>, runs a single-shot chat call with the
          sub-agent's prompt, and marks the entry <code>completed</code> or
          <code>failed</code>; <code>SubagentsAgent</code> yields the store as a
          <code>DataContent("application/json")</code> update, which the AG-UI
          host emits as a state snapshot.
        </p>
        <ui-source path="../backend/SubagentsAgent.cs" />
      </ui-panel>

      <ui-panel heading="Mounting the supervisor">
        <p class="mb-3 text-sm text-slate-700">
          <code>backend/Program.cs</code> mounts it with
          <code>app.MapAGUI("/subagents", ...)</code>, and
          <code>server.ts</code> registers that URL under the runtime key
          <code>subagents</code> — the same key and path the showcase uses.
        </p>
        <ui-source path="../backend/Program.cs" />
      </ui-panel>

      <ui-panel heading="Rendering a live delegation log">
        <ui-source
          path="src/app/features/subagents/subagents-chat.component.ts"
        />
      </ui-panel>

      <ui-panel heading="Reading the delegations slot">
        <ui-source path="src/app/features/subagents/subagent-model.ts" />
      </ui-panel>

      <ui-panel heading="One renderer per sub-agent tool">
        <ui-source
          path="src/app/features/subagents/subagent-renderer-config.ts"
        />
      </ui-panel>

      <ui-panel heading="Transcript card and delegation log">
        <ui-source path="src/app/features/subagents/subagent-cards.ts" />
      </ui-panel>

      <ui-callout title="As published — the guide's C# is not self-contained">
        Kept verbatim, not fixed. Both snippets stop inside
        <code>CreateAgent()</code>, before the supervisor agent is built or
        returned. <code>CreateAgent()</code> calls
        <code>.AsLunaChatClient()</code>, which the page never defines, and the
        factory's constructor takes an <code>OpenAIClient</code> without saying
        where one comes from. A comment in the store cites "the same root cause
        as D5ParityAgents SnapshotStore", a showcase file the page never shows.
        Both the supervisor and every sub-agent are hard-wired to the model
        <code>gpt-6-luna</code>.
      </ui-callout>

      <ui-callout title="Not in the guide — taken from the showcase source">
        The rest of <code>SubagentsAgentFactory</code>
        (<code>SupervisorPrompt</code>, the
        <code>chatClient.AsHarnessAgent(...)</code> supervisor it wraps in
        <code>SubagentsAgent</code>, <code>DelegateAsync</code>) is the showcase
        file the guide quotes,
        <code>showcase/integrations/ms-agent-harness-dotnet/agent/SubagentsAgent.cs</code>,
        copied unchanged, as is <code>_shared/dotnet/</code>'s
        <code>LunaChatClientExtensions.cs</code> (in
        <code>backend/shared/</code>). The <code>OpenAIClient</code> is built in
        <code>Program.cs</code> from <code>OPENAI_API_KEY</code> and an
        optional <code>OPENAI_BASE_URL</code>; the showcase's
        <code>ApiKeyResolver.cs</code> is test plumbing and is left out
        (<code>CLAUDE.md</code>, "Showcase-only code"). The package pins come from the
        showcase's <code>BeautifulChatAgent.csproj</code>; the guide's
        <code>AgentSession</code> / <code>AgentResponse</code> /
        <code>RunCoreAsync</code> overrides compile against
        <code>Microsoft.Agents.AI.Hosting.AGUI.AspNetCore</code> and
        <code>Microsoft.Agents.AI.Harness</code>
        <code>1.6.1-preview.260514.1</code>. On the frontend the guide does not
        show <code>readDelegations</code>, <code>subAgentRendererConfig</code>,
        or either card component; they are the sub-agent half of the Angular
        Showcase's <code>features/agent-state/</code>, unchanged, with the
        unrelated planner card left out.
      </ui-callout>
    </div>
  `,
})
export default class SubagentsPage {}
