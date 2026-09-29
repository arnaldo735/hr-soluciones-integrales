/// Implicit instance: `CashMovementKind -> Value`. The variant renders as its
/// tag text so the column is filterable with exact literals.

import OQL "mo:caffeineai-oql";
import Types "types/cash";

module {
  public func _toRow(self : Types.CashMovementKind) : OQL.Value =
    #text(switch self {
      case (#income) { "income" };
      case (#expense) { "expense" };
    });
};
