/**
 * SELF-DEFINED — not from the docs.
 *
 * https://docs.copilotkit.ai/angular/ms-agent-harness-dotnet/webmcp calls
 * `searchOrders(status)` in both of its examples but never defines it. This is
 * a stand-in with fixed in-memory orders so the handler has something real to
 * return. A real app would call its own orders API here, and enforce
 * authentication and authorization there — WebMCP annotations are hints, not
 * security controls.
 */
export type OrderStatus = "open" | "shipped" | "delivered";

export interface Order {
  id: string;
  item: string;
  status: OrderStatus;
}

const ORDERS: readonly Order[] = [
  { id: "ord-1001", item: "Mechanical keyboard", status: "open" },
  { id: "ord-1002", item: "USB-C dock", status: "shipped" },
  { id: "ord-1003", item: "27-inch monitor", status: "delivered" },
  { id: "ord-1004", item: "Desk lamp", status: "open" },
];

export async function searchOrders(status: OrderStatus): Promise<Order[]> {
  return ORDERS.filter((order) => order.status === status);
}
