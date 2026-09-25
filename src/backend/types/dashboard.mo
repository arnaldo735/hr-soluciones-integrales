import Common "common";
import Inventory "inventory";

module {
  public type Id = Common.Id;
  public type Money = Common.Money;

  public type LowStockItem = {
    partId : Id;
    sku : Text;
    name : Text;
    totalStock : Nat;
    lowStockThreshold : Nat;
  };

  public type OrderStatusCount = {
    status : Text;
    count : Nat;
  };

  public type DashboardSummary = {
    lowStock : [LowStockItem];
    activeOrders : [OrderStatusCount];
    pendingPayablesTotal : Money;
    pendingPayablesCount : Nat;
  };
};
