/// Implicit instance: `OrderStatus -> Value`. The variant renders as its
/// tag text so the column is filterable with exact literals.

import OQL "mo:caffeineai-oql";
import Types "types/workshop";

module {
  public func _toRow(self : Types.OrderStatus) : OQL.Value =
    #text(switch self {
      case (#received) { "received" };
      case (#inRepair) { "inRepair" };
      case (#ready) { "ready" };
      case (#delivered) { "delivered" };
      case (#cancelled) { "cancelled" };
    });
};
