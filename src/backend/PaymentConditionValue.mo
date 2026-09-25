/// Implicit instance: `PaymentCondition -> Value`. The variant renders as its
/// tag text so the column is filterable with exact literals.

import OQL "mo:caffeineai-oql";
import Types "types/billing";

module {
  public func _toRow(self : Types.PaymentCondition) : OQL.Value =
    #text(switch self {
      case (#cash) { "cash" };
      case (#credit) { "credit" };
    });
};
