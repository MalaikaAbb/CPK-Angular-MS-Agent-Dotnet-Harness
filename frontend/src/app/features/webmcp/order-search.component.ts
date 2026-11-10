// webmcp : angular frontend tool start
/**
 * "Angular frontend tool", verbatim from
 * https://docs.copilotkit.ai/angular/ms-agent-harness-dotnet/webmcp
 *
 * The only addition is the `searchOrders` import: the guide calls it without
 * defining it, so ./search-orders.ts is self-defined.
 */
import { Component } from "@angular/core";
import { registerFrontendTool } from "@copilotkit/angular";
import { z } from "zod";

import { searchOrders } from "./search-orders";

@Component({
  selector: "app-order-search",
  standalone: true,
  template: "",
})
export class OrderSearchComponent {
  constructor() {
    registerFrontendTool({
      name: "searchOrders",
      description: "Search the signed-in user's orders by status",
      parameters: z.object({
        status: z.enum(["open", "shipped", "delivered"]),
      }),
      handler: async ({ status }) => {
        const orders = await searchOrders(status);
        return JSON.stringify(orders);
      },
      webmcp: {
        annotations: {
          readOnlyHint: true,
        },
      },
    });
  }
}
// webmcp : angular frontend tool end
