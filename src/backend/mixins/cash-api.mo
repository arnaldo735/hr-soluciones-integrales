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
  cashRegisters : Map.Map<Common.Id, Types.CashRegister>,
  shifts : Map.Map<Common.Id, Types.Shift>,
  cashMovements : Map.Map<Common.Id, Types.CashMovement>,
  counters : CashLib.Counters,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func cashState() : CashLib.State = { cashRegisters; shifts; cashMovements; counters };

  func requireCashModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "cash")) {
      Runtime.trap("No autorizado para el módulo de Caja y Bancos");
    };
  };

  // ── Catálogo de cajas y bancos ──────────────────────────────────────────

  // Crea una caja o banco con nombre, tipo y saldo inicial.
  public shared ({ caller }) func createCashRegister(token : ?Text, input : Types.CashRegisterInput) : async Types.CashRegister {
    requireCashModule(caller, token);
    CashLib.createCashRegister(cashState(), input);
  };

  // Edita nombre, tipo y saldo inicial de una caja o banco.
  public shared ({ caller }) func updateCashRegister(token : ?Text, id : Types.Id, input : Types.CashRegisterInput) : async Types.CashRegister {
    requireCashModule(caller, token);
    CashLib.updateCashRegister(cashState(), id, input);
  };

  // Activa o desactiva una caja o banco.
  public shared ({ caller }) func setCashRegisterActive(token : ?Text, id : Types.Id, active : Bool) : async Types.CashRegister {
    requireCashModule(caller, token);
    CashLib.setCashRegisterActive(cashState(), id, active);
  };

  // Elimina una caja o banco; se bloquea si tiene un turno abierto.
  public shared ({ caller }) func deleteCashRegister(token : ?Text, id : Types.Id) : async () {
    requireCashModule(caller, token);
    CashLib.deleteCashRegister(cashState(), id);
  };

  // Lista el catálogo de cajas y bancos, paginado.
  public query ({ caller }) func listCashRegisters(token : ?Text, filter : Types.CashRegisterFilter, offset : Nat, limit : Nat) : async Types.CashRegisterPage {
    requireCashModule(caller, token);
    CashLib.listCashRegisters(cashState(), filter, offset, limit);
  };

  // Devuelve una caja o banco por id.
  public query ({ caller }) func getCashRegister(token : ?Text, id : Types.Id) : async ?Types.CashRegister {
    requireCashModule(caller, token);
    CashLib.getCashRegister(cashState(), id);
  };

  // ── Turnos ──────────────────────────────────────────────────────────────

  // Abre un turno en la caja o banco elegido, con responsable y saldo inicial.
  public shared ({ caller }) func openShift(token : ?Text, input : Types.OpenShiftInput) : async Types.Shift {
    requireCashModule(caller, token);
    CashLib.openShift(cashState(), input, caller);
  };

  // Cierra un turno concreto con los saldos finales declarados.
  public shared ({ caller }) func closeShift(token : ?Text, id : Types.Id, input : Types.CloseShiftInput) : async Types.Shift {
    requireCashModule(caller, token);
    CashLib.closeShift(cashState(), id, input, caller);
  };

  // Cambia el responsable de un turno abierto.
  public shared ({ caller }) func setShiftResponsible(token : ?Text, id : Types.Id, responsibleName : Text, responsibleUserId : ?Types.Id) : async Types.Shift {
    requireCashModule(caller, token);
    CashLib.setShiftResponsible(cashState(), id, responsibleName, responsibleUserId);
  };

  // Lista turnos paginados, filtrables por caja/banco, responsable, estado y fechas.
  public query ({ caller }) func listShifts(token : ?Text, filter : Types.ShiftFilter, offset : Nat, limit : Nat) : async Types.ShiftPage {
    requireCashModule(caller, token);
    CashLib.listShifts(cashState(), filter, offset, limit);
  };

  // Devuelve un turno por id.
  public query ({ caller }) func getShift(token : ?Text, id : Types.Id) : async ?Types.Shift {
    requireCashModule(caller, token);
    CashLib.getShift(cashState(), id);
  };

  // Devuelve el turno abierto de una caja/banco, o null si no tiene ninguno.
  public query ({ caller }) func getOpenShift(token : ?Text, registerId : Types.Id) : async ?Types.Shift {
    requireCashModule(caller, token);
    CashLib.getOpenShift(cashState(), registerId);
  };

  // Devuelve todos los turnos abiertos, con su caja/banco y responsable.
  public query ({ caller }) func listOpenShifts(token : ?Text) : async [Types.Shift] {
    requireCashModule(caller, token);
    CashLib.listOpenShifts(cashState());
  };

  // ── Movimientos ─────────────────────────────────────────────────────────

  // Registra un movimiento de ingreso o egreso en un turno abierto concreto.
  public shared ({ caller }) func registerCashMovement(token : ?Text, input : Types.CashMovementInput) : async Types.CashMovement {
    requireCashModule(caller, token);
    CashLib.registerCashMovement(cashState(), input, caller);
  };

  // Lista movimientos de tesorería paginados, filtrables por caja/banco.
  public query ({ caller }) func listCashMovements(token : ?Text, filter : Types.CashMovementFilter, offset : Nat, limit : Nat) : async Types.CashMovementPage {
    requireCashModule(caller, token);
    CashLib.listCashMovements(cashState(), filter, offset, limit);
  };

  // Informe diario de un turno, con nombre de caja/banco y responsable.
  public query ({ caller }) func getDailyShiftReport(token : ?Text, shiftId : Types.Id) : async Types.DailyShiftReport {
    requireCashModule(caller, token);
    CashLib.getDailyShiftReport(cashState(), shiftId);
  };
};
