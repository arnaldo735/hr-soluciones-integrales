/// Implicit instance: `?Nat -> Value`. An absent option renders as the
/// `0` sentinel (ids are 1-based, so `0` never collides with a real id).

import OQL "mo:caffeineai-oql";

module {
  public func _toRow(self : ?Nat) : OQL.Value =
    switch self {
      case null { #nat(0) };
      case (?n) { #nat(n) };
    };
};
