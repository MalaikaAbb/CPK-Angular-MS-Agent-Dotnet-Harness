/**
 * `PanelComponent`, which the A2UI guide's "Use existing web components"
 * catalog registers but never shows.
 *
 * From the CopilotKit Angular demo,
 * examples/v2/angular/demo/src/app/routes/a2ui-web-components/catalog.ts,
 * cut down to the guide's definition: the guide's Panel has only
 * `children: ChildListSchema`, so the demo's `title` / `tone` header is left
 * out. Children render through the package's `copilot-a2ui-child`, which
 * renders Angular components and web components alike.
 */
import { Component, input } from "@angular/core";
import { z } from "zod";
import type { A2UICatalogDefinitions, A2UIProps } from "@copilotkit/angular/a2ui";
import { ChildListSchema, CopilotA2UIChild } from "@copilotkit/angular/a2ui";

/** The guide's Panel definition, repeated here to type the component's props. */
const panelDefinitions = {
  Panel: { props: z.object({ children: ChildListSchema }) },
} satisfies A2UICatalogDefinitions;

@Component({
  selector: "app-a2ui-panel",
  imports: [CopilotA2UIChild],
  host: { style: "display: contents" },
  template: `
    <section class="panel">
      @for (child of props().children; track $index) {
        <copilot-a2ui-child [child]="child" />
      }
    </section>
  `,
  styles: `
    .panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 8px;
      padding: 12px 14px;
      border: 1px solid #2563eb;
      border-radius: 12px;
      background: color-mix(in srgb, #2563eb 6%, white);
    }
  `,
})
export class PanelComponent {
  readonly props = input.required<A2UIProps<typeof panelDefinitions, "Panel">>();
}
