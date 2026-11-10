/**
 * SELF-DEFINED — `AcmeBadge`, the custom element the A2UI guide's
 * "Use existing web components" catalog registers as `acme-badge` but never
 * shows (it stands for "a component from an existing design system").
 *
 * No CopilotKit source defines it. It follows the pattern of the Angular
 * demo's web-component elements (examples/v2/angular/demo/src/app/routes/
 * a2ui-web-components/elements.ts): extend `A2uiElement`, bind the entry's
 * props schema — the guide's `z.object({ label: z.string() })` — and render
 * into the shadow root.
 */
import { z } from "zod";

import { A2uiElement } from "./a2ui-element";

interface BadgeProps {
  label: string;
}

export class AcmeBadge extends A2uiElement<BadgeProps> {
  protected readonly schema = z.object({ label: z.string() });

  protected render(props: BadgeProps): void {
    const root = this.shadowRoot!;
    root.innerHTML = `
      <style>
        :host { display: inline-block; margin: 4px; }
        span { display: inline-block; padding: 2px 8px; border-radius: 999px;
          background: #1e3a8a; color: #fff; font: 600 12px/1.6 system-ui, sans-serif; }
      </style>
      <span></span>
    `;
    // The label comes from the agent, so it is set as text, never as HTML.
    root.querySelector("span")!.textContent = props.label ?? "";
  }
}
