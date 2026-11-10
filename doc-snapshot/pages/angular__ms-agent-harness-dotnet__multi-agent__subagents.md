# Sub-Agents

> Decompose work across multiple specialized agents with a visible delegation log.


<!-- interactive demo: subagents -->


## What is this?

Sub-agents are the canonical multi-agent pattern: a top-level
**supervisor** LLM orchestrates one or more specialized **sub-agents**
by exposing each of them as a tool. The supervisor decides what to
delegate, the sub-agents do their narrow job, and their results flow
back up to the supervisor's next step.

This is fundamentally the same shape as tool-calling, but each "tool"
is itself a full-blown agent with its own system prompt and (often) its
own tools, memory, and model.

## When should I use this?

Reach for sub-agents when a task has distinct specialized sub-tasks
that each benefit from their own focus:

- **Research → Write → Critique** pipelines, where each stage needs a
  different system prompt and temperature.
- **Router + specialists**, where one agent classifies the request and
  dispatches to the right expert.
- **Divide-and-conquer** — any problem that fits cleanly into parallel
  or sequential sub-problems.

The example below uses the Research → Write → Critique shape as the
canonical example.

## Setting up sub-agents

<!-- setup skipped: subagents-setup is not bundled for ms-agent-harness-dotnet -->

Each sub-agent is an isolated agent call with its own model, system
prompt, and optional tools. They don't share memory or tools with the
supervisor; the supervisor only ever sees what the sub-agent returns.

```csharp
// agent/SubagentsAgent.cs
using System.ComponentModel;
using System.Diagnostics.CodeAnalysis;
using System.Net.Http;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using OpenAI;
using System.ClientModel;

// SubagentsAgent — backs the /subagents demo.
//
// Mirrors langgraph-python/src/agents/subagents.py and
// google-adk/src/agents/subagents_agent.py:
//
//   * A supervisor ChatClientAgent exposes three tools — `research_agent`,
//     `writing_agent`, `critique_agent` — each of which delegates to a
//     specialised sub-agent.
//
//   * Each sub-agent is implemented as a single-shot secondary chat-client
//     call with its own system prompt. This is conceptually identical to
//     spawning a separate ChatClientAgent + Runner per delegation; we use a
//     single-shot call here to keep the demo wiring tight (and to mirror the
//     google-adk reference, which does the same with `genai.Client`).
//
//   * Every delegation is recorded in `state.delegations` — a list of
//     `Delegation { id, sub_agent, task, status, result }` records — and
//     emitted to the UI as a state-snapshot DataContent payload after the
//     supervisor's stream completes. (The snapshot also gets re-emitted on
//     each tool call so the UI's `running` -> `completed` transition is
//     visible mid-stream; see `EmitSnapshotAsync` below.)
[SuppressMessage("Performance", "CA1812:Avoid uninstantiated internal classes", Justification = "Instantiated by SubagentsAgentFactory")]
internal sealed class SubagentsAgent : DelegatingAIAgent
{
    private readonly ILogger<SubagentsAgent> _logger;
    private readonly SubagentsStore _store;

    public SubagentsAgent(
        AIAgent innerAgent,
        SubagentsStore store,
        ILogger<SubagentsAgent>? logger = null)
        : base(innerAgent)
    {
        ArgumentNullException.ThrowIfNull(innerAgent);
        ArgumentNullException.ThrowIfNull(store);
        _store = store;
        _logger = logger ?? NullLogger<SubagentsAgent>.Instance;
    }

    protected override Task<AgentResponse> RunCoreAsync(IEnumerable<ChatMessage> messages, AgentSession? thread = null, AgentRunOptions? options = null, CancellationToken cancellationToken = default)
    {
        return RunCoreStreamingAsync(messages, thread, options, cancellationToken).ToAgentResponseAsync(cancellationToken);
    }

    protected override async IAsyncEnumerable<AgentResponseUpdate> RunCoreStreamingAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? thread = null,
        AgentRunOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(messages);
        var messageList = messages as IReadOnlyList<ChatMessage> ?? messages.ToList();

        // Bind the tool's read/write target to the current thread so each
        // conversation appends to its own delegation list. The store
        // exposes a per-thread "active" handle that the static tool
        // function reads. We restore the previous value on exit so nested /
        // overlapping runs don't trample each other.
        var previous = (AgentSession?)_store.SetActiveThread(thread);
        try
        {
            await foreach (var update in InnerAgent.RunStreamingAsync(messageList, thread, options, cancellationToken).ConfigureAwait(false))
            {
                yield return update;

                // Flush any state changes the tool made during this update
                // chunk. The inner ChatClientAgent doesn't emit DataContent
                // for tool calls, so the UI would otherwise only see the
                // final post-stream snapshot — losing the visible
                // running -> completed transition that makes the demo
                // compelling. We dedupe via SubagentsStore.TakeDirtyVersion
                // so we don't spam identical snapshots across token chunks.
                if (_store.TakeDirty(thread))
                {
                    var snapshot = _store.BuildSnapshot(thread);
                    var bytes = JsonSerializer.SerializeToUtf8Bytes(
                        snapshot,
                        SubagentsSerializerContext.Default.SubagentsSnapshot);
                    yield return new AgentResponseUpdate
                    {
                        Contents = [new DataContent(bytes, "application/json")],
                    };
                }
            }
        }
        finally
        {
            _store.SetActiveThread(previous);
        }

        // Final snapshot — guarantees at least one state event per turn
        // even if the supervisor produced no tool calls (so the UI sees a
        // stable empty `delegations` list rather than `undefined`).
        var finalSnapshot = _store.BuildSnapshot(thread);
        var finalBytes = JsonSerializer.SerializeToUtf8Bytes(
            finalSnapshot,
            SubagentsSerializerContext.Default.SubagentsSnapshot);
        yield return new AgentResponseUpdate
        {
            Contents = [new DataContent(finalBytes, "application/json")],
        };
    }
}

/// <summary>
/// Per-thread store of delegation entries. Reads/writes are synchronized via
/// a single lock — the demo workload is light and the lock is held only
/// across the read-modify-write of an in-memory list.
/// </summary>
internal sealed class SubagentsStore
{
    // Instance-scoped (not static) so multiple SubagentsStore instances —
    // e.g. test helpers, future multi-tenant wiring — don't share global
    // state with their per-instance `_slots` dict.
    private readonly object _globalSlot = new();
    private readonly AsyncLocal<object?> _activeThreadKey = new();

    private readonly Dictionary<object, ThreadSlot> _slots = new();
    private readonly object _lock = new();

    public object? SetActiveThread(AgentSession? thread)
    {
        var prior = _activeThreadKey.Value;
        _activeThreadKey.Value = thread ?? _globalSlot;
        return prior;
    }

    public string AppendRunning(string subAgent, string task)
    {
        var entry = new SubagentDelegation(
            Id: Guid.NewGuid().ToString("n")[..16],
            SubAgent: subAgent,
            Task: task,
            Status: "running",
            Result: "");
        lock (_lock)
        {
            // Mirror into every live conversation slot when the active key
            // collapses to global — harness tool invocation can drop the
            // AsyncLocal set by SetActiveThread (same root cause as
            // D5ParityAgents SnapshotStore). Without this the left-panel UI
            // stays empty while chat tool cards still stream.
            foreach (var slot in WriteTargets())
            {
                slot.Delegations.Add(entry);
                slot.DirtyVersion++;
            }
        }
        return entry.Id;
    }

    public void Update(string id, string status, string result)
    {
        lock (_lock)
        {
            foreach (var slot in WriteTargets())
            {
                for (var i = 0; i < slot.Delegations.Count; i++)
                {
                    if (slot.Delegations[i].Id == id)
                    {
                        slot.Delegations[i] = slot.Delegations[i] with
                        {
                            Status = status,
                            Result = result,
                        };
                        slot.DirtyVersion++;
                        break;
                    }
                }
            }
        }
    }

    public bool TakeDirty(AgentSession? thread)
    {
        lock (_lock)
        {
            var slot = ResolveSlotForRead(thread);
            if (slot is null)
            {
                return false;
            }
            if (slot.DirtyVersion == slot.LastEmittedVersion)
            {
                return false;
            }
            slot.LastEmittedVersion = slot.DirtyVersion;
            return true;
        }
    }

    public SubagentsSnapshot BuildSnapshot(AgentSession? thread)
    {
        lock (_lock)
        {
            var slot = ResolveSlotForRead(thread);
            if (slot is null)
            {
                return new SubagentsSnapshot(Array.Empty<SubagentDelegation>());
            }
            // Defensive copy — caller may serialize after the lock releases.
            return new SubagentsSnapshot(slot.Delegations.ToArray());
        }
    }

    /// <summary>
    /// Prefer the per-thread slot when it has delegations; otherwise fall
    /// back to the global slot that tools land in when AsyncLocal doesn't
    /// flow into the harness function-invocation context.
    /// </summary>
    private ThreadSlot? ResolveSlotForRead(AgentSession? thread)
    {
        if (thread is not null &&
            _slots.TryGetValue(thread, out var threadSlot) &&
            (threadSlot.Delegations.Count > 0 || threadSlot.DirtyVersion > 0))
        {
            return threadSlot;
        }
        if (_slots.TryGetValue(_globalSlot, out var globalSlot) &&
            (globalSlot.Delegations.Count > 0 || globalSlot.DirtyVersion > 0))
        {
            return globalSlot;
        }
        if (thread is not null && _slots.TryGetValue(thread, out threadSlot))
        {
            return threadSlot;
        }
        return _slots.TryGetValue(_globalSlot, out globalSlot) ? globalSlot : null;
    }

    private IEnumerable<ThreadSlot> WriteTargets()
    {
        var key = _activeThreadKey.Value ?? _globalSlot;
        yield return GetOrCreateSlot(key);

        // When AsyncLocal missed and we wrote to global, also mirror into
        // any already-bound conversation slots so the post-run snapshot
        // (which keys by AgentSession) still sees the delegations.
        if (ReferenceEquals(key, _globalSlot))
        {
            foreach (var kvp in _slots)
            {
                if (!ReferenceEquals(kvp.Key, _globalSlot))
                {
                    yield return kvp.Value;
                }
            }
        }
    }

    private ThreadSlot GetOrCreateSlot(object key)
    {
        if (!_slots.TryGetValue(key, out var slot))
        {
            slot = new ThreadSlot();
            _slots[key] = slot;
        }
        return slot;
    }

    private sealed class ThreadSlot
    {
        public List<SubagentDelegation> Delegations { get; } = new();
        public long DirtyVersion { get; set; }
        public long LastEmittedVersion { get; set; }
    }
}

internal sealed record SubagentDelegation(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("sub_agent")] string SubAgent,
    [property: JsonPropertyName("task")] string Task,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("result")] string Result);

internal sealed record SubagentsSnapshot(
    [property: JsonPropertyName("delegations")] IReadOnlyList<SubagentDelegation> Delegations);

[JsonSerializable(typeof(SubagentsSnapshot))]
[JsonSerializable(typeof(SubagentDelegation))]
[JsonSerializable(typeof(IReadOnlyList<SubagentDelegation>))]
internal sealed partial class SubagentsSerializerContext : JsonSerializerContext;

/// <summary>
/// Factory that builds the supervisor agent + the three sub-agent tools.
/// Mounted in Program.cs at `/subagents`.
/// </summary>
public sealed class SubagentsAgentFactory
{
    private const int HarnessMaxContextWindowTokens = 128_000;
    private const int HarnessMaxOutputTokens = 8_192;
    private const string SubAgentModel = "gpt-6-luna";

    // Each sub-agent is a single-shot ChatClient call (built per-delegation
    // in DelegateAsync) with its own system prompt. They don't share memory
    // or tools with the supervisor — the supervisor only sees their return
    // value as a tool result.
    private const string ResearchSystemPrompt =
        "You are a research sub-agent. Given a topic, produce a concise " +
        "bulleted list of 3-5 key facts. No preamble, no closing.";
    private const string WritingSystemPrompt =
        "You are a writing sub-agent. Given a brief and optional source facts, " +
        "produce a polished 1-paragraph draft. Be clear and concrete. No preamble.";
    private const string CritiqueSystemPrompt =
        "You are an editorial critique sub-agent. Given a draft, give 2-3 crisp, " +
        "actionable critiques. No preamble.";
```

Keep sub-agent system prompts narrow and focused. The point of this pattern
is that each one does one thing well. If a sub-agent needs to know
the whole user context to do its job, that's a signal the boundary is
wrong.

## Exposing sub-agents as tools

The supervisor delegates by calling tools. Each delegation tool is a thin
wrapper around a specialized agent call that:

1. Runs the sub-agent on the supplied `task` string.
2. Records the delegation into a `delegations` slot in shared agent
   state (so the UI can render a live log).
3. Returns the sub-agent's final message as the tool result, which the
   supervisor sees on its next turn.

```csharp
// agent/SubagentsAgent.cs
using System.ComponentModel;
using System.Diagnostics.CodeAnalysis;
using System.Net.Http;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using OpenAI;
using System.ClientModel;

// SubagentsAgent — backs the /subagents demo.
//
// Mirrors langgraph-python/src/agents/subagents.py and
// google-adk/src/agents/subagents_agent.py:
//
//   * A supervisor ChatClientAgent exposes three tools — `research_agent`,
//     `writing_agent`, `critique_agent` — each of which delegates to a
//     specialised sub-agent.
//
//   * Each sub-agent is implemented as a single-shot secondary chat-client
//     call with its own system prompt. This is conceptually identical to
//     spawning a separate ChatClientAgent + Runner per delegation; we use a
//     single-shot call here to keep the demo wiring tight (and to mirror the
//     google-adk reference, which does the same with `genai.Client`).
//
//   * Every delegation is recorded in `state.delegations` — a list of
//     `Delegation { id, sub_agent, task, status, result }` records — and
//     emitted to the UI as a state-snapshot DataContent payload after the
//     supervisor's stream completes. (The snapshot also gets re-emitted on
//     each tool call so the UI's `running` -> `completed` transition is
//     visible mid-stream; see `EmitSnapshotAsync` below.)
[SuppressMessage("Performance", "CA1812:Avoid uninstantiated internal classes", Justification = "Instantiated by SubagentsAgentFactory")]
internal sealed class SubagentsAgent : DelegatingAIAgent
{
    private readonly ILogger<SubagentsAgent> _logger;
    private readonly SubagentsStore _store;

    public SubagentsAgent(
        AIAgent innerAgent,
        SubagentsStore store,
        ILogger<SubagentsAgent>? logger = null)
        : base(innerAgent)
    {
        ArgumentNullException.ThrowIfNull(innerAgent);
        ArgumentNullException.ThrowIfNull(store);
        _store = store;
        _logger = logger ?? NullLogger<SubagentsAgent>.Instance;
    }

    protected override Task<AgentResponse> RunCoreAsync(IEnumerable<ChatMessage> messages, AgentSession? thread = null, AgentRunOptions? options = null, CancellationToken cancellationToken = default)
    {
        return RunCoreStreamingAsync(messages, thread, options, cancellationToken).ToAgentResponseAsync(cancellationToken);
    }

    protected override async IAsyncEnumerable<AgentResponseUpdate> RunCoreStreamingAsync(
        IEnumerable<ChatMessage> messages,
        AgentSession? thread = null,
        AgentRunOptions? options = null,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(messages);
        var messageList = messages as IReadOnlyList<ChatMessage> ?? messages.ToList();

        // Bind the tool's read/write target to the current thread so each
        // conversation appends to its own delegation list. The store
        // exposes a per-thread "active" handle that the static tool
        // function reads. We restore the previous value on exit so nested /
        // overlapping runs don't trample each other.
        var previous = (AgentSession?)_store.SetActiveThread(thread);
        try
        {
            await foreach (var update in InnerAgent.RunStreamingAsync(messageList, thread, options, cancellationToken).ConfigureAwait(false))
            {
                yield return update;

                // Flush any state changes the tool made during this update
                // chunk. The inner ChatClientAgent doesn't emit DataContent
                // for tool calls, so the UI would otherwise only see the
                // final post-stream snapshot — losing the visible
                // running -> completed transition that makes the demo
                // compelling. We dedupe via SubagentsStore.TakeDirtyVersion
                // so we don't spam identical snapshots across token chunks.
                if (_store.TakeDirty(thread))
                {
                    var snapshot = _store.BuildSnapshot(thread);
                    var bytes = JsonSerializer.SerializeToUtf8Bytes(
                        snapshot,
                        SubagentsSerializerContext.Default.SubagentsSnapshot);
                    yield return new AgentResponseUpdate
                    {
                        Contents = [new DataContent(bytes, "application/json")],
                    };
                }
            }
        }
        finally
        {
            _store.SetActiveThread(previous);
        }

        // Final snapshot — guarantees at least one state event per turn
        // even if the supervisor produced no tool calls (so the UI sees a
        // stable empty `delegations` list rather than `undefined`).
        var finalSnapshot = _store.BuildSnapshot(thread);
        var finalBytes = JsonSerializer.SerializeToUtf8Bytes(
            finalSnapshot,
            SubagentsSerializerContext.Default.SubagentsSnapshot);
        yield return new AgentResponseUpdate
        {
            Contents = [new DataContent(finalBytes, "application/json")],
        };
    }
}

/// <summary>
/// Per-thread store of delegation entries. Reads/writes are synchronized via
/// a single lock — the demo workload is light and the lock is held only
/// across the read-modify-write of an in-memory list.
/// </summary>
internal sealed class SubagentsStore
{
    // Instance-scoped (not static) so multiple SubagentsStore instances —
    // e.g. test helpers, future multi-tenant wiring — don't share global
    // state with their per-instance `_slots` dict.
    private readonly object _globalSlot = new();
    private readonly AsyncLocal<object?> _activeThreadKey = new();

    private readonly Dictionary<object, ThreadSlot> _slots = new();
    private readonly object _lock = new();

    public object? SetActiveThread(AgentSession? thread)
    {
        var prior = _activeThreadKey.Value;
        _activeThreadKey.Value = thread ?? _globalSlot;
        return prior;
    }

    public string AppendRunning(string subAgent, string task)
    {
        var entry = new SubagentDelegation(
            Id: Guid.NewGuid().ToString("n")[..16],
            SubAgent: subAgent,
            Task: task,
            Status: "running",
            Result: "");
        lock (_lock)
        {
            // Mirror into every live conversation slot when the active key
            // collapses to global — harness tool invocation can drop the
            // AsyncLocal set by SetActiveThread (same root cause as
            // D5ParityAgents SnapshotStore). Without this the left-panel UI
            // stays empty while chat tool cards still stream.
            foreach (var slot in WriteTargets())
            {
                slot.Delegations.Add(entry);
                slot.DirtyVersion++;
            }
        }
        return entry.Id;
    }

    public void Update(string id, string status, string result)
    {
        lock (_lock)
        {
            foreach (var slot in WriteTargets())
            {
                for (var i = 0; i < slot.Delegations.Count; i++)
                {
                    if (slot.Delegations[i].Id == id)
                    {
                        slot.Delegations[i] = slot.Delegations[i] with
                        {
                            Status = status,
                            Result = result,
                        };
                        slot.DirtyVersion++;
                        break;
                    }
                }
            }
        }
    }

    public bool TakeDirty(AgentSession? thread)
    {
        lock (_lock)
        {
            var slot = ResolveSlotForRead(thread);
            if (slot is null)
            {
                return false;
            }
            if (slot.DirtyVersion == slot.LastEmittedVersion)
            {
                return false;
            }
            slot.LastEmittedVersion = slot.DirtyVersion;
            return true;
        }
    }

    public SubagentsSnapshot BuildSnapshot(AgentSession? thread)
    {
        lock (_lock)
        {
            var slot = ResolveSlotForRead(thread);
            if (slot is null)
            {
                return new SubagentsSnapshot(Array.Empty<SubagentDelegation>());
            }
            // Defensive copy — caller may serialize after the lock releases.
            return new SubagentsSnapshot(slot.Delegations.ToArray());
        }
    }

    /// <summary>
    /// Prefer the per-thread slot when it has delegations; otherwise fall
    /// back to the global slot that tools land in when AsyncLocal doesn't
    /// flow into the harness function-invocation context.
    /// </summary>
    private ThreadSlot? ResolveSlotForRead(AgentSession? thread)
    {
        if (thread is not null &&
            _slots.TryGetValue(thread, out var threadSlot) &&
            (threadSlot.Delegations.Count > 0 || threadSlot.DirtyVersion > 0))
        {
            return threadSlot;
        }
        if (_slots.TryGetValue(_globalSlot, out var globalSlot) &&
            (globalSlot.Delegations.Count > 0 || globalSlot.DirtyVersion > 0))
        {
            return globalSlot;
        }
        if (thread is not null && _slots.TryGetValue(thread, out threadSlot))
        {
            return threadSlot;
        }
        return _slots.TryGetValue(_globalSlot, out globalSlot) ? globalSlot : null;
    }

    private IEnumerable<ThreadSlot> WriteTargets()
    {
        var key = _activeThreadKey.Value ?? _globalSlot;
        yield return GetOrCreateSlot(key);

        // When AsyncLocal missed and we wrote to global, also mirror into
        // any already-bound conversation slots so the post-run snapshot
        // (which keys by AgentSession) still sees the delegations.
        if (ReferenceEquals(key, _globalSlot))
        {
            foreach (var kvp in _slots)
            {
                if (!ReferenceEquals(kvp.Key, _globalSlot))
                {
                    yield return kvp.Value;
                }
            }
        }
    }

    private ThreadSlot GetOrCreateSlot(object key)
    {
        if (!_slots.TryGetValue(key, out var slot))
        {
            slot = new ThreadSlot();
            _slots[key] = slot;
        }
        return slot;
    }

    private sealed class ThreadSlot
    {
        public List<SubagentDelegation> Delegations { get; } = new();
        public long DirtyVersion { get; set; }
        public long LastEmittedVersion { get; set; }
    }
}

internal sealed record SubagentDelegation(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("sub_agent")] string SubAgent,
    [property: JsonPropertyName("task")] string Task,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("result")] string Result);

internal sealed record SubagentsSnapshot(
    [property: JsonPropertyName("delegations")] IReadOnlyList<SubagentDelegation> Delegations);

[JsonSerializable(typeof(SubagentsSnapshot))]
[JsonSerializable(typeof(SubagentDelegation))]
[JsonSerializable(typeof(IReadOnlyList<SubagentDelegation>))]
internal sealed partial class SubagentsSerializerContext : JsonSerializerContext;

/// <summary>
/// Factory that builds the supervisor agent + the three sub-agent tools.
/// Mounted in Program.cs at `/subagents`.
/// </summary>
public sealed class SubagentsAgentFactory
{
    private const int HarnessMaxContextWindowTokens = 128_000;
    private const int HarnessMaxOutputTokens = 8_192;
    private const string SubAgentModel = "gpt-6-luna";

    // Each sub-agent is a single-shot ChatClient call (built per-delegation
    // in DelegateAsync) with its own system prompt. They don't share memory
    // or tools with the supervisor — the supervisor only sees their return
    // value as a tool result.
    private const string ResearchSystemPrompt =
        "You are a research sub-agent. Given a topic, produce a concise " +
        "bulleted list of 3-5 key facts. No preamble, no closing.";
    private const string WritingSystemPrompt =
        "You are a writing sub-agent. Given a brief and optional source facts, " +
        "produce a polished 1-paragraph draft. Be clear and concrete. No preamble.";
    private const string CritiqueSystemPrompt =
        "You are an editorial critique sub-agent. Given a draft, give 2-3 crisp, " +
        "actionable critiques. No preamble.";

    private const string SupervisorPrompt =
        "You are a supervisor agent that coordinates three specialized " +
        "sub-agents to produce high-quality deliverables.\n\n" +
        "Available sub-agents (call them as tools):\n" +
        "  - research_agent: gathers facts on a topic.\n" +
        "  - writing_agent: turns facts + a brief into a polished draft.\n" +
        "  - critique_agent: reviews a draft and suggests improvements.\n\n" +
        "For most non-trivial user requests, delegate in sequence: research -> " +
        "write -> critique. Pass relevant facts/draft through the `task` argument " +
        "of each tool. Each tool returns a JSON object shaped " +
        "{status: 'completed' | 'failed', result?: string, error?: string}. " +
        "If a sub-agent fails, surface the failure briefly to the user (don't " +
        "fabricate a result) and decide whether to retry. Keep your own " +
        "messages short — explain the plan once, delegate, then return a " +
        "concise summary once done. The UI shows the user a live log of " +
        "every sub-agent delegation, including the in-flight 'running' state.";

    private readonly OpenAIClient _openAiClient;
    private readonly ILoggerFactory _loggerFactory;
    private readonly ILogger _logger;
    private readonly JsonSerializerOptions _jsonSerializerOptions;
    private readonly SubagentsStore _store = new();

    public SubagentsAgentFactory(
        OpenAIClient openAiClient,
        ILoggerFactory loggerFactory,
        JsonSerializerOptions jsonSerializerOptions)
    {
        ArgumentNullException.ThrowIfNull(openAiClient);
        ArgumentNullException.ThrowIfNull(loggerFactory);
        ArgumentNullException.ThrowIfNull(jsonSerializerOptions);

        _openAiClient = openAiClient;
        _loggerFactory = loggerFactory;
        _logger = loggerFactory.CreateLogger<SubagentsAgentFactory>();
        _jsonSerializerOptions = jsonSerializerOptions;
    }

    public AIAgent CreateAgent()
    {
        var chatClient = _openAiClient.GetChatClient("gpt-6-luna").AsLunaChatClient();

        // Each sub-agent is exposed to the supervisor LLM as an AIFunction
        // tool. When the supervisor invokes one, DelegateAsync runs a fresh
        // ChatClient call with that sub-agent's system prompt, appends a
        // Delegation entry to shared state, and returns the sub-agent's
        // output to the supervisor as a tool result.
        var research = AIFunctionFactory.Create(
            (Func<string, CancellationToken, Task<string>>)((task, ct) =>
                DelegateAsync("research_agent", ResearchSystemPrompt, task, ct)),
            options: new()
            {
                Name = "research_agent",
                Description = "Delegate a research task to the research sub-agent. Returns JSON {status, result?, error?}.",
                SerializerOptions = _jsonSerializerOptions,
            });
        var writing = AIFunctionFactory.Create(
            (Func<string, CancellationToken, Task<string>>)((task, ct) =>
                DelegateAsync("writing_agent", WritingSystemPrompt, task, ct)),
            options: new()
            {
                Name = "writing_agent",
                Description = "Delegate a drafting task to the writing sub-agent. Returns JSON {status, result?, error?}.",
                SerializerOptions = _jsonSerializerOptions,
            });
        var critique = AIFunctionFactory.Create(
            (Func<string, CancellationToken, Task<string>>)((task, ct) =>
                DelegateAsync("critique_agent", CritiqueSystemPrompt, task, ct)),
            options: new()
            {
                Name = "critique_agent",
                Description = "Delegate a critique task to the critique sub-agent. Returns JSON {status, result?, error?}.",
                SerializerOptions = _jsonSerializerOptions,
            });
```

This is where CopilotKit's shared-state channel earns its keep: the
supervisor's tool calls mutate `delegations` as they happen, and the
frontend renders every new entry live.

<Callout type="warn">
  Give every delegation a stable `id` and merge new entries by that `id`. The
  client sends its copy of shared state back as run input on every run, so a
  slot that blindly appends whatever it receives — a LangGraph
  `Annotated[list, operator.add]` reducer, for example — concatenates the
  entries the client just echoed onto the ones the agent already has, and the
  log doubles when a thread is continued.
</Callout>

## Rendering a live delegation log

On the frontend, the delegation log is a reactive render of the
`delegations` slot.




Read the selected agent's state through `injectAgentStore`, derive the
delegations with `computed`, and register one typed renderer for each sub-agent
tool. The Angular Showcase uses this source:

```typescript
// features/agent-state/agent-state-feature.component.ts
  private readonly agentStore = injectAgentStore(this.agentId);
  protected readonly delegations = computed(() =>
    readDelegations(this.agentStore().state()),
  );

  constructor() {
    if (this.feature === "subagents") {
      this.registerSubAgent("research_agent");
      this.registerSubAgent("writing_agent");
      this.registerSubAgent("critique_agent");
    }
  }

  private registerSubAgent(name: SubAgentName): void {
    registerRenderToolCall(subAgentRendererConfig(name));
  }
```


The result: as the supervisor fans work out to its sub-agents, the log
grows in real time, giving the user visibility into a process that
would otherwise be a long opaque spinner.

## Related

- **[Shared State](/angular/ms-agent-harness-dotnet/guides/shared-state)** — the channel that makes the
  delegation log live.
- **[State streaming](/angular/ms-agent-harness-dotnet/guides/shared-state)** — stream
  *individual* sub-agent outputs token-by-token inside each log entry.
