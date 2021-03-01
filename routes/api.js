const express = require("express");
const router = express.Router();
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const { AuthenticationClient, ManagementClient } = require('auth0');
const stripe_membfee = require('stripe')(process.env.REACT_APP_STRIPE_PRIVATE_KEY_ELDSAL_ORG);
const stripe_housecard = require('stripe')(process.env.REACT_APP_STRIPE_PRIVATE_KEY_ELDSAL_AB);
const { Parser } = require('json2csv');

module.exports = router;

/*
 * FUNCTIONS
 */

/**
 * Return an error response. The error message is included in the response body as JSON.
 * @param {any} res
 * @param {any} statusMessage
 * @param {any} statusCode
 */
function returnError(res, statusMessage, statusCode = 500) {
    console.error(`ERROR ${statusCode}: ${statusMessage}`);
    res.status(statusCode).json({ error: statusMessage });
}

/**
 * Return an error response as Bad Request (400). The error message is included in the response body as JSON.
 * @param {any} res
 * @param {any} statusMessage
 * @param {any} statusCode
 */
function badRequest(res, statusMessage) {
    returnError(res, statusMessage, 400);
}

/**
 * Return an error response as Internal Server Error (500). The error message is included in the response body as JSON.
 * @param {any} res
 * @param {any} statusMessage
 * @param {any} statusCode
 */
function internalServerError(res, statusMessage) {
    returnError(res, statusMessage, 500);
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
 * Get an Auth0 management client
 * Docs: https://auth0.github.io/node-auth0/module-management.ManagementClient.html
 */
const getManagementClient = () => {
    return new ManagementClient({
        domain: process.env.AUTH0_MGT_DOMAIN,
        clientId: process.env.AUTH0_MGT_CLIENT_ID,
        clientSecret: process.env.AUTH0_MGT_CLIENT_SECRET,
        scope: 'read:users update:users'
    });
}

// Compare strings alphabetically
const stringCompare = (a, b) => {
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
};

// Get a date string in the format "YYYY-MM-DD"
const getDateString = (date) => {
    if (date) {
        return new Intl.DateTimeFormat('sv-SE').format(date);
    }
    else {
        return "";
    }
}

// Get a "normalized" amount, i.e. the amount per year or per month, based on a the amount payed for a number of years or months
const getNormalizedAmount = (normalizedInterval, amount, interval, intervalCount) => {
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
}

/**
 * Given an Auth0 user, make a JSON object to pass to client
 * @param {any} user
 */
const getUserClientObject = (user, includePayments = true) => {
    var obj = {}

    obj.user_id = user.user_id;
    obj.picture = user.picture;
    obj.name = user.name;
    obj.given_name = user.given_name;
    obj.family_name = user.family_name;
    obj.email = user.email;

    if (!obj.name && (obj.given_name || obj.family_name)) {
        obj.name = obj.given_name + " " + obj.family_name;
    }

    if (user.user_metadata) {
        obj.birth_date = user.user_metadata.birth_date;
        obj.phone_number = user.user_metadata.phone_number;
        obj.address_line_1 = user.user_metadata.address_line_1;
        obj.address_line_2 = user.user_metadata.address_line_2;
        obj.postal_code = user.user_metadata.postal_code;
        obj.city = user.user_metadata.city;
        obj.country = user.user_metadata.country;
    }
    else {
        obj.birth_date = null;
        obj.phone_number = null;
        obj.address_line_1 = null;
        obj.address_line_2 = null;
        obj.postal_code = null;
        obj.city = null;
        obj.country = null;
    }

    if (user.app_metadata) {
        obj.roles = user.app_metadata.roles;
    }
    else {
        obj.roles = null;
    }

    obj.admin = userHasRole(user, "admin");

    if (includePayments) {
        obj.payments = {
            membership: getUserAppMetaDataFee(user, "membfee_payment", "year"),
            housecard: getUserAppMetaDataFee(user, "housecard_payment", "month")
        };
    }

    return obj;
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
    var methodName = "(none)";
    var amount = null;
    var normalizedAmount = null;
    var currency = null;
    var isError = false;
    var errorMessage = null;

    var payment = user.app_metadata && user.app_metadata[paymentProperty] ? user.app_metadata[paymentProperty] : null;

    if (payment) {
        periodStart = payment["period_start"];

        if (periodStart) {

            interval = payment["interval"];
            intervalCount = parseInt(payment["interval_count"]);
            currency = payment["currency"];
            amount = parseInt(payment["amount"]);
            method = payment["method"];

            var periodStartDate = new Date(periodStart);

            if (!periodStartDate || isNaN(periodStartDate.getTime())) {
                hasPayed = false;
                isError = true;
                errorMessage = 'The stored period start date has an invalid format';
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

                var periodEndDate;
                switch (interval) {
                    case "year":
                        periodEndDate = new Date(periodStartDate.setUTCFullYear(periodStartDate.getUTCFullYear() + intervalCount));
                        break;
                    case "month":
                        periodEndDate = new Date(periodStartDate.setMonth(periodStartDate.getMonth() + intervalCount));
                        break;
                    default:
                        // Should not happen
                        periodEnd = periodStart;
                        break;
                }
                periodEnd = getDateString(periodEndDate);

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

    return {
        payed: hasPayed,
        periodStart: periodStart,
        periodEnd: periodEnd,
        interval: interval,
        intervalCount: intervalCount,
        method: method,
        methodName: methodName,
        amount: amount,
        normalizedAmount: normalizedAmount,
        normalizedInterval: normalizedInterval,
        currency: currency ? currency.toUpperCase() : "SEK",
        error: isError,
        errorMessage: errorMessage
    }
}


/*
 * MIDDLEWARE HANDLERS
 */

// Authorization middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set.
// Note that the access token is not invalidated when the user logs out, it is self-contained
const checkJwt = jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and
    // the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
    }),

    // Validate the audience and the issuer.
    // !!! "audience" should be "https://app.eldsal.se/api/v1" to access our custom API, but that doesn't work right now
    // audience: 'https://app.eldsal.se/api/v1',
    audience: process.env.AUTH0_MGT_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
});

// Middleware to check that the submitted parameter "userId" is the the same as the user id in the authentication token.
// checkJwt must be called before checkLoggedInUser
const checkLoggedInUser = (req, res, next) => {
    if (req.params.userId != req.user.sub) {
        returnError(res, "No logged in user", 401);
    }
    else {
        next();
    }
}

// Middleware to check if a user has the "admin" role
const checkUserIsAdmin = async (req, res, next) => {

    const params = { id: req.user.sub };

    getManagementClient()
        .getUser(params)
        .then(function (user) {

            if (!userHasRole(user, "admin")) {
                returnError(res, "Admin role required", 403);
            }
            else {
                next();
            }

        })
        .catch(function (err) {
            returnError('Error getting user: ' + err);
        });
}


const checkScopes = jwtAuthz(['read:current_user']);


/*
 * ROUTES
 */


// TEST: This route doesn't need authentication
router.get('/public', function (req, res) {
    res.json({
        message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
    });
});

// TEST: This route needs authentication
router.get('/private', checkJwt, async function (req, res) {
    res.json({
        message: 'Hello from a private endpoint! You need to be authenticated to see this.'
    });
});

/*
router.get('/test', checkJwt, checkUserIsAdmin, async function (req, res) {

    console.log('test');
    console.log(req.user);

    const userId = req.user.sub;

    const params = { id: userId };

    getManagementClient()
        .getUser(params)
        .then(function (user) {
            res.json(user);
        })
        .catch(function (err) {
            // Handle error.
            console.error(err);
            returnError(res, err);
        });
});
*/

router.get('/getLoggedInUser', checkJwt, async function (req, res) {
    console.log('getLoggedInUser');

    if (!req.user || !req.user.sub)
        returnError(res, "No logged in user", 401);

    const userId = req.user.sub;

    const params = { id: userId };

    getManagementClient()
        .getUser(params)
        .then(function (user) {
            res.json(getUserClientObject(user));
        })
        .catch(function (err) {
            // Handle error.
            console.error(err);
            returnError(res, err);
        });
});

/* Update a user
 * Argument object:
 *  given_name
 *  family_name
 *  birth_date
 *  phone_number
 *  address_line_1
 *  address_line_2
 *  postal_code
 *  city
 *  country
 **/
router.patch('/updateUserProfile/:userId', checkJwt, checkLoggedInUser, async function (req, res) {

    console.log('updateUserProfile');

    const userId = req.params.userId;

    if (userId != req.user.sub)
        return returnError(res, "You can only update your own user");

    const { given_name, family_name, birth_date, phone_number, address_line_1, address_line_2, postal_code, city, country } = req.body;

    if (!given_name)
        return returnError(res, "First name is required");

    if (!family_name)
        return returnError(res, "Surname is required");

    if (!birth_date)
        return returnError(res, "Birth date is required");

    if (!phone_number)
        return returnError(res, "Phone number is required");

    if (!address_line_1)
        return returnError(res, "Address is required");

    if (!postal_code)
        return returnError(res, "Postal code is required");

    if (!city)
        return returnError(res, "City is required");

    if (!country)
        return returnError(res, "Country is required");

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

    getManagementClient()
        .updateUser(params, userArgument)
        .then(function (user) {
            res.json();
        })
        .catch(function (err) {
            // Handle error.
            console.error(err);
            returnError(res, err);
        });

});

/* Get an URL to change a user's password (by creating a change password ticket in Auth0)
 * Argument object:
 *  current_password
 *  new_password
 *  verify_password
 **/
router.get('/getChangeUserPasswordUrl/:userId', checkJwt, checkScopes, async function (req, res) {

    console.log('changeUserPassword');

    const params = {
        result_url: `https://${process.env.WEB_HOST}/login`,
        user_id: req.params.userId
    }

    getManagementClient()
        .createPasswordChangeTicket(params)
        .then(function (ticketResponse) {
            res.json({ url: ticketResponse.ticket });
        })
        .catch(function (err) {
            // Handle error.
            console.error(err);
            returnError(res, err);
        });

});

/** ADMIN */


/* Get users
 **/
router.get('/admin/get-users', checkJwt, checkUserIsAdmin, async function (req, res) {

    console.log('admin/get-users');

    getManagementClient()
        .getUsers()
        .then(function (users) {
            // Filter out only users from the connection specified in the env file
            res.json(users.filter(user => isUserInCurrentConnection(user)).map(user => getUserClientObject(user)).sort((a, b) => stringCompare(a.name, b.name)));
        })
        .catch(function (err) {
            // Handle error.
            console.error(err);
            returnError(res, err);
        });

});

/* Export users as CSV file
 **/
router.get('/admin/export-users', checkJwt, checkUserIsAdmin, async function (req, res) {

    console.log('admin/export-users');

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

    getManagementClient()
        .getUsers()
        .then(function (users) {
            // Filter out only users from the connection specified in the env file

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

            const usersJson = users.filter(user => isUserInCurrentConnection(user)).map(user => getUserClientObject(user)).sort((a, b) => stringCompare(a.name, b.name));

            const json2csv = new Parser({ fields, withBOM: true });
            const csv = json2csv.parse(usersJson);

            // The withBOM option in Parser should add BOM character to CSV to signal UTF-8, but it doesn't.
            // The only way I've got it to work is to use withBOM:true AND manually adding the BOM character to the response. /DO
            const bom = "\ufeff";

            res.status(200).contentType("text/csv").attachment("EldsalMemberList.csv").send(bom + csv);
        })
        .catch(function (err) {
            // Handle error.
            console.error(err);
            returnError(res, err);
        });
});

const getPaymentPost = (req) => {
    const { payed, method, periodStart, interval, intervalCount, amount, currency } = req.body;

    var argMethod, argPeriodStart, argInterval, argIntervalCount, argAmount, argCurrency;

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

            var periodStartDate = new Date(periodStart);

            argPeriodStart = periodStart;

            // Interval
            switch (interval) {
                case "year":
                case "month":
                    argInterval = interval;
                    break;

                default:
                    throw `Invalid interval ${interval}`;
            }

            // Interval count
            argIntervalCount = parseInt(intervalCount);
            if (isNaN(argIntervalCount) || argIntervalCount <= 0)
                throw "Invalid interval count";

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
            argPayedUntil = null;
            argMethod = null;
            argAmount = null;
            break;

        default:
            throw "Invalid value for \"payed\"";
    }

    return {
        method: argMethod,
        period_start: argPeriodStart,
        interval: argInterval,
        interval_count: argIntervalCount,
        amount: argAmount,
        currency: argCurrency
    };
}

/* Update membership fee payment for user
 * Argument object:
 *  payed: boolean
 *  method: string ("manual" | "stripe")
 *  payedUntil: date (YYYY-MM-DD)
 *  amount: number (yearly amount)
 **/
router.patch('/admin/update-user-membership/:userId', checkJwt, checkUserIsAdmin, async function (req, res) {

    console.log('admin/update-user-membership');

    const userId = req.params.userId;
    console.log(userId);

    var payment;

    try {
        payment = getPaymentPost(req);
    } catch (e) {
        console.log(e);
        return badRequest(res, e);
    }

    const userArgument = {
        app_metadata: {
            membfee_payment: payment
        }
    }

    const params = { id: userId };

    getManagementClient()
        .updateUser(params, userArgument)
        .then(function (user) {
            res.json(getUserClientObject(user));
        })
        .catch(function (err) {
            // Handle error.
            console.error(err);
            internalServerError(res, err);
        });
});

/* Update housecard fee payment for user
 * Argument object:
 *  payed: boolean
 *  method: string ("manual" | "stripe")
 *  payedUntil: date (YYYY-MM-DD)
 *  amount: number (monthly amount, regardless of the period actually payed)
 **/
router.patch('/admin/update-user-housecard/:userId', checkJwt, checkUserIsAdmin, async function (req, res) {

    console.log('admin/update-user-housecard');

    const userId = req.params.userId;
    console.log(userId);

    var payment;

    try {
        payment = getPaymentPost(req);
    } catch (e) {
        return badRequest(res, e);
    }

    const userArgument = {
        app_metadata: {
            housecard_payment: payment
        }
    }

    const params = { id: userId };

    getManagementClient()
        .updateUser(params, userArgument)
        .then(function (user) {
            res.json(getUserClientObject(user));
        })
        .catch(function (err) {
            // Handle error.
            console.error(err);
            internalServerError(res, err);
        });
});

class UserSubscriptionInfo {
    constructor(user, email) {
        this.user = user; // Auth0 user
        this.email = email;
        this.membfee_customer = null; // Stripe customer
        this.membfee_subscriptions = [];
        this.housecard_customer = null; // Stripe customer
        this.housecard_subscriptions = [];
        this.dummy_user_id = null;
        if (user && user.app_metadata) {
            this.stripe_customer_membfee = user.app_metadata.stripe_customer_membfee;
            this.stripe_customer_housecard = user.app_metadata.stripe_customer_housecard;
        }
        else {
            this.stripe_customer_membfee = null;
            this.stripe_customer_housecard = null;
        }
    }
}

class UserSubscriptionResultObject {
    // Pass a UserSubscriptionInfo object as argument
    constructor(info) {
        this.email = info.email;
        if (info.user) {
            this.is_existing_user = true;
            this.user_id = info.user.user_id;
            this.user_name = info.user.name;
            this.user_given_name = info.user.given_name;
            this.user_family_name = info.user.family_name;

            if (!this.user_name && (this.user_given_name || this.user_family_name)) {
                this.user_name = this.user_given_name + " " + this.user_family_name;
            }
        }
        else {
            this.is_existing_user = false;
            this.user_id = info.dummy_user_id;
            this.user_name = 'Non-existing user';
        }

        if (info.membfee_customer) {
            this.membfee_stripe_customer_id = info.membfee_customer.id;
        }
        else {
            this.membfee_stripe_customer_id = null;
        }

        if (info.membfee_subscriptions) {
            this.membfee_subscriptions = info.membfee_subscriptions;
        }
        else {
            this.membfee_subscriptions = [];
        }

        if (info.housecard_customer) {
            this.housecard_stripe_customer_id = info.housecard_customer.id;
        }
        else {
            this.housecard_stripe_customer_id = null;
        }

        if (info.housecard_subscriptions) {
            this.housecard_subscriptions = info.housecard_subscriptions;
        }
        else {
            this.housecard_subscriptions = [];
        }
    }
}

class StripeSubscriptionInfo {
    // Pass a Stripe subscription object, and a list of Stripe products
    constructor(sub, products) {
        this.subscription_id = sub.id;
        this.current_period_start = sub.current_period_start;
        this.current_period_end = sub.current_period_end;

        if (sub.plan) {
            this.price_id = sub.plan.id;
            this.amount = sub.plan.amount / 100; // "amount" is in "cents", i.e. "ören"
            this.currency = sub.plan.currency;
            this.interval = sub.plan.interval;
            this.interval_count = sub.plan.interval_count;
            this.product_id = sub.plan.product;

            var productSearch = products.filter(x => x.id == this.product_id);

            if (productSearch && productSearch.length == 1) {
                var product = productSearch[0];
                this.product_name = product.name;
            }
            else {
                this.product_name = sub.plan.product_id;
            }
        }
        else {
            this.price_id = null;
            this.amount = null;
            this.currency = null;
            this.interval = null;
            this.interval_count = null;
            this.product_id = null;
            this.product_name = null;
        }
    }
}

/** Get a list of Stripe subscriptions */
router.get('/admin/get-subscriptions', checkJwt, checkUserIsAdmin, async (req, res) => {

    console.log('admin/get-subscriptions');

    const users = (await getManagementClient().getUsers());

    const userInfo = users.map(x => new UserSubscriptionInfo(x, x.email));

    const userInfoByMembfeeCustomer = {};
    userInfo.forEach(x => {
        var stripeCustomer = x.stripe_customer_membfee;
        if (stripeCustomer) {
            userInfoByMembfeeCustomer[stripeCustomer] = x;
        }
    });

    const userInfoByHousecardCustomer = {};
    userInfo.forEach(x => {
        var stripeCustomer = x.stripe_customer_housecard;
        if (stripeCustomer) {
            userInfoByHousecardCustomer[stripeCustomer] = x;
        }
    });
    // Membership

    await readSubscriptions(
        stripe_membfee,
        userInfoByMembfeeCustomer,
        (user) => userInfo.push(user),
        (user, customer) => user.membfee_customer = customer,
        (user, subscription) => user.membfee_subscriptions.push(subscription));

    await readSubscriptions(
        stripe_housecard,
        userInfoByHousecardCustomer,
        (user) => userInfo.push(user),
        (user, customer) => user.housecard_customer = customer,
        (user, subscription) => user.housecard_subscriptions.push(subscription));

    let result = userInfo.map(x => new UserSubscriptionResultObject(x));

    res.json(result);

});


router.get('/user-subscriptions', checkJwt, async (req, res) => {

    console.log('user-subscriptions');

    const user = await getManagementClient().getUser({ id: req.user.sub });

    const userInfo = new UserSubscriptionInfo(user, user.email);

    const userInfoByMembfeeCustomer = {};
    userInfoByMembfeeCustomer[userInfo.stripe_customer_membfee] = userInfo;

    const userInfoByHousecardCustomer = {};
    userInfoByHousecardCustomer[userInfo.stripe_customer_housecard] = userInfo;


    await readSubscriptions(
        stripe_membfee,
        userInfoByMembfeeCustomer,
        (user) => { },
        (user, customer) => user.membfee_customer = customer,
        (user, subscription) => { user.membfee_subscriptions.push(subscription) });

    await readSubscriptions(
        stripe_housecard,
        userInfoByHousecardCustomer,
        (user) => { },
        (user, customer) => user.housecard_customer = customer,
        (user, subscription) => user.housecard_subscriptions.push(subscription));

    res.json(new UserSubscriptionResultObject(userInfo));
});

async function readPagedStripeData(listFunc, args = null, limit = 100) {
    let read = true;
    let startingAfter = null;
    let allData = [];
    while (read) {
        let _args = {
            ...args,
            limit
        };
        if (startingAfter) {
            _args.starting_after = startingAfter;
        }
        let response = await listFunc(_args);
        let data = response.data
        allData = allData.concat(data);
        if (response.has_more) {
            startingAfter = data[data.length - 1].id;
        }
        else {
            read = false;
        }
    }
    return allData;
}

async function readSubscriptions(stripe, userInfoByStripeCustomer, addDummyUserFunc, addCustomerFunc, addSubscriptionFunc) {
    const customers = await readPagedStripeData((args) => stripe.customers.list(args));

    const products = await readPagedStripeData((args) => stripe.products.list(args));

    for (var c of customers) {
        const email = c.email;
        let user = userInfoByStripeCustomer[c.id];
        if (user) {
            addCustomerFunc(user, c);
            c._user = user;
        }
        else {
            c._user = null;
        }
    }

    const customersById = {};
    customers.forEach(x => customersById[x.id] = x);

    let subscriptions = await readPagedStripeData((args) => stripe.subscriptions.list(args));

    let nextDummyUserId = -1;

    for (var s of subscriptions) {
        const customerId = s.customer;
        let customer = customersById[customerId];
        let createDummyUser = false;
        if (customer) {
            if (!customer._user) {
                // A subscription is found, but the customer is not linked to a user - create a dummy user
                createDummyUser = true;
            }
        }
        else {
            // Customer not found - create "dummy" customer
            customer = { id: customerId };
            createDummyUser = true;
        }

        if (createDummyUser) {
            const dummyUser = new UserSubscriptionInfo(null, null);
            dummyUser.dummy_user_id = nextDummyUserId--;
            addCustomerFunc(dummyUser, customer);
            customer._user = dummyUser;
            addDummyUserFunc(dummyUser);
        }

        addSubscriptionFunc(customer._user, new StripeSubscriptionInfo(s, products));
    }
}

router.get('/subscriptions', checkJwt, async (req, res) => {

    const user = await getManagementClient().getUser({ id: req.user.sub });

    const membfeeResponse = await getStripeClient("membfee").subscriptions.list({ customer: user.app_metadata.stripe_customer_membfee });
    const housecardResponse = await getStripeClient("housecard").subscriptions.list({ customer: user.app_metadata.stripe_customer_housecard });

    res.json({ membfeeSubs: membfeeResponse.data, housecardSubs: housecardResponse.data });
});

router.get('/prices', checkJwt, async (req, res) => {

    const user = await getManagementClient().getUser({ id: req.user.sub });
    const flavour = req.query.flavour;
    const products = (await getStripeClient(flavour).products.list({ limit: 100 })).data;
    const prices = (await getStripeClient(flavour).prices.list({ limit: 100 })).data;

    res.json({ prices, products });

});

router.get('/check-stripe-session', checkJwt, async (req, res) => {

    const flavour = req.query.flavour;
    const user = await getManagementClient().getUser({ id: req.user.sub });

    const session = await getStripeClient(flavour).checkout.sessions.retrieve(user.app_metadata.stripe_session_id);

    await getManagementClient().updateUser({ id: req.user.sub }, {
        app_metadata: {
            ["stripe_customer_" + flavour]: session.customer,
            ["stripe_status_" + flavour]: session.payment_status,
        }
    });

    res.json({});
});

const getStripeClient = (flavour) => {
    if (flavour === "membfee") {
        return stripe_membfee;
    } else if (flavour === "housecard") {
        return stripe_housecard;
    }
};

router.post('/create-checkout-session', checkJwt, async (req, res) => {

    const flavour = req.query.flavour;
    const price = req.query.price;

    console.log(price);

    const user = await getManagementClient().getUser({ id: req.user.sub });

    let sessionObj = {
        payment_method_types: ['card'],
        client_reference_id: req.user.sub,
        line_items: [
            {
                price: price,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: 'https://local.eldsal.se/afterpurchase?flavour=' + flavour,
        cancel_url: 'https://local.eldsal.se/subscription',
    };


    if (user.app_metadata["stripe_customer_" + flavour]) {
        sessionObj = { ...sessionObj, customer: user.app_metadata["stripe_customer_" + flavour] };
    } else {
        sessionObj = { ...sessionObj, customer_email: user.email };
    }

    console.log(sessionObj);

    const session = await getStripeClient(flavour).checkout.sessions.create(sessionObj);

    await getManagementClient().updateUser({ id: req.user.sub }, { app_metadata: { stripe_session_id: session.id } });

    res.json({ id: session.id });
});
