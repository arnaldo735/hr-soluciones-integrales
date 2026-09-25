/// Implicit instance: `MovementKind -> Value`. The variant renders as its
/// tag text so the column is filterable with exact literals.

import OQL "mo:caffeineai-oql";
import Types "types/inventory";

module {
  public func _toRow(self : Types.MovementKind) : OQL.Value =
    #text(switch self {
      case (#sale) { "sale" };
      case (#purchase) { "purchase" };
      case (#adjustment) { "adjustment" };
    });
};
