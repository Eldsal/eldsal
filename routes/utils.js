
/*
 * Common functions
 */

module.exports = {
    /** Flavour value for "Membership fee", used as argument value to specify fee */
    fee_flavour_membership: "membfee",
    /** Flavour value for "Housecard fee", used as argument value to specify fee */
    fee_flavour_housecard: "housecard",

    /** Compare strings alphabetically */
    stringCompare: (a, b) => {
        var nameA = a == null ? "" : a.toUpperCase(); // ignore upper and lowercase
        var nameB = b == null ? "" : b.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        // names must be equal
        return 0;
    },

    /** Compare numbers, to be used in Array.sort */
    numericCompare: (a, b, ascending = true) => {
        if (a < b) {
            return ascending ? -1 : 1;
        }
        if (a > b) {
            return ascending ? 1 : -1;
        }
        // Values are equal
        return 0;
    },

    /** Get a date string in the format "YYYY-MM-DD" */
    getDateString: (date) => {
        if (date) {
            return new Intl.DateTimeFormat('sv-SE').format(date);
        }
        else {
            return "";
        }
    },

    /** Get a "normalized" amount, i.e. the amount per year or per month, based on a the amount paid for a number of years or months */
    getNormalizedAmount: (normalizedInterval, amount, interval, intervalCount) => {
        if (amount === 0) {
            return 0;
        }
        else if (amount > 0 && intervalCount > 0) {

            if (interval == "year" && normalizedInterval == "month") {
                normalizedAmount = amount / 12 / intervalCount;
            }
            else if (interval == "month" && normalizedInterval == "year") {
                normalizedAmount = amount * 12 / intervalCount;
            }
            else {
                normalizedAmount = amount / intervalCount;
            }
            return Math.round(normalizedAmount * 100) / 100; // Round to two decimals
        }
        else {
            return null;
        }
    },

    getRoleName: (role) => {
        switch (role) {
            case "admin":
                return "Administrator";

            case "dev":
                return "Developer";

            default:
                return role;
        }
    }
}