// SELF-DEFINED — not from the docs or the showcase.
//
// https://docs.copilotkit.ai/angular/ms-agent-harness-dotnet/ag-ui addresses an
// agent as "research-agent" but never defines one. This is the smallest
// harness agent that can answer to that runtime key, built the same way as the
// default agent in Program.cs. Its instructions are the showcase's research
// sub-agent prompt (`ResearchSystemPrompt` in SubagentsAgent.cs) — repeated
// here because that constant is private — so its replies are recognisably
// different from the default agent's.
//
// Mirrors ../ms-agent-py/backend/research_agent.py.
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;

internal static class ResearchAgent
{
    private const int HarnessMaxContextWindowTokens = 128_000;
    private const int HarnessMaxOutputTokens = 8_192;

    // Same text as SubagentsAgentFactory.ResearchSystemPrompt.
    private const string ResearchInstructions =
        "You are a research sub-agent. Given a topic, produce a concise " +
        "bulleted list of 3-5 key facts. No preamble, no closing.";

    public static AIAgent Create(IChatClient chatClient) =>
        chatClient.AsHarnessAgent(
            HarnessMaxContextWindowTokens,
            HarnessMaxOutputTokens,
            new HarnessAgentOptions
            {
                Name = "research_agent",
                Description = "Research agent: answers a topic with 3-5 key facts.",
                ChatOptions = new ChatOptions
                {
                    Instructions = ResearchInstructions,
                    MaxOutputTokens = HarnessMaxOutputTokens,
                    Tools = [],
                },
            });
}
