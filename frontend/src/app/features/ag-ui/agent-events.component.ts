// ag-ui : subscribing to ag-ui events start
/**
 * "Subscribing to AG-UI events", verbatim.
 * https://docs.copilotkit.ai/angular/ms-agent-harness-dotnet/ag-ui
 *
 * The guide gives only the class members; the decorator and imports around
 * them are the minimum needed to mount it. Output goes to the browser console.
 */
import { Component, DestroyRef, inject } from "@angular/core";
import { injectAgentStore } from "@copilotkit/angular";

@Component({
  selector: "app-agent-events",
  template: ``,
})
export class AgentEventsComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly store = injectAgentStore("research-agent");

  constructor() {
    const subscription = this.store().agent.subscribe({
      onTextMessageContentEvent({ textMessageBuffer }) {
        console.log("Streaming text:", textMessageBuffer);
      },
      onToolCallEndEvent({ toolCallName, toolCallArgs }) {
        console.log("Tool called:", toolCallName, toolCallArgs);
      },
      onStateChanged({ agent }) {
        console.log("State changed:", agent.state);
      },
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
}
// ag-ui : subscribing to ag-ui events end
