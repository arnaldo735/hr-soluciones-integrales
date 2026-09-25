import Map "mo:core/Map";

import Common "../types/common";
import Types "../types/technicians";
import WorkshopTypes "../types/workshop";
import TechniciansLib "../lib/technicians";

mixin (
  technicians : Map.Map<Common.Id, Types.Technician>,
  orders : Map.Map<Common.Id, WorkshopTypes.WorkshopOrder>,
  counters : TechniciansLib.Counters,
) {
  func techniciansState() : TechniciansLib.State = { technicians; orders; counters };

  public query func listTechnicians(filter : Types.TechnicianFilter) : async [Types.Technician] {
    ignore filter;
    TechniciansLib.listTechnicians(techniciansState(), filter);
  };

  public query func getTechnician(id : Types.Id) : async ?Types.Technician {
    ignore id;
    TechniciansLib.getTechnician(techniciansState(), id);
  };

  public shared func createTechnician(input : Types.TechnicianInput) : async Types.Technician {
    ignore input;
    TechniciansLib.createTechnician(techniciansState(), input);
  };

  public shared func updateTechnician(id : Types.Id, input : Types.TechnicianInput) : async Types.Technician {
    ignore (id, input);
    TechniciansLib.updateTechnician(techniciansState(), id, input);
  };

  public shared func deleteTechnician(id : Types.Id) : async Bool {
    ignore id;
    TechniciansLib.deleteTechnician(techniciansState(), id);
  };

  public query func listTechnicianWorkload() : async [Types.TechnicianWorkload] {
    TechniciansLib.listWorkload(techniciansState());
  };

  public query func getTechnicianWorkload(technicianId : Types.Id) : async ?Types.TechnicianWorkload {
    ignore technicianId;
    TechniciansLib.getWorkload(techniciansState(), technicianId);
  };

  public query func findTechnicianByCode(code : Text) : async ?Types.Technician {
    ignore code;
    TechniciansLib.findByCode(techniciansState(), code);
  };
};
