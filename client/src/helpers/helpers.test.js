import * as helpers from ".";

describe("token", () => {
  it("handles token", async () => {
    expect(helpers.getAccessToken()).toEqual(null);
    await helpers.setAccessToken("myToken");
    expect(helpers.getAccessToken()).toEqual("myToken");
    await helpers.deleteAccessToken();
    expect(helpers.getAccessToken()).toEqual(null);
  });
});

describe("findInObject", () => {
  const myObject = {
    this: {
      is: {
        nested: "You found me"
      }
    }
  };
  it("returns found value", () => {
    expect(helpers.findInObject(myObject, "this.is.nested")).toEqual("You found me");
  });
  it("returns undefined if not found", () => {
    expect(helpers.findInObject(myObject, "this.is.nested.shit")).toEqual(null);
  });
  it("returns fallback if not found", () => {
    expect(helpers.findInObject(myObject, "not.found", "fallback")).toEqual("fallback");
  });
});

describe("findEntityById", () => {
  const entities = [
    { idField: 1, name: "First" },
    { idField: 2, name: "Second" }
  ];
  it("given undefined entities, return undefined", () => {
    expect(helpers.findEntityById(2, "idField", undefined)).toBeUndefined();
  });
  it("given id for valid entity, it is returned", () => {
    expect(helpers.findEntityById(2, "idField", entities).name).toEqual("Second");
  });
  it("given id as string for valid entity, it is returned", () => {
    expect(helpers.findEntityById("2", "idField", entities).name).toEqual("Second");
  });
});

describe("buildCurrencyString", () => {
  const localeNo = { currencyIso4217: "NOK", currencySuffix: true, currencySymbol: "kr" };
  const localeUs = { currencyIso4217: "USD", currencySuffix: false, currencySymbol: "$" };
  it("given undefined locale, return price with no currency string", () => {
    expect(helpers.buildCurrencyString("100", undefined)).toEqual("100");
  });

  it("given Norwegian locale, return price with NOK string", () => {
    expect(helpers.buildCurrencyString("100", localeNo)).toEqual("100 NOK");
  });

  it("given Norwegian locale and useSymbol, return price with kr appended", () => {
    expect(helpers.buildCurrencyString("100", localeNo, true)).toEqual("100 kr");
  });

  it("given US locale and useSymbol, return price with $ prepended", () => {
    expect(helpers.buildCurrencyString("100", localeUs, true)).toEqual("$100");
  });
});
