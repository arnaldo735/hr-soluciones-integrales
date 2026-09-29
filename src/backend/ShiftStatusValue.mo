/// Implicit instance: `ShiftStatus -> Value`. The variant renders as its tag
/// text so the column is filterable with exact literals.

import OQL "mo:caffeineai-oql";
import Types "types/cash";

module {
  public func _toRow(self : Types.ShiftStatus) : OQL.Value =
    #text(switch self {
      case (#open) { "open" };
      case (#closed) { "closed" };
    });
};
