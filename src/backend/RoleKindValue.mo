/// Implicit instance: `RoleKind -> Value`. The variant renders as its tag
/// text so the column is filterable with exact literals.

import OQL "mo:caffeineai-oql";
import Types "types/users";

module {
  public func _toRow(self : Types.RoleKind) : OQL.Value =
    #text(switch self {
      case (#builtin) { "builtin" };
      case (#custom) { "custom" };
    });
};
