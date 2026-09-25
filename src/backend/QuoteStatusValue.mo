/// Implicit instance: `QuoteStatus -> Value`. The variant renders as its
/// tag text so the column is filterable with exact literals.

import OQL "mo:caffeineai-oql";
import Types "types/quotes";

module {
  public func _toRow(self : Types.QuoteStatus) : OQL.Value =
    #text(switch self {
      case (#draft) { "draft" };
      case (#sent) { "sent" };
      case (#accepted) { "accepted" };
      case (#rejected) { "rejected" };
      case (#expired) { "expired" };
    });
};
