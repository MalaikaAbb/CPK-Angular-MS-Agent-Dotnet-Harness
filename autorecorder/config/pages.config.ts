/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS FILE — 3 of 3
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * One entry per doc page, in the order the doc nav lists them.
 *
 * Entries are deliberately short. `docUrl`, `demoUrl` and the output filename
 * are derived from `project.config.ts` plus the fields below, so no entry can
 * point at the wrong framework's docs and filenames stay in nav order without
 * anyone numbering them by hand.
 *
 * Adapting means: delete the pages this framework does not document, add the
 * ones it does, and fix the line ranges. `npm run doctor` then tells you which
 * ranges no longer point at real code.
 *
 * ── Scope, for this repo ───────────────────────────────────────────────────
 * `route` + `demoSuffix` is the only demo URL a page can have, and the doctor
 * errors on any that is not 200. This app's nav lists 12 doc routes; the
 * Introduction landing page (`/`) is the one without a `/demo` of its own —
 * `demoPath()` in nav-config.ts returns undefined for it — so it is deliberately
 * absent below rather than registered and broken. `/status` is app furniture
 * rather than a doc page, and is likewise absent.
 *
 * Everything here mirrors `frontend/src/app/lib/nav-config.ts`, the app's single
 * source of truth for route -> doc-page mapping. `docPath` is that file's
 * `docPath` minus its leading `/angular/ms-agent-harness-dotnet`. Four routes (threads,
 * memory, attachments, headless) repeat one `docPath` because the Angular docs
 * cover all four topics on a single page — that is the doc's shape, not a
 * copy/paste slip.
 *
 * ── The line ranges ────────────────────────────────────────────────────────
 * `startLine`/`endLine` are what the simulated IDE highlights. They are
 * hardcoded, so they drift the moment someone edits a demo component. Doctor
 * guards ranges in files carrying `[!code highlight]` or `#region` markers.
 * This frontend uses neither: it brackets each documented snippet with
 * `// <topic> : <snippet name> start|end` line comments, which
 * frontend/scripts/generate-sources.ts reads. Every range below was set from
 * those brackets by hand, so `npm run doctor` proves a range is in-bounds, not
 * that it still frames the snippet the page is about — re-read them after
 * editing a feature component. Teaching the doctor this repo's marker syntax
 * would restore the guard, but that is a `core/` change and therefore a finding
 * to report, not something to do here.
 */

import { type PageDefinition, definePages } from '../core/types';

const RESERVED_PREFIX = 'reserved:';

/**
 * A slot in the Angular guide list that this repo has no demo for.
 *
 * The clip index is `definePages`' array position, so without these the
 * numbering closes up over a missing page: Shared State recorded as `06` here
 * and `07` in Agno-angular and Mastra-angular, which document the same guides
 * in the same order. The clips land in one folder, so two files with the same
 * number showing different guides is exactly the confusion the numbering is
 * there to prevent.
 *
 * Reserving the slot keeps the number attached to the guide rather than to
 * whatever this repo happens to record. A reserved entry exists only to occupy
 * an index — it is filtered out below, before `definePages`' result is
 * exported, so no doctor check, CLI flag or recording ever sees one. Its fields are placeholders for that reason.
 *
 * When the demo does land, replace the `reserve(...)` call with the real entry
 * in place and the number it has always been reserved for is the one it gets.
 */
const reserve = (guide: string): PageDefinition => ({
  id: `${RESERVED_PREFIX}${guide}`,
  name: `(reserved) ${guide}`,
  videoName: 'Reserved',
  docPath: '',
  route: '',
  ideFile: '',
  startLine: 1,
  endLine: 1,
  prompt: '',
});

export const PAGES = definePages([
  {
    id: 'quickstart',
    name: 'Quickstart',
    videoName: 'Quickstart',
    docPath: 'quickstart',
    route: 'quickstart',
    // Dependency manifest first, always: a demo means nothing without the
    // versions it ran against, and @copilotkit/angular is a 0.x package that
    // moves faster than its docs do. The range is the whole `dependencies`
    // block, so @copilotkit/angular, @copilotkit/runtime and @ag-ui/client are
    // legible in one frame.
    // Leads with the versions, not the manifest. package.json declares
    // RANGES, so this clip used to show a floor while the run it
    // documented had installed something newer. VERSIONS.md names what
    // resolved; it is generated locally by autorecorder/scripts/write-versions.mjs
    // (run by `npm run doctor`) and not committed.
    // package.json stays as the first tab: the range is still what a
    // reader would write in their own project.
    ideFile: 'frontend/VERSIONS.md',
    startLine: 6,
    endLine: 20,
    // Then the path itself, in the order a request travels it: the chat
    // component, the Node process hosting the runtime (Angular has no server
    // route to host it in), and the Agent Framework endpoint it proxies to.
    extraTabs: [
      {
        filePath: 'frontend/package.json',
        startLine: 19,
        endLine: 36,
      },
      {
        filePath: 'frontend/src/app/features/quickstart/quickstart-chat.ts',
        startLine: 1,
        endLine: 15,
      },
      // `quickstart : copilot runtime start|end` — the HttpAgent bindings.
      { filePath: 'frontend/server.ts', startLine: 48, endLine: 70 },
      // `quickstart : default agent start` through
      // `quickstart : expose agent framework endpoint end` — the
      // AsHarnessAgent agent and the MapAGUI call that mounts it.
      { filePath: 'backend/Program.cs', startLine: 75, endLine: 100 },
    ],
    prompt: 'Hey, are you connected? Tell me a quick fun fact about kites.',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'chat-ui',
    name: 'Guides - Chat UI and customization',
    videoName: 'ChatUi',
    docPath: 'guides/chat-ui',
    route: 'chat-ui',
    ideFile: 'frontend/src/app/features/chat-ui/chat-ui-demo.component.ts',
    startLine: 28,
    endLine: 56,
    // The replaced assistant message is the guide's actual lesson; the wrapper
    // above only chooses which surface is mounted.
    // `chat ui : replace an assistant message start|end`.
    extraTabs: [
      {
        filePath:
          'frontend/src/app/features/chat-ui/custom-assistant-message.component.ts',
        startLine: 15,
        endLine: 27,
      },
    ],
    // Four surfaces, driven in order by the handler: inline, custom assistant
    // message, popup, sidebar. Only the first two take a prompt.
    prompt: 'In two sentences, what does CopilotKit do?',
    prompts: [
      'In two sentences, what does CopilotKit do?',
      'Nice layout. What is different about how you are rendered here?',
    ],
    waitAfterPromptMs: 4000,
  },
  {
    id: 'frontend-tools-generative-ui',
    name: 'Guides - Frontend tools and generative UI',
    videoName: 'FrontendToolsGenerativeUi',
    docPath: 'guides/frontend-tools-generative-ui',
    route: 'frontend-tools-generative-ui',
    // The constructor is the lesson: `registerRenderToolCall` for the
    // server-side tool, `registerFrontendTool` for the browser-side one, and
    // `registerComponent` — the guide's new first section — now mounted and
    // running, since the frontend moved to @copilotkit/angular 0.5.1.
    // Class declaration through the closing brace: lines 58-87 of an 88-line
    // file, re-counted after the third registration replaced the commented one.
    ideFile: 'frontend/src/app/features/tools/tools-chat.component.ts',
    startLine: 58,
    endLine: 87,
    extraTabs: [
      {
        filePath: 'frontend/src/app/features/tools/weather-card.component.ts',
        startLine: 12,
        endLine: 29,
      },
      // The guide's "Let the agent display one of your components" renderer,
      // verbatim. Its `@if (call.status === "in-progress")` guard is the second
      // finding on camera: the real status is "executing", so the guard never
      // fires and the @else branch paints an empty card until the args land.
      // `@Component` through the class brace, matching the weather-card tab.
      {
        filePath: 'frontend/src/app/features/tools/incident-card.component.ts',
        startLine: 12,
        endLine: 29,
      },
      // The other half of the pair: getWeather runs in the Agent Framework
      // process and the browser only renders the call.
      // `frontend tools : server tool getWeather start|end`.
      { filePath: 'backend/Program.cs', startLine: 66, endLine: 73 },
    ],
    // Two turns: a server-side tool the browser only renders, then a frontend
    // tool whose result is the page itself repainting.
    // Three turns: a server-side tool the browser only renders, a frontend tool
    // whose result is the page itself repainting, and the new display-only
    // registration — which draws the right card and then makes the agent
    // apologise for it.
    prompt: 'Check the weather in Tokyo for me.',
    prompts: [
      'Check the weather in Tokyo for me.',
      'Could you change the background to violet?',
      'Pull up incident INC-4711 for me. It is a sev1.',
    ],
    waitAfterPromptMs: 4000,
  },

  // The A2UI guide has no demo route in this frontend yet.
  reserve('a2ui'),

  {
    id: 'voice-multimodal',
    name: 'Guides - Voice and multimodal input',
    videoName: 'VoiceMultimodal',
    docPath: 'guides/voice-multimodal',
    route: 'voice-multimodal',
    // `voice & multimodal : configure attachments start|end` plus the component
    // that binds it — the microphone control itself needs no option.
    ideFile: 'frontend/src/app/features/media/voice-chat.component.ts',
    startLine: 12,
    endLine: 31,
    // The guide's walkthrough is attach-then-microphone, so the clip does both.
    // The prompt asks for values that exist only inside the attached chart, so
    // the reply is evidence the file reached the model rather than something
    // answerable from the system prompt. The microphone then records, and this
    // runtime configures no transcription service, so transcription fails by
    // design — the handler shows that and says so.
    prompt: 'Have a look at the chart I attached. What is it titled, and what does Q4 come to?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'human-in-the-loop',
    name: 'Guides - Human-in-the-loop and interrupts',
    videoName: 'HumanInTheLoop',
    docPath: 'guides/human-in-the-loop',
    route: 'human-in-the-loop',
    // The registration is the lesson; the card is what the viewer clicks.
    ideFile: 'frontend/src/app/features/hitl/approval-tools.service.ts',
    startLine: 15,
    endLine: 30,
    extraTabs: [
      {
        filePath: 'frontend/src/app/features/hitl/approval-card.component.ts',
        startLine: 18,
        endLine: 41,
      },
    ],
    prompt: 'Please delete my account. Check with me before you actually do it.',
    // When the agent asks in prose instead of calling requestApproval, the take
    // answers it -- up to twice -- so the clip shows where the conversation goes
    // next. Each unanswered turn is named in the verdict (see hitl.action.ts).
    prompts: [
      'Please delete my account. Check with me before you actually do it.',
      'Yes, delete my account.',
      'Yes, go ahead.',
    ],
    waitAfterPromptMs: 4000,
  },
  {
    id: 'shared-state',
    name: 'Guides - Shared state and agent context',
    videoName: 'SharedState',
    docPath: 'guides/shared-state',
    route: 'shared-state',
    ideFile: 'frontend/src/app/features/shared-state/workspace.component.ts',
    startLine: 21,
    endLine: 50,
    extraTabs: [
      {
        filePath:
          'frontend/src/app/features/shared-state/account-context.component.ts',
        startLine: 11,
        endLine: 33,
      },
    ],
    prompt: 'What is the priority set to right now?',
    prompts: [
      'What is the priority set to right now?',
      'And now? What is the priority?',
      'Which timezone am I on?',
    ],
    waitAfterPromptMs: 4000,
  },
  {
    id: 'threads',
    name: 'Threads',
    videoName: 'Threads',
    docPath: 'guides/threads-memory-attachments-headless',
    route: 'threads',
    ideFile: 'frontend/src/app/features/threads/thread-list.component.ts',
    startLine: 10,
    endLine: 44,
    extraTabs: [
      // The drop-in half of the guide: CopilotThreadsDrawer beside a chat,
      // under one provideCopilotChatConfiguration.
      {
        filePath: 'frontend/src/app/features/threads/conversations.component.ts',
        startLine: 8,
        endLine: 25,
      },
      {
        filePath: 'frontend/src/app/features/threads/threads-demo.component.ts',
        startLine: 24,
        endLine: 47,
      },
    ],
    // Both surfaces work: frontend/server.ts passes `intelligence`, so the
    // hand-built list and the drawer resolve real threads. The guide never
    // says that is required; that finding is reported, not typed on screen.
    prompt: 'In one line, what are threads for?',
    waitAfterPromptMs: 4000,
  },

  // Memory is a premium component, unavailable in this runtime.
  reserve('memory'),

  {
    id: 'headless',
    name: 'Headless UI',
    videoName: 'HeadlessUi',
    docPath: 'guides/threads-memory-attachments-headless',
    route: 'headless',
    ideFile: 'frontend/src/app/features/headless/headless-chat.component.ts',
    startLine: 12,
    endLine: 65,
    prompt: 'Tell me a short joke about Angular developers.',
    waitAfterPromptMs: 4000,
  },
]).filter((page) => !page.id.startsWith(RESERVED_PREFIX));
