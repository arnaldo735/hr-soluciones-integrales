import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;

  public type ServiceCategory = {
    id : Id;
    name : Text;
    description : Text;
    createdAt : Timestamp;
  };

  public type ServiceCategoryInput = {
    name : Text;
    description : Text;
  };

  public type ServiceCategoryFilter = {
    search : ?Text;
  };

  public type ServiceCategoryUsage = {
    category : ServiceCategory;
    serviceCount : Nat;
    activeServiceCount : Nat;
  };

  public type ServiceCategoryError = {
    #notFound : Id;
    #duplicateName : Text;
    #inUse : { categoryId : Id; activeServices : Nat };
    #notAuthorized;
  };
};
