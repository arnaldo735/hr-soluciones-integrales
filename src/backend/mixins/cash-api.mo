import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/cash";
import UserTypes "../types/users";
import CashLib "../lib/cash";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  shifts : Map.Map<Common.Id, Types.Shift>,
  cashMovements : Map.Map<Common.Id, Types.CashMovement>,
  counters : CashLib.Counters,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func cashState() : CashLib.State = { shifts; cashMovements; counters };

  func requireCashModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "cash")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de caja y bancos");
    };
  };

  // Abre un turno de caja con los saldos iniciales declarados.
  public shared ({ caller }) func openShift(token : ?Text, input : Types.OpenShiftInput) : async Types.Shift {
    requireCashModule(caller, token);
    CashLib.openShift(cashState(), input, caller);
  };

  // Cierra un turno de caja con los saldos finales declarados.
  public shared ({ caller }) func closeShift(token : ?Text, id : Types.Id, input : Types.CloseShiftInput) : async Types.Shift {
    requireCashModule(caller, token);
    CashLib.closeShift(cashState(), id, input, caller);
  };

  // Lista turnos paginados.
  public query ({ caller }) func listShifts(token : ?Text, filter : Types.ShiftFilter, offset : Nat, limit : Nat) : async Types.ShiftPage {
    requireCashModule(caller, token);
    CashLib.listShifts(cashState(), filter, offset, limit);
  };

  // Devuelve un turno por id.
  public query ({ caller }) func getShift(token : ?Text, id : Types.Id) : async ?Types.Shift {
    requireCashModule(caller, token);
    CashLib.getShift(cashState(), id);
  };

  // Devuelve el turno abierto actual, o null si no hay ninguno.
  public query ({ caller }) func getOpenShift(token : ?Text) : async ?Types.Shift {
    requireCashModule(caller, token);
    CashLib.getOpenShift(cashState());
  };

  // Registra un movimiento de ingreso o egreso en el turno abierto.
  public shared ({ caller }) func registerCashMovement(token : ?Text, input : Types.CashMovementInput) : async Types.CashMovement {
    requireCashModule(caller, token);
    CashLib.registerCashMovement(cashState(), input, caller);
  };

  // Lista movimientos de tesorería paginados.
  public query ({ caller }) func listCashMovements(token : ?Text, filter : Types.CashMovementFilter, offset : Nat, limit : Nat) : async Types.CashMovementPage {
    requireCashModule(caller, token);
    CashLib.listCashMovements(cashState(), filter, offset, limit);
  };

  // Informe diario de un turno.
  public query ({ caller }) func getDailyShiftReport(token : ?Text, shiftId : Types.Id) : async Types.DailyShiftReport {
    requireCashModule(caller, token);
    CashLib.getDailyShiftReport(cashState(), shiftId);
  };
};
