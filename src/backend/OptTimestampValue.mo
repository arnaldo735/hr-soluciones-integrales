/// Implicit instance: `?Timestamp -> Value`. `Timestamp` is `Int`, so this is
/// the `?Int` instance and never competes with `OptIdValue`'s `?Nat`. An
/// absent option renders as the `0` sentinel (timestamps are epoch-based, so
/// `0` never collides with a real recorded instant).

import OQL "mo:caffeineai-oql";

module {
  public func _toRow(self : ?Int) : OQL.Value =
    switch self {
      case null { #int(0) };
      case (?t) { #int(t) };
    };
};
