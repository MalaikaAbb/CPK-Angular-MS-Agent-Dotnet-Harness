/**
 * "Use existing web components", from
 * https://docs.copilotkit.ai/angular/ms-agent-harness-dotnet/guides/a2ui#use-existing-web-components
 * (published as src/app/a2ui-catalog.ts).
 *
 * The `createAngularCatalog(...)` call between the region markers is the
 * guide's, unchanged. The guide shows it as a fragment, so two things are
 * added around it, and nothing inside it:
 * - the imports it uses (`z`, `createAngularCatalog`, `ChildListSchema`,
 *   `AcmeBadge`, `PanelComponent`);
 * - `export { catalog }`, so app.config.ts can pass it to `provideCopilotKit`
 *   as the guide's "Give each catalog a stable catalogId, then select it in
 *   the a2ui option" section says to.
 *
 * `AcmeBadge` and `PanelComponent` are not defined by the guide; see their
 * files.
 */
import { z } from "zod";
import { ChildListSchema, createAngularCatalog } from "@copilotkit/angular/a2ui";

import { AcmeBadge } from "./acme-badge.element";
import { PanelComponent } from "./panel.component";

// a2ui : use existing web components start
const catalog = createAngularCatalog(
  {
    Badge: { props: z.object({ label: z.string() }) },
    Panel: { props: z.object({ children: ChildListSchema }) },
  },
  {
    Badge: { tagName: "acme-badge", element: AcmeBadge },
    Panel: PanelComponent,
  },
  { includeBasicCatalog: true },
);
// a2ui : use existing web components end

export { catalog };
