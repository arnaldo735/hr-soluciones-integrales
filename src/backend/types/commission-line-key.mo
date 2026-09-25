import Common "common";
import Nat "mo:core/Nat";
import Order "mo:core/Order";

/// Clave estable de una línea de mano de obra ya pagada: `orderId` + `laborId`.
/// Se usa para no pagar dos veces la misma línea. Vive en su propio archivo
/// para que el módulo `CommissionLineKey` (con `compare`) sea un import de
/// nivel superior y el argumento implícito de `Set.Set<CommissionLineKey>`
/// resuelva.
module {
  public type CommissionLineKey = {
    orderId : Common.Id;
    laborId : Common.Id;
  };

  public func compare(a : CommissionLineKey, b : CommissionLineKey) : Order.Order {
    switch (Nat.compare(a.orderId, b.orderId)) {
      case (#equal) { Nat.compare(a.laborId, b.laborId) };
      case (other) { other };
    };
  };
};
