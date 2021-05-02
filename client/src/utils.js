/* Utility functions used throughout the solution */

/** Flavour value for "Membership fee", used as argument value to specify fee */
export var fee_flavour_membership = "membfee";
/** Flavour value for "Housecard fee", used as argument value to specify fee */
export var fee_flavour_housecard = "housecard";

export function getFeeFlavourName(flavour, upperCaseFirstChar = true) {
    switch (flavour) {
        case fee_flavour_membership:
            return upperCaseFirstChar ? "Membership" : "membership";

        case fee_flavour_housecard:
            return upperCaseFirstChar ? "House card" : "house card";

        default:
            return upperCaseFirstChar ? "(Unknown)" : "(unknown)";
    }
}

/**
 * Local method for parsing a date from an argument of type date or string
 * @param {date|string} date
 */
function parseDate(date) {

    if (date === null || date === undefined)
        return null;

    var _date;

    switch (typeof (date)) {
        case "object":
            _date = date;
            break;

        case "string":
            _date = date ? new Date(date) : null;
            break;

        default:
            console.log(date);
            throw Error("Passed date is of invalid type: " + typeof (date));
    }

    return _date;
}

/**
 * Format a date for output, using Swedish notation YYYY-MM-DD 
 * @param {date|string} date
 */
export function formatDate(date) {

    var _date = parseDate(date);

    if (_date === null)
        return "";

    return new Intl.DateTimeFormat('sv-SE').format(_date);
}

/**
 * For a date (date or string), get the value to use in a form input (YYYY-MM-DD)
 * @param {date|string} date
 */
export function getDateFormValue(date) {

    var _date = parseDate(date);

    if (date === null)
        return "";

    return new Intl.DateTimeFormat('sv-SE').format(_date);
}

/**
 * Format a timestamp (UNIX epoch) for output, using Swedish notation YYYY-MM-DD 
 * @param {date|string} date
 */
export function formatUtcTimestamp(timestamp, includeTime = false) {
    if (timestamp === null)
        return "";

    var _date = new Date(timestamp * 1000);

    if (isNaN(_date))
        return "(Invalid date)";

    var options = {
        dateStyle: "short"
    };

    if (includeTime) {
        options.timeStyle = "short";
    }

    return new Intl.DateTimeFormat('sv-SE', options).format(_date);
}

/**
 * Format a currency (e.g. "100.50 SEK")
 * @param {any} amount
 * @param {any} currency
 * @param {any} alwaysIncludeCents
 */
export function formatCurrency(amount, currency, alwaysIncludeCents = false) {

    if (amount === null || amount === undefined) {
        return "-";
    }

    const includeCents = alwaysIncludeCents || amount !== Math.round(amount);

    const _currency = currency ? currency.toUpperCase() : "";

    var formatter = new Intl.NumberFormat('sv-SE', {
        minimumFractionDigits: includeCents ? 2 : 0,
        maximumFractionDigits: includeCents ? 2 : 0,
    });

    return formatter.format(amount) + " " + _currency;
}

export function getRoleName(role) {
    switch (role) {
        case "admin":
            return "Administrator";

        case "dev":
            return "Developer";

        default:
            return role;
    }
}

export function getAllRoles() {
    return ['admin', 'dev'];
}

export function userHasRole(user, roleName) {
    if (!user || !user.roles)
        return false;

    return user.roles.includes(roleName);
}

export function mayUserEditRole(loggedInUser, userWithRole, roleName) {
    const isSameUser = loggedInUser.user_id == userWithRole.user_id;
    switch (roleName) {
        case "dev":
            return loggedInUser.developer && !isSameUser;

        case "admin":
            return loggedInUser.admin && !isSameUser;

        default:
            return loggedInUser.admin;
    }
}

/**
 * Displays a number of items, using singular or plural version of the name depending on the count.
 * displayNumberOfItems(x, "box", "boxes") => "0 boxes, "1 box", "2 boxes" etc.
 * @param {any} count
 * @param {any} singularName
 * @param {any} pluralName
 */
export function displayNumberOfItems(count, singularName, pluralName) {
    return count.toString() + " " + (count == 1 ? singularName : pluralName);
}