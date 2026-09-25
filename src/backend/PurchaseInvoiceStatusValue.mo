/// Implicit instance: `PurchaseInvoiceStatus -> Value`. The variant renders as
/// its tag text so the column is filterable with exact literals.

import OQL "mo:caffeineai-oql";
import Types "types/purchase-invoice-intake";

module {
  public func _toRow(self : Types.PurchaseInvoiceStatus) : OQL.Value =
    #text(switch self {
      case (#pending) { "pending" };
      case (#confirmed) { "confirmed" };
      case (#withErrors) { "withErrors" };
    });
};
