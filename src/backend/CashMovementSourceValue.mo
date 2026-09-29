/// Implicit instance: `CashMovementSource -> Value`. The variant renders as
/// its tag text so the column is filterable with exact literals.

import OQL "mo:caffeineai-oql";
import Types "types/cash";

module {
  public func _toRow(self : Types.CashMovementSource) : OQL.Value =
    #text(switch self {
      case (#manual) { "manual" };
      case (#invoice) { "invoice" };
      case (#receivable) { "receivable" };
      case (#purchase) { "purchase" };
      case (#expense) { "expense" };
      case (#commission) { "commission" };
      case (#pos) { "pos" };
      case (#other) { "other" };
    });
};
