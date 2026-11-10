/**
 * Copied unchanged (apart from this header) from the CopilotKit Angular demo,
 * examples/v2/angular/demo/src/app/routes/a2ui-web-components/a2ui-element.ts.
 *
 * The A2UI guide says a custom element "reads its props and writes to the
 * data model through that context, for example with web_core's
 * `GenericBinder`", but shows no element. This is the demo's base class that
 * does exactly that; AcmeBadge extends it. `@a2ui/web_core` is a dependency of
 * `@copilotkit/angular` and is not declared in this repo's package.json.
 */
import type { ComponentContext } from "@a2ui/web_core/v0_9";
import { GenericBinder } from "@a2ui/web_core/v0_9";
import type { A2uiWebComponentElement } from "@copilotkit/angular/a2ui";
import type { ZodTypeAny } from "zod";

/**
 * A plain Custom Element base for A2UI catalog entries. The renderer assigns
 * `context`; the element binds its schema to it with web_core's
 * `GenericBinder` and re-renders whenever the resolved props change. Dynamic
 * props come with `set*` setters that write back to the data model.
 */
export abstract class A2uiElement<Props>
  extends HTMLElement
  implements A2uiWebComponentElement
{
  protected abstract readonly schema: ZodTypeAny;
  protected abstract render(props: Props): void;

  #context?: ComponentContext;
  #binder?: GenericBinder<Props>;
  #subscription?: { unsubscribe(): void };

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get context(): ComponentContext | undefined {
    return this.#context;
  }

  set context(context: ComponentContext | undefined) {
    this.#context = context;
    this.#bind();
  }

  // Angular may move the element (for example when siblings reorder), which
  // disconnects and reconnects it; bind only while it is in the document.
  connectedCallback(): void {
    this.#bind();
  }

  disconnectedCallback(): void {
    this.#unbind();
  }

  #bind(): void {
    this.#unbind();
    if (!this.#context || !this.isConnected) return;
    this.#binder = new GenericBinder<Props>(this.#context, this.schema);
    this.#subscription = this.#binder.subscribe((props) => this.render(props));
    this.render(this.#binder.snapshot);
  }

  #unbind(): void {
    this.#subscription?.unsubscribe();
    this.#subscription = undefined;
    this.#binder?.dispose();
    this.#binder = undefined;
  }
}
