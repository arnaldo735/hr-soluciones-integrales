/// Implicit instance: `AppointmentStatus -> Value`. The variant renders as its
/// tag text so the column is filterable with exact literals.

import OQL "mo:caffeineai-oql";
import Types "types/appointments";

module {
  public func _toRow(self : Types.AppointmentStatus) : OQL.Value =
    #text(switch self {
      case (#scheduled) { "scheduled" };
      case (#confirmed) { "confirmed" };
      case (#attended) { "attended" };
      case (#cancelled) { "cancelled" };
      case (#noShow) { "noShow" };
    });
};
