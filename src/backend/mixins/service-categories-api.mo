import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";

import Common "../types/common";
import Types "../types/service-categories";
import ServiceTypes "../types/services";
import UserTypes "../types/users";
import ServiceCategoriesLib "../lib/service-categories";
import UsersLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  serviceCategories : Map.Map<Common.Id, Types.ServiceCategory>,
  services : Map.Map<Common.Id, ServiceTypes.Service>,
  counters : ServiceCategoriesLib.Counters,
  credentials : Map.Map<Common.Id, UserTypes.Credential>,
  sessions : Map.Map<Text, UserTypes.Session>,
  roles : Map.Map<Common.Id, UserTypes.Role>,
) {
  func serviceCategoriesState() : ServiceCategoriesLib.State = { categories = serviceCategories; services; counters };

  func requireServiceCategoriesModule(caller : Principal, token : ?Text) {
    if (not UsersLib.canAccessModule({ credentials; sessions; roles }, accessControlState, caller, token, "serviceCategories")) {
      Runtime.trap("Unauthorized: no tiene acceso al módulo de categorías de servicios");
    };
  };

  public query ({ caller }) func listServiceCategories(token : ?Text, filter : Types.ServiceCategoryFilter) : async [Types.ServiceCategoryUsage] {
    requireServiceCategoriesModule(caller, token);
    ServiceCategoriesLib.listCategories(serviceCategoriesState(), filter);
  };

  public query ({ caller }) func getServiceCategory(token : ?Text, id : Types.Id) : async ?Types.ServiceCategory {
    requireServiceCategoriesModule(caller, token);
    ServiceCategoriesLib.getCategory(serviceCategoriesState(), id);
  };

  public shared ({ caller }) func createServiceCategory(token : ?Text, input : Types.ServiceCategoryInput) : async Types.ServiceCategory {
    requireServiceCategoriesModule(caller, token);
    ServiceCategoriesLib.createCategory(serviceCategoriesState(), input);
  };

  public shared ({ caller }) func updateServiceCategory(token : ?Text, id : Types.Id, input : Types.ServiceCategoryInput) : async Types.ServiceCategory {
    requireServiceCategoriesModule(caller, token);
    ServiceCategoriesLib.updateCategory(serviceCategoriesState(), id, input);
  };

  public shared ({ caller }) func deleteServiceCategory(token : ?Text, id : Types.Id) : async Bool {
    requireServiceCategoriesModule(caller, token);
    ServiceCategoriesLib.deleteCategory(serviceCategoriesState(), id);
  };
};
