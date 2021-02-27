/* Utility functions used throughout the solution */

/**
 * Local method for parsing a date from an argument of type date or string
 * @param {date|string} date
 */
function parseDate(date) {

    if (date === null)
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
export function formatUtcTimestamp(timestamp) {
    if (timestamp === null)
        return "";

    var _date = new Date(timestamp * 1000);

    if (isNaN(_date))
        return "(Invalid date)";

    return new Intl.DateTimeFormat('sv-SE').format(_date);
}