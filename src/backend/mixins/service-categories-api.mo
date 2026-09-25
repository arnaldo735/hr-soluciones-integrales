import Map "mo:core/Map";

import Common "../types/common";
import Types "../types/service-categories";
import ServiceTypes "../types/services";
import ServiceCategoriesLib "../lib/service-categories";

mixin (
  serviceCategories : Map.Map<Common.Id, Types.ServiceCategory>,
  services : Map.Map<Common.Id, ServiceTypes.Service>,
  counters : ServiceCategoriesLib.Counters,
) {
  func serviceCategoriesState() : ServiceCategoriesLib.State = { categories = serviceCategories; services; counters };

  public query func listServiceCategories(filter : Types.ServiceCategoryFilter) : async [Types.ServiceCategoryUsage] {
    ServiceCategoriesLib.listCategories(serviceCategoriesState(), filter);
  };

  public query func getServiceCategory(id : Types.Id) : async ?Types.ServiceCategory {
    ServiceCategoriesLib.getCategory(serviceCategoriesState(), id);
  };

  public shared func createServiceCategory(input : Types.ServiceCategoryInput) : async Types.ServiceCategory {
    ServiceCategoriesLib.createCategory(serviceCategoriesState(), input);
  };

  public shared func updateServiceCategory(id : Types.Id, input : Types.ServiceCategoryInput) : async Types.ServiceCategory {
    ServiceCategoriesLib.updateCategory(serviceCategoriesState(), id, input);
  };

  public shared func deleteServiceCategory(id : Types.Id) : async Bool {
    ServiceCategoriesLib.deleteCategory(serviceCategoriesState(), id);
  };
};
