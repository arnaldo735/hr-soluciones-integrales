/// Implicit instance: `PaymentStatus -> Value`. The variant renders as its
/// tag text so the column is filterable with exact literals.

import OQL "mo:caffeineai-oql";
import Types "types/billing";

module {
  public func _toRow(self : Types.PaymentStatus) : OQL.Value =
    #text(switch self {
      case (#pending) { "pending" };
      case (#paid) { "paid" };
    });
};
