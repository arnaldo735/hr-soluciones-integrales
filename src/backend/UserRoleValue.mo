/// Implicit instance: `UserRole -> Value`. The variant renders as its tag
/// text so the column is filterable with exact literals.

import OQL "mo:caffeineai-oql";
import Types "types/common";

module {
  public func _toRow(self : Types.UserRole) : OQL.Value =
    #text(switch self {
      case (#admin) { "admin" };
      case (#user) { "user" };
      case (#guest) { "guest" };
    });
};
