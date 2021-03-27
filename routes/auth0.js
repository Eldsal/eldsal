const { AuthenticationClient, ManagementClient } = require('auth0');
const { Parser } = require('json2csv');
const utils = require("./utils");

const { stringCompare, getDateString, getNormalizedAmount } = utils;

/*
 * Auth0 methods
 */

/** A user object suitable to send to the client */
class UserClientObject {
    constructor(user, includePayments = true) {
        this.user_id = user.user_id;
        this.picture = user.picture;
        this.name = user.name;
        this.given_name = user.given_name;
        this.family_name = user.family_name;
        this.email = user.email;

        if (!this.name && (this.given_name || this.family_name)) {
            this.name = this.given_name + " " + this.family_name;
        }

        if (user.user_metadata) {
            this.birth_date = user.user_metadata.birth_date;
            this.phone_number = user.user_metadata.phone_number;
            this.address_line_1 = user.user_metadata.address_line_1;
            this.address_line_2 = user.user_metadata.address_line_2;
            this.postal_code = user.user_metadata.postal_code;
            this.city = user.user_metadata.city;
            this.country = user.user_metadata.country;
        }
        else {
            this.birth_date = null;
            this.phone_number = null;
            this.address_line_1 = null;
            this.address_line_2 = null;
            this.postal_code = null;
            this.city = null;
            this.country = null;
        }

        if (user.app_metadata) {
            this.roles = user.app_metadata.roles;
        }
        else {
            this.roles = null;
        }

        this.admin = userHasRole(user, "admin");
        this.developer = userHasRole(user, "dev");

        if (includePayments) {
            this.payments = {
                membership: getUserAppMetaDataFee(user, "membfee_payment", "year"),
                housecard: getUserAppMetaDataFee(user, "housecard_payment", "month")
            };
        }
    }
}

class UserPaymentProperty {
    constructor(payed,
        periodStart,
        periodEnd,
        interval,
        intervalCount,
        method,
        amount,
        currency,
        error = false,
        errorMessage = null) {
        this.payed = payed;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.interval = interval;
        this.intervalCount = intervalCount;
        this.method = method;
        this.amount = amount;
        this.currency = currency ? currency.toUpperCase() : "SEK";
        this.error = error;
        this.errorMessage = errorMessage;

        // Normalized amounts are set using setNormalizedAmount
        this.normalizedAmount = null;
        this.normalizedInterval = null;

        if (method) {
            switch (method) {
                case "manual":
                    this.methodName = "Manual";
                    break;

                case "stripe":
                    this.methodName = "Stripe";
                    break;

                default:
                    this.methodName = "(unknown: " + method + ")";
                    break;
            }

        }
        else {
            this.methodName = "(none)";
        }
    }

    /**
     * Set a normalized per month, i.e. the amount per year or month
     * @param {any} normalizedInterval "year" or "month"
     */
    setNormalizedAmount(normalizedInterval) {
        // Normalize amount
        this.normalizedInterval = normalizedInterval;
        this.normalizedAmount = getNormalizedAmount(normalizedInterval, this.amount, this.interval, this.intervalCount);
    }

    /**
     * If this payment is equal to another payment object. Used to check if a payment property should be updated
     * @param {any} payment
     */
    isEqualTo(payment) {
        if (payment === null)
            return false;

        if (this.error || payment.error) {
            return this.error === payment.error
                && this.errorMessage === payment.errorMessage;
        }

        return this.payed === payment.payed
            && this.periodStart === payment.periodStart
            && this.periodEnd === payment.periodEnd
            && this.interval === payment.interval
            && this.intervalCount === payment.intervalCount
            && this.method === payment.method
            && this.amount === payment.amount;
    }

    getPaymentSaveArguments() {
        return new PaymentSaveArguments(this.method, this.periodStart, this.periodEnd, this.interval, this.intervalCount, this.amount, this.currency);
    }
}

/** Arguments for saving a payment for a user */
class PaymentSaveArguments {
    constructor(method, periodStart, periodEnd, interval, intervalCount, amount, currency) {
        this.method = method;
        this.period_start = periodStart;
        this.period_end = periodEnd;
        this.interval = interval;
        this.interval_count = intervalCount;
        this.amount = amount;
        this.currency = currency ? currency.toUpperCase() : null;
    }
}

const getManagementClient = () => {
    return new ManagementClient({
        domain: process.env.AUTH0_MGT_DOMAIN,
        clientId: process.env.AUTH0_MGT_CLIENT_ID,
        clientSecret: process.env.AUTH0_MGT_CLIENT_SECRET,
        scope: 'read:users update:users'
    });
}

/**
 * Get a user and return it as a UserClientObject
 * @param {number} userId
 * @param {boolean} includePayments - If payments should be included in the client object
 */
const getUser = async (userId, includePayments = true) => {
    return getAuth0User(userId)
        .then(function (user) {
            return getUserClientObject(user, includePayments);
        })
}

/**
 * Get a user and return it as an Auth0 user object
 * @param {number} userId
 */
const getAuth0User = async (userId) => {
    const params = { id: userId };

    return getManagementClient()
        .getUser(params);
}

/**
 * Check if a user has a specific role.
 * The roles are read from the "roles" property in the users "app_metadata" collection in Auth0.
 * Multiple roles are separated by comma
 * @param {any} user Auth0 user object
 * @param {any} roleName
 */
const userHasRole = (user, roleName) => {

    if (user && user.app_metadata) {
        const roles = user.app_metadata.roles;

        if (!roles)
            return false;

        return roles.replace(/ /g, "").split(",").includes(roleName);
    }
    else {
        return false;
    }
}

/**
 * If the user belongs to the current user "connection", i.e. the Auth0 database corresponding to the current environment (specified in the AUTH0_USER_CONNECTION environment variable)
 * @param {any} user Auth0 user object
 */
const isUserInCurrentConnection = (user) => {
    if (user.identities) {
        return user.identities.filter(identity => identity.provider = "auth0" && identity.connection == process.env.AUTH0_USER_CONNECTION).length > 0;
    }
    else {
        return false;
    }
}

/**
 * Given an Auth0 user, make a UserClientObject object to pass to client
 * @param {any} user
 */
const getUserClientObject = (user, includePayments = true) => {
    return new UserClientObject(user, includePayments);
}

/**
 * Get a property object containing payment information (based on properties set in a user's app_metadata object).
 * The result object has this structure:
 * {
 *  payed: boolean,
 *  periodStart: date,
 *  periodEnd: date,
 *  interval: string ("month" or "year"),
 *  intervalCount: number (number of months or years)
 *  method: string ("manual" or "stripe"),
 *  methodName: string (e.g "Stripe"),
 *  amount: number,
 *  currency: number,
 *  normalizedAmount: number,
 *  normalizedInterval: string ("month" or "year"),
 *  error: boolean,
 *  errorMessage: string
 * }
 * @param {Auth0User} user
 * @param {string} payedUntilProperty
 * @param {string} methodProperty
 * @param {string} amountProperty
 * @param {string} amountPeriodProperty
 */
const getUserAppMetaDataFee = (user, paymentProperty, normalizedInterval) => {

    var hasPayed = false;
    var periodStart = null; // String, no time
    var periodEnd = null; // String, no time
    var interval = null; // String, no time
    var intervalCount = null; // String, no time
    var method = "";
    var amount = null;
    var currency = null;
    var isError = false;
    var errorMessage = null;

    var payment = user.app_metadata && user.app_metadata[paymentProperty] ? user.app_metadata[paymentProperty] : null;

    if (payment) {
        periodStart = payment["period_start"];
        periodEnd = payment["period_end"];

        if (periodStart) {

            interval = payment["interval"];
            intervalCount = parseInt(payment["interval_count"]);
            currency = payment["currency"];
            amount = parseInt(payment["amount"]);
            method = payment["method"];

            var periodStartDate = new Date(periodStart);
            var periodEndDate = new Date(periodEnd);

            if (!periodStartDate || isNaN(periodStartDate.getTime())) {
                hasPayed = false;
                isError = true;
                errorMessage = 'The stored period start date has an invalid format';
            }
            else if (!periodEndDate || isNaN(periodEndDate.getTime())) {
                hasPayed = false;
                isError = true;
                errorMessage = 'The stored period end date has an invalid format';
            }
            else if (interval != "year" && interval != "month") {
                hasPayed = false;
                isError = true;
                errorMessage = 'The stored interval has an invalid format';
            }
            else if (isNaN(intervalCount) || intervalCount <= 0) {
                hasPayed = false;
                isError = true;
                errorMessage = 'The stored interval count has an invalid format';
            }
            else if (isNaN(amount) || amount < 0) {
                hasPayed = false;
                isError = true;
                errorMessage = 'The stored amount has an invalid format';
            }
            else if (!currency) {
                hasPayed = false;
                isError = true;
                errorMessage = 'No currency is stored';
            }
            else {

                var now = new Date();
                var today = new Date(now.getUTCFullYear(), now.getMonth(), now.getDate()); // Get current date, without time

                hasPayed = periodEndDate >= today;

                // Normalize amount
                normalizedAmount = getNormalizedAmount(normalizedInterval, amount, interval, intervalCount);

                if (method) {
                    switch (method) {
                        case "manual":
                            methodName = "Manual";
                            break;

                        case "stripe":
                            methodName = "Stripe";
                            break;

                        default:
                            methodName = "(unknown: " + method + ")";
                            break;
                    }

                }
                else {
                    methodName = "(none)";
                }
            }
        }
        else {
            periodStart = null;
        }
    }

    var prop = new UserPaymentProperty(hasPayed, periodStart, periodEnd, interval, intervalCount, method, amount, currency, isError, errorMessage);
    prop.setNormalizedAmount(normalizedInterval);

    return prop;
}

/** Get all users as client objects (in the current connection) */
const getUsers = async () => {
    return getManagementClient()
        .getUsers()
        .then(users => {
            // Filter out only users from the connection specified in the env file
            return users.filter(user => isUserInCurrentConnection(user)).map(user => getUserClientObject(user)).sort((a, b) => stringCompare(a.name, b.name));
        })
}

/** Get all users as Auth0 objects (in the current connection) */
const getAuth0Users = async () => {
    return getManagementClient()
        .getUsers()
        .then(users => {
            // Filter out only users from the connection specified in the env file
            return users.filter(user => isUserInCurrentConnection(user));
        })
}

/**
 * Update a user's profile information
 * @param {any} userId
 * @param {any} req - The request (reading information from the request body)
 */
const updateUserProfile = async (userId, req) => {

    const { given_name, family_name, birth_date, phone_number, address_line_1, address_line_2, postal_code, city, country } = req.body;

    if (!given_name)
        throw "First name is required";

    if (!family_name)
        throw "Surname is required";

    if (!birth_date)
        throw "Birth date is required";

    if (!phone_number)
        throw "Phone number is required";

    if (!address_line_1)
        throw "Address is required";

    if (!postal_code)
        throw "Postal code is required";

    if (!city)
        throw "City is required";

    if (!country)
        throw "Country is required";

    const params = { id: userId };

    const userArgument = {
        name: given_name + " " + family_name,
        given_name: given_name,
        family_name: family_name,
        user_metadata: {
            birth_date: birth_date,
            phone_number: phone_number,
            address_line_1: address_line_1,
            address_line_2: address_line_2,
            postal_code: postal_code,
            city: city,
            country: country
        }
    }

    return getManagementClient()
        .updateUser(params, userArgument)
}

const getPaymentSaveArgumentsFromRequest = (req) => {
    const { payed, method, periodStart, interval, intervalCount, amount, currency } = req.body;

    var argMethod, argPeriodStart, argPeriodEnd, argInterval, argIntervalCount, argAmount, argCurrency;

    switch (payed) {
        case true:

            // Method
            if (!method)
                throw "Payment method is required";

            switch (method) {
                case "stripe":
                case "manual":
                    argMethod = method;
                    break;

                default:
                    throw `Invalid payment method ${method}`;
            }

            // Period start
            if (!periodStart)
                throw "Period start date is required";

            if (!/^\d{4}-\d{2}-\d{2}$/.test(periodStart))
                throw "Period start date must be in format YYYY-MM-DD";

            argPeriodStart = periodStart;

            var periodStartAsDate = new Date(argPeriodStart);

            // Interval count
            argIntervalCount = parseInt(intervalCount);
            if (isNaN(argIntervalCount) || argIntervalCount <= 0)
                throw "Invalid interval count";

            // Interval
            argInterval = interval;
            switch (interval) {
                case "year":
                    argPeriodEnd = utils.getDateString(new Date(periodStartAsDate.setFullYear(periodStartAsDate.getFullYear() + argIntervalCount)));
                    break;
                case "month":
                    argPeriodEnd = utils.getDateString(new Date(periodStartAsDate.setMonth(periodStartAsDate.getMonth() + argIntervalCount)));
                    break;

                default:
                    throw `Invalid interval ${interval}`;
            }

            // Amount
            argAmount = parseInt(amount);
            if (isNaN(argAmount) || argAmount < 0)
                throw "Invalid amount";

            // Currency
            if (!currency)
                throw "No currency specified";

            argCurrency = currency;

            break;

        case false:
            argPeriodStart = null;
            argPeriodEnd = null;
            argMethod = null;
            argAmount = null;
            break;

        default:
            throw "Invalid value for \"payed\"";
    }

    return new PaymentSaveArguments(argMethod, argPeriodStart, argPeriodEnd, argInterval, argIntervalCount, argAmount, argCurrency);
}

/**
 * Manually update the fee payment for a user, reading arguments from the request body
 * @param {string} flavour
 * @param {number} userId
 * @param {any} req - The request
 */
const adminUpdateUserFeeFromRequest = async (flavour, userId, req) =>
{
    var payment = getPaymentSaveArgumentsFromRequest(req);

    return adminUpdateUserFee(flavour, userId, payment);
}

/**
 * Manually update the fee payment for a user, supplying a PaymentSaveArguments object
 * @param {string} flavour
 * @param {number} userId
* @param {any} payment - A PaymentSaveArguments object
 */
const adminUpdateUserFee = async (flavour, userId, payment) => {

    let userArgument = {};
    switch (flavour) {
        case utils.fee_flavour_membership:
            userArgument.app_metadata = { membfee_payment: payment };
            break;

        case utils.fee_flavour_housecard:
            userArgument.app_metadata = { housecard_payment: payment };
            break;

        default:
            throw "Invalid fee flavour";
    }

    const params = { id: userId };

    return getManagementClient()
        .updateUser(params, userArgument)
        .then(function (user) {
            return getUserClientObject(user);
        });
}

/** Export users as Excel file
 * @returns - Excel file content
 */
const exportUsers = async () => {
    const formatDate = (dateString) => {
        if (dateString) {
            var _date = new Date(dateString);
            return new Intl.DateTimeFormat('sv-SE').format(_date);
        }
        else {
            return null;
        }
    }

    const formatInt = (stringValue) => {
        if (stringValue === null || stringValue === "")
            return null;

        var intValue = parseInt(stringValue);

        if (isNaN(intValue))
            return null;


        return intValue;
    }

    const formatInterval = (interval, intervalCount) => {
        if (intervalCount > 0) {
            return intervalCount.toString() + " " + interval + (intervalCount === 1 ? "" : "s");
        }
        else {
            return "";
        }
    }

    return getManagementClient()
        .getUsers()
        .then(users => {

            const fields = [
                {
                    label: 'First name',
                    value: 'given_name'
                },
                {
                    label: 'Surname',
                    value: 'family_name'
                },
                {
                    label: 'Email',
                    value: 'email'
                },
                {
                    label: 'Birth date',
                    value: 'birth_date'
                },
                {
                    label: 'Phone number',
                    value: 'phone_number'
                },
                {
                    label: 'Address',
                    value: 'address_line_1'
                },
                {
                    label: 'Address (line 2)',
                    value: 'address_line_2'
                },
                {
                    label: 'Postal code',
                    value: 'postal_code'
                },
                {
                    label: 'City',
                    value: 'city'
                },
                {
                    label: 'Country',
                    value: 'country'
                },
                {
                    label: 'MS payed',
                    value: (row) => row.payments.membership.payed ? "Yes" : "No"
                },
                {
                    label: 'MS period start',
                    value: (row) => formatDate(row.payments.membership.periodStart)
                },
                {
                    label: 'MS period end',
                    value: (row) => formatDate(row.payments.membership.periodEnd)
                },
                {
                    label: 'MS interval',
                    value: (row) => formatInterval(row.payments.membership.interval, row.payments.membership.intervalCount)
                },
                {
                    label: 'MS amount',
                    value: (row) => formatInt(row.payments.membership.amount)
                },
                {
                    label: 'MS amount / year',
                    value: (row) => getNormalizedAmount("year", row.payments.membership.amount, row.payments.membership.interval, row.payments.membership.intervalCount)
                },
                {
                    label: 'MS currency',
                    value: 'payments.membership.currency'
                },
                {
                    label: 'MS payment method',
                    value: 'payments.membership.methodName'
                },
                {
                    label: 'HC payed',
                    value: (row) => row.payments.housecard.payed ? "Yes" : "No"
                },
                {
                    label: 'HC period start',
                    value: (row) => formatDate(row.payments.housecard.periodStart)
                },
                {
                    label: 'HC period end',
                    value: (row) => formatDate(row.payments.housecard.periodEnd)
                },
                {
                    label: 'HC interval',
                    value: (row) => formatInterval(row.payments.housecard.interval, row.payments.housecard.intervalCount)
                },
                {
                    label: 'HC amount',
                    value: (row) => formatInt(row.payments.housecard.amount)
                },
                {
                    label: 'HC amount / month',
                    value: (row) => getNormalizedAmount("month", row.payments.housecard.amount, row.payments.housecard.interval, row.payments.housecard.intervalCount)
                },
                {
                    label: 'HC currency',
                    value: 'payments.housecard.currency'
                },
                {
                    label: 'House card payment method',
                    value: 'payments.housecard.methodName'
                }
            ];

            // Filter out only users from the connection specified in the env file
            const usersJson = users.filter(user => isUserInCurrentConnection(user)).map(user => getUserClientObject(user)).sort((a, b) => stringCompare(a.name, b.name));

            const json2csv = new Parser({ fields, withBOM: true });
            const csv = json2csv.parse(usersJson);

            // The withBOM option in Parser should add BOM character to CSV to signal UTF-8, but it doesn't.
            // The only way I've got it to work is to use withBOM:true AND manually adding the BOM character to the response. /DO
            const bom = "\ufeff";

            return (bom + csv);
        })
}

module.exports = {
    /** A user object suitable to send to the client */
    UserClientObject,
    /** Values for a stored payment property in Auth0 */
    UserPaymentProperty,
    /** Arguments for saving a payment for a user */
    PaymentSaveArguments,
    /**
     * Get an Auth0 management client
     * Docs: https://auth0.github.io/node-auth0/module-management.ManagementClient.html
     */
    getManagementClient,
    /**
     * Get a user and return it as a UserClientObject
     * @param {number} userId
     * @param {boolean} includePayments - If payments should be included in the client object
     */
    getUserClientObject,
    /**
     * Check if a user has a specific role.
     * The roles are read from the "roles" property in the users "app_metadata" collection in Auth0.
     * Multiple roles are separated by comma
     * @param {any} user Auth0 user object
     * @param {any} roleName
     */
    userHasRole,
    /**
     * If the user belongs to the current user "connection", i.e. the Auth0 database corresponding to the current environment (specified in the AUTH0_USER_CONNECTION environment variable)
     * @param {any} user Auth0 user object
     */
    isUserInCurrentConnection,
    /**
     * Given an Auth0 user, make a UserClientObject object to pass to client
     * @param {number} userId
     * @param {boolean} includePayments - If payments should be included in the client object
     */
    getUser,
    /**
     * Get a user and return it as an Auth0 user object
     * @param {number} userId
     */
    getAuth0User,
    /** Get all users (as client objects) */
    getUsers,
    /** Get all users (as Auth0 objects) */
    getAuth0Users,
    /**
     * Update a user's profile information
     * @param {number} userId
     * @param {any} req - The request (reading information from the request body)
     */
    updateUserProfile,
    /**
     * Manually update the fee payment for a user, supplying a PaymentSaveArguments object
     * @param {string} flavour
     * @param {number} userId
     * @param {any} payment - A PaymentSaveArguments object
     */
    adminUpdateUserFee,
    /**
     * Manually update the fee payment for a user, reading arguments from the request body
     * @param {string} flavour
     * @param {number} userId
     * @param {any} req - The request
     */
    adminUpdateUserFeeFromRequest,
    /** Export users as Excel file
     * @returns - Excel file content
     */
    exportUsers
}
