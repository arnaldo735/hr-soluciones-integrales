import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/pos";
import InventoryTypes "../types/inventory";
import CustomerTypes "../types/customers";
import BillingTypes "../types/billing";
import CompanyTypes "../types/company";
import UserTypes "../types/users";
import PosLib "../lib/pos";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  posSales : Map.Map<Common.Id, Types.PosSale>,
  parts : Map.Map<Common.Id, InventoryTypes.Part>,
  lots : Map.Map<Common.Id, InventoryTypes.Lot>,
  movements : Map.Map<Common.Id, InventoryTypes.Movement>,
  customers : Map.Map<Common.Id, CustomerTypes.Customer>,
  invoices : Map.Map<Common.Id, BillingTypes.Invoice>,
  businessSettings : { var settings : BillingTypes.BusinessSettings },
  company : { var profile : CompanyTypes.CompanyProfile },
  counters : PosLib.Counters,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func posState() : PosLib.State = { posSales; parts; lots; movements; customers; invoices; businessSettings; company; counters };

  func requirePosModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "pos")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de punto de venta");
    };
  };

  public query ({ caller }) func listPosSales(token : ?Text, filter : Types.PosSaleFilter, offset : Nat, limit : Nat) : async Types.PosSalePage {
    requirePosModule(caller, token);
    PosLib.listPosSales(posState(), filter, offset, limit);
  };

  public query ({ caller }) func getPosSale(token : ?Text, id : Types.Id) : async ?Types.PosSale {
    requirePosModule(caller, token);
    PosLib.getPosSale(posState(), id);
  };

  // Registra una venta de mostrador. De contado cobra en el acto; a crédito
  // exige un cliente registrado y genera su factura pendiente con el plan de
  // cuotas.
  public shared ({ caller }) func createPosSale(token : ?Text, input : Types.PosSaleInput) : async Types.PosSale {
    requirePosModule(caller, token);
    PosLib.createPosSale(posState(), input, caller);
  };
};
