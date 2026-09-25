import Map "mo:core/Map";

import Common "../types/common";
import Types "../types/dashboard";
import InventoryTypes "../types/inventory";
import WorkshopTypes "../types/workshop";
import PurchasingTypes "../types/purchasing";

module {
  public type State = {
    parts : Map.Map<Common.Id, InventoryTypes.Part>;
    lots : Map.Map<Common.Id, InventoryTypes.Lot>;
    orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>;
    purchases : Map.Map<Common.Id, PurchasingTypes.Purchase>;
    payments : Map.Map<Common.Id, PurchasingTypes.Payment>;
  };

  func totalStockFor(lots : Map.Map<Common.Id, InventoryTypes.Lot>, partId : Common.Id) : Nat {
    lots.values().foldLeft(0, func(acc, lot) = if (lot.partId == partId) { acc + lot.quantity } else { acc });
  };

  func statusLabel(status : WorkshopTypes.OrderStatus) : Text {
    switch (status) {
      case (#received) { "received" };
      case (#inRepair) { "inRepair" };
      case (#ready) { "ready" };
      case (#delivered) { "delivered" };
      case (#cancelled) { "cancelled" };
    };
  };

  public func getDashboardSummary(state : State) : Types.DashboardSummary {
    let lowStock = state.parts.values().filterMap(
      func(part) {
        let stock = totalStockFor(state.lots, part.id);
        if (stock < part.lowStockThreshold) {
          ?{
            partId = part.id;
            sku = part.sku;
            name = part.name;
            totalStock = stock;
            lowStockThreshold = part.lowStockThreshold;
          };
        } else {
          null;
        };
      }
    ).toArray();

    let activeOrders = state.orders.values().filterMap(
      func(order) {
        switch (order.status) {
          case (#delivered) { null };
          case (_) { ?statusLabel(order.status) };
        };
      }
    ).toArray();

    let statuses = ["received", "inRepair", "ready"];
    let activeOrderCounts = statuses.map(
      func(statusName) {
        let count = activeOrders.foldLeft(0, func(acc, s) = if (s == statusName) { acc + 1 } else { acc });
        { status = statusName; count };
      }
    );

    let totalPurchased = state.purchases.values().foldLeft(0, func(acc, p) = acc + p.total);
    let totalPaid = state.payments.values().foldLeft(0, func(acc, p) = acc + p.amount);
    let pendingPayablesTotal = if (totalPurchased > totalPaid) { totalPurchased - totalPaid } else { 0 };

    {
      lowStock;
      activeOrders = activeOrderCounts;
      pendingPayablesTotal;
      pendingPayablesCount = if (pendingPayablesTotal > 0) { 1 } else { 0 };
    };
  };
};
