/**
 * Retrieves the currently stored access token to be used for the Authorization header value.
 */
const getAccessToken = () => localStorage.getItem("authorizationToken");

/**
 * Stores the access token to be used for the Authorization header value.
 */
const setAccessToken = async (token) => localStorage.setItem("authorizationToken", token);

/**
 * Removes the access token
 */
const deleteAccessToken = async () => localStorage.removeItem("authorizationToken");

/**
 * Return a value from a given path in an object
 * @param {Object} obj Object to get value from
 * @param {String} path 'path.to.value.in.object'
 * @param {Value} fail=null Fallback value if not found
 * @returns {Value} Value found in object, or fallback
 */
const findInObject = (obj, path, fallback = null) => (obj
  ? path.split(".").reduce((prev, key) => {
    const value = prev ? prev[key] : obj[key];
    return value !== undefined && value !== null ? value : fallback;
  }, undefined)
  : fallback);


/**
 * Helper method for creating a range of numbers
 * range(1, 5) => [1, 2, 3, 4, 5]
 */
const range = (from, to, step = 1) => {
  let i = from;
  const rangeModified = [];

  while (i <= to) {
    rangeModified.push(i);
    i += step;
  }

  return rangeModified;
};

const buildQueryStrings = (data, removeEmpty = true) => {
  // If the data is already a string, return it as-is
  if (typeof (data) === "string") return data;

  // Create a query array to hold the key/value pairs
  const query = [];

  // Loop through the data object
  // eslint-disable-next-line
  for (const key in data) {
    // eslint-disable-next-line no-prototype-builtins
    if (data.hasOwnProperty(key)) {
      // Encode each key and value, concatenate them into a string, and push them to the array
      if (removeEmpty && data[key] !== "") {
        data[key].toString().split(",").forEach((s) => query.push(`${encodeURIComponent(key)}=${encodeURIComponent(s.trim())}`));
      }
    }
  }

  // Join each item in the array with a `&` and return the resulting string
  return query.join("&");
};

/**
 * Debounce
 *
 * @param {*} fn The function to run
 * @param {*} time Amount of time to wait in ms
 */
const debounce = (fn, time) => {
  let timeout;

  // eslint-disable-next-line func-names
  return function (...args) {
    const functionCall = () => fn.apply(this, args);
    clearTimeout(timeout);
    timeout = setTimeout(functionCall, time);
  };
};

/**
 * Build a string with price and currency, e.g "$899" or "99 SEK"
 * @param value     Price
 * @param locale    Locale for currency
 * @param useSymbol true = use $, kr. false = use ISO value (SEK, USD)
 */
const buildCurrencyString = (value, locale, useSymbol = false) => {
  let priceString = `${value}`;
  if (locale) {
    if (useSymbol) {
      const prefix = locale.currencySuffix ? "" : locale.currencySymbol;
      const suffix = locale.currencySuffix ? ` ${locale.currencySymbol}` : "";
      priceString = `${prefix}${priceString}${suffix}`;
    } else {
      priceString = `${priceString} ${locale.currencyIso4217}`;
    }
  }
  return priceString;
};

const findEntityById = (entityId, idFieldName, entities) => {
  if (entities) {
    return entities.find((e) => e[idFieldName] === parseInt(entityId, 10));
  }
  return undefined;
};


export {
  getAccessToken,
  setAccessToken,
  deleteAccessToken,
  findInObject,
  range,
  buildQueryStrings,
  debounce,
  buildCurrencyString,
  findEntityById
};
