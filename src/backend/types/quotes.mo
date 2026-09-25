import Common "common";

module {
  public type Id = Common.Id;
  public type Timestamp = Common.Timestamp;
  public type Money = Common.Money;
  public type TaxRate = Common.TaxRate;

  public type QuoteStatus = { #draft; #sent; #accepted; #rejected; #expired };

  public type QuotePartLine = {
    id : Id;
    partId : Id;
    description : Text;
    quantity : Nat;
    unitPrice : Money;
  };

  public type QuoteServiceLine = {
    id : Id;
    serviceId : ?Id;
    description : Text;
    quantity : Nat;
    unitPrice : Money;
  };

  public type Quote = {
    id : Id;
    quoteNumber : Text;
    customerId : Id;
    motorcycleId : Id;
    status : QuoteStatus;
    partLines : [QuotePartLine];
    serviceLines : [QuoteServiceLine];
    discount : Money;
    taxRate : TaxRate;
    notes : ?Text;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  public type QuoteTotals = {
    partsSubtotal : Money;
    servicesSubtotal : Money;
    subtotal : Money;
    discount : Money;
    taxableBase : Money;
    taxRate : TaxRate;
    tax : Money;
    total : Money;
  };

  public type QuoteView = {
    quote : Quote;
    totals : QuoteTotals;
  };

  public type QuotePartLineInput = {
    partId : Id;
    quantity : Nat;
    unitPrice : Money;
  };

  public type QuoteServiceLineInput = {
    serviceId : ?Id;
    description : Text;
    quantity : Nat;
    unitPrice : Money;
  };

  public type QuoteInput = {
    customerId : Id;
    motorcycleId : Id;
    partLines : [QuotePartLineInput];
    serviceLines : [QuoteServiceLineInput];
    discount : Money;
    notes : ?Text;
  };

  public type QuoteFilter = {
    search : ?Text;
    status : ?QuoteStatus;
  };

  public type QuoteSort = { #number; #customer; #createdAt; #total };

  public type QuotePage = {
    items : [QuoteView];
    total : Nat;
    offset : Nat;
    limit : Nat;
  };

  public type QuoteError = {
    #notFound : Id;
    #invalidTransition : { from : QuoteStatus; to : QuoteStatus };
    #notConvertible : QuoteStatus;
    #notAuthorized;
  };
};
