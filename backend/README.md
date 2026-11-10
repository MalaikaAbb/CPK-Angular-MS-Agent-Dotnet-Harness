# Backend — Microsoft Agent Harness over Microsoft Agent Framework (.NET)

```bash
cp .env.example .env   # then set OPENAI_API_KEY
dotnet run             # http://localhost:8251
```

| File | Origin |
|---|---|
| `Program.cs` | Self-defined host: the `default` agent (`AsHarnessAgent`), `getWeather`, and the `MapAGUI` endpoints |
| `ResearchAgent.cs` | Self-defined: the AG-UI guide's `research-agent`, which the guide never defines |
| `SubagentsAgent.cs` | CopilotKit showcase `showcase/integrations/ms-agent-harness-dotnet/agent/`, unchanged — the file the Sub-Agents guide quotes |
| `shared/LunaChatClientExtensions.cs` | Showcase `showcase/integrations/_shared/dotnet/`, unchanged (`AsLunaChatClient`) |
| `Backend.csproj` | Showcase `BeautifulChatAgent.csproj` settings and package pins |
