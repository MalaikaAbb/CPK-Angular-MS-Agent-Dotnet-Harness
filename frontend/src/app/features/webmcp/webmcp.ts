// webmcp : webmcp only with no agent start
/**
 * "WebMCP only, with no agent", verbatim from
 * https://docs.copilotkit.ai/angular/ms-agent-harness-dotnet/webmcp
 *
 * Registers the tool straight on a CopilotKitCore, with no Runtime and no
 * agent. The instance is created when this module is first imported (the
 * /webmcp/core-demo route) and kept alive for the rest of the page's life, as
 * the guide asks. The only addition is the self-defined `searchOrders` import.
 */
import { CopilotKitCore } from "@copilotkit/core";
import { z } from "zod";

import { searchOrders } from "./search-orders";

export const copilotkit = new CopilotKitCore({
  tools: [
    {
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
    },
  ],
});
// webmcp : webmcp only with no agent end
