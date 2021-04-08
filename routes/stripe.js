const stripe_membfee = require('stripe')(process.env.STRIPE_PRIVATE_KEY_ELDSAL_ORG);
const stripe_housecard = require('stripe')(process.env.STRIPE_PRIVATE_KEY_ELDSAL_AB);
const utils = require("./utils");
const auth0 = require("./auth0");
const { fee_flavour_membership, fee_flavour_housecard } = require('./utils');

const { stringCompare, numericCompare, getDateString, getNormalizedAmount } = utils;

/*
 * Stripe methods
 */

/** A user (Auth0 user or "dummy" user if the Stripe user is not connected to an Auth0 user), containing information about all Stripe subscriptions. 
 * Heavy object, not suitable to return to client. When returning to client, convert it to a UserStripeSubscriptionResultObject object. */
class StripeSubscriptionUserInfo {
    constructor(user, email) {
        this.user = user; // Auth0 user
        this.email = email;
        this.membfee_customer = null; // Stripe customer
        this.membfee_subscriptions = [];
        this.housecard_customer = null; // Stripe customer
        this.housecard_subscriptions = [];
        this.dummy_user_id = null;
        this.stripe_customer_membfee = getStripeCustomerForUser(user, fee_flavour_membership);
        this.stripe_customer_housecard = getStripeCustomerForUser(user, fee_flavour_housecard);
    }
}

/**
 * A user (Auth0 user or "dummy" user if the Stripe user is not connected to an Auth0 user), with information about all Stripe subscriptions, suitable to pass to client
 */
class UserStripeSubscriptionResultObject {
    /**
     * 
     * @param {any} info - A StripeSubscriptionUserInfo object
     */
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

/** Information about a Stripe subscription */
class StripeSubscriptionInfo {
    // Pass a Stripe subscription object, and a list of Stripe products and prices
    constructor(sub, products) {
        this.subscription_id = sub.id;
        this.current_period_start = sub.current_period_start;
        this.current_period_end = sub.current_period_end;
        this.read_error = false;
        this.read_error_message = null;

        this.quantity = null;
        this.amount = null;
        this.unit_amount = null;
        this.currency = null;
        this.price_id = null;
        this.price_name = null;
        this.product_id = null;
        this.product_name = null;
        this.interval = null;
        this.interval_count = null;

        if (sub.items && sub.items.data && sub.items.data.length > 0) {
            if (sub.items.data.length == 1) {
                // Containing one subscription item (expected)
                var item = sub.items.data[0];

                this.quantity = item.quantity;

                const price = item.price;

                if (price) {

                    this.price_id = price.id;
                    this.price_name = price.nickname;

                    this.currency = price.currency;
                    this.unit_amount = price.unit_amount / 100; // Amount is in cents (ören)

                    this.amount = this.unit_amount * this.quantity;

                    this.product_id = price.product;

                    if (this.product_id) {

                        var productSearch = products.filter(x => x.id == this.product_id);

                        if (productSearch && productSearch.length == 1) {
                            var product = productSearch[0];
                            this.product_name = product.name;
                        }
                        else {
                            this.product_name = this.product_id;
                        }

                        this.product_name = product.name;
                    }

                    if (price.recurring) {
                        this.interval = price.recurring.interval;
                        this.interval_count = price.recurring.interval_count;

                    }
                }
                else {
                    this.read_error = true;
                    this.read_error_message = "Subscription items contains no price";
                }
            }
            else {
                // Containing more than one subscription items
                this.read_error = true;
                this.read_error_message = "The subscription contains multiple items";
            }
        }
        else {
            // No items
            this.read_error = true;
            this.read_error_message = "No subscription items";
        }

        return;

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
                this.product_name = this.product_id;
            }

            var priceSearch = prices.filter(x => x.id == this.price_id);

            //console.log(prices)
            //console.log(this.price_id)

            if (priceSearch && priceSearch.length == 1) {
                var price = priceSearch[0];
                this.price_name = price.nickname;
            }
            else {
                this.price_name = null;
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
            this.price_name = null;
        }
    }
}

const getStripeClientForFlavour = (flavour) => {
    if (flavour === utils.fee_flavour_membership) {
        return stripe_membfee;
    } else if (flavour === utils.fee_flavour_housecard) {
        return stripe_housecard;
    }
    else {
        throw "Invalid fee flavour";
    }
};

/**
 * Get the Stripe customer Id stored on an Auth0 user
 * @param {any} user - An Auth0 user object
 * @param {string} flavour - Fee flavour
 */
const getStripeCustomerForUser = (user, flavour) => {
    if (user && user.app_metadata) {
        switch (flavour) {
            case fee_flavour_membership:
                return user.app_metadata.stripe_customer_membfee;

            case fee_flavour_housecard:
                return user.app_metadata.stripe_customer_housecard;

            default:
                throw "Invalid fee flavour";
        }
    }
    else {
        return null;
    }
}

/**
 * Read all items from "paged" collections in Stripe. Stripe never returns more than 100 items in one call, so we iterate the calls to read all items.
 * @param {any} listFunc
 * @param {any} args
 * @param {any} limit
 */
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

/**
 * Read Stripe subscriptions
 * @param {any} stripeClient - Stripe client
 * @param {any} readFromCustomerId - If supplied, only subscriptions for the specified customer Id is read. Pass a null value to read all subscriptions
 * @param {any} userInfoByStripeCustomer - A dictionary where the key is stripe customer Id and value is a StripeSubscriptionUserInfo object
 * @param {any} addDummyUserFunc - A function for adding a dummy user (a user not found in userInfoByStripeCustomer). Type: (user: StripeSubscriptionUserInfo) => void
 * @param {any} setUserCustomerFunc - A function for setting the Stripe customer Id on a user. Type: (user: StripeSubscriptionUserInfo, customer: [StripeCustomerObject]) => void
 * @param {any} addSubscriptionFunc - A function for adding a subscription to a user. Type: (user: StripeSubscriptionUserInfo, subscription: StripeSubscriptionInfo) => void
 */
async function readSubscriptions(stripeClient, readFromCustomerId, userInfoByStripeCustomer, addDummyUserFunc, setUserCustomerFunc, addSubscriptionFunc) {

    let customers;

    if (readFromCustomerId) {
        var customer = await stripeClient.customers.retrieve(readFromCustomerId);
        customers = [customer];
    }
    else {
        customers = await readPagedStripeData((args) => stripeClient.customers.list(args));
    }

    const products = await readPagedStripeData((args) => stripeClient.products.list(args));

    for (var c of customers) {
        const email = c.email;
        let user = userInfoByStripeCustomer[c.id];
        if (user) {
            setUserCustomerFunc(user, c);
            c._user = user;
        }
        else {
            c._user = null;
        }
    }

    const customersById = {};
    customers.forEach(x => customersById[x.id] = x);

    let subArgs = readFromCustomerId ? { customer: readFromCustomerId } : null;

    let subscriptions = await readPagedStripeData((args) => stripeClient.subscriptions.list(args), subArgs);

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
            const dummyUser = new StripeSubscriptionUserInfo(null, customer.email);
            dummyUser.dummy_user_id = nextDummyUserId--;
            setUserCustomerFunc(dummyUser, customer);
            customer._user = dummyUser;
            addDummyUserFunc(dummyUser);
        }

        addSubscriptionFunc(customer._user, new StripeSubscriptionInfo(s, products));
    }
}

/** Get all active Stripe subscriptions (for all users)
 * @returns - A list of UserStripeSubscriptionResultObject objects
 */
const getStripeSubscriptions = async () => {

    const userInfoList = await _getStripeSubscriptions();

    const result = userInfoList.filter(x => x.membfee_subscriptions.length > 0 || x.housecard_subscriptions.length > 0).map(x => new UserStripeSubscriptionResultObject(x));

    return result.sort((a, b) => stringCompare(a.user_name, b.user_name));
}

/** Get all active Stripe subscriptions, and return a list of StripeSubscriptionUserInfo objects  */
const _getStripeSubscriptions = async () => {

    const users = (await auth0.getAuth0Users());

    // List of StripeSubscriptionUserInfo objects
    const userInfoList = users.map(x => new StripeSubscriptionUserInfo(x, x.email));

    const userInfoByMembfeeCustomer = {};
    userInfoList.forEach(x => {
        var stripeCustomer = x.stripe_customer_membfee;
        if (stripeCustomer) {
            userInfoByMembfeeCustomer[stripeCustomer] = x;
        }
    });

    const userInfoByHousecardCustomer = {};
    userInfoList.forEach(x => {
        var stripeCustomer = x.stripe_customer_housecard;
        if (stripeCustomer) {
            userInfoByHousecardCustomer[stripeCustomer] = x;
        }
    });
    // Membership

    await readSubscriptions(
        stripe_membfee,
        null,
        userInfoByMembfeeCustomer,
        (user) => userInfoList.push(user),
        (user, customer) => user.membfee_customer = customer,
        (user, subscription) => user.membfee_subscriptions.push(subscription));

    await readSubscriptions(
        stripe_housecard,
        null,
        userInfoByHousecardCustomer,
        (user) => userInfoList.push(user),
        (user, customer) => user.housecard_customer = customer,
        (user, subscription) => user.housecard_subscriptions.push(subscription));

    return userInfoList;
}

/** Get all active Stripe subscriptions for a user
 * @param {number} userId
 * @returns - A UserStripeSubscriptionResultObject object
 */
const getStripeSubscriptionsForUser = async (userId) => {

    const userInfo = await _getStripeSubscriptionsForUser(userId);

    return new UserStripeSubscriptionResultObject(userInfo);
}

/**
 * Get all active Stripe subscriptions for a user, and return a StripeSubscriptionUserInfo objects
 * @param {number} userId
 * @returns - A StripeSubscriptionUserInfo object
 */
const _getStripeSubscriptionsForUser = async (userId) => {

    const user = await auth0.getManagementClient().getUser({ id: userId });

    const userInfo = new StripeSubscriptionUserInfo(user, user.email);

    if (userInfo.stripe_customer_membfee) {
        const userInfoByMembfeeCustomer = {};
        userInfoByMembfeeCustomer[userInfo.stripe_customer_membfee] = userInfo;

        await readSubscriptions(
            stripe_membfee,
            userInfo.stripe_customer_membfee,
            userInfoByMembfeeCustomer,
            (user) => { },
            (user, customer) => user.membfee_customer = customer,
            (user, subscription) => { user.membfee_subscriptions.push(subscription) });
    }

    if (userInfo.stripe_customer_housecard) {
        const userInfoByHousecardCustomer = {};
        userInfoByHousecardCustomer[userInfo.stripe_customer_housecard] = userInfo;

        await readSubscriptions(
            stripe_housecard,
            userInfo.stripe_customer_housecard,
            userInfoByHousecardCustomer,
            (user) => { },
            (user, customer) => user.housecard_customer = customer,
            (user, subscription) => user.housecard_subscriptions.push(subscription));
    }

    return userInfo;
}

/** Sync Stripe payments with stored information for Auth0 users, and update Auth0 user accordingly */
const syncUsers = async () => {
    const subscriptions = await _getStripeSubscriptions();

    for (var userInfo of subscriptions) {
        if (userInfo.user) {
            await _syncSubscriptions(userInfo);
        }
    }
}

/** Sync Stripe payments with stored information for Auth0 users, and update Auth0 user accordingly */
const syncUser = async (userId) => {
    const userInfo = await _getStripeSubscriptionsForUser(userId);

    await _syncSubscriptions(userInfo);
}

const _syncSubscriptions = async (userInfo) => {
    if (userInfo.user) {

        var userClientObject = auth0.getUserClientObject(userInfo.user, true);

        let membfeeSubscription = null;
        // If more than one subscription is found, use the one with the latest end date
        for (var s of userInfo.membfee_subscriptions) {
            if (membfeeSubscription == null || s.current_period_end > membfeeSubscription.current_period_end) {
                membfeeSubscription = s;
            }
        }
        const membfeePayment = getPaymentPropertyForSubscription(membfeeSubscription);

        let housecardSubscription = null;
        // If more than one subscription is found, use the one with the latest end date
        for (var s of userInfo.housecard_subscriptions) {
            if (housecardSubscription == null || s.current_period_end > housecardSubscription.current_period_end) {
                housecardSubscription = s;
            }
        }
        const housecardPayment = getPaymentPropertyForSubscription(housecardSubscription);

        if (shouldUpdatePayment(userClientObject.payments.membership, membfeePayment)) {
            console.log("Update membership for " + userInfo.user.name);
            await auth0.adminUpdateUserFee(utils.fee_flavour_membership, userInfo.user.user_id, membfeePayment.getPaymentSaveArguments())
        }

        if (shouldUpdatePayment(userClientObject.payments.housecard, housecardPayment)) {
            console.log("Update housecard for " + userInfo.user.name);
            console.log(userClientObject.payments.housecard);
            await auth0.adminUpdateUserFee(utils.fee_flavour_housecard, userInfo.user.user_id, housecardPayment.getPaymentSaveArguments())
        }
    }
}

const shouldUpdatePayment = (dbPayment, newPayment) => {
    if (!dbPayment.payed) {
        // The existing payment in DB is unpayed
        if (newPayment.payed) {
            // The new payment is payed - update
            return true;
        }
        else {
            // The new payment is also unpayed
            // If a period end is stored in DB (and no newer period end is found on the new payment), keep it, else update (if the period end differs from the stored one)
            if (dbPayment.periodEnd && (!newPayment.periodEnd || dbPayment.periodEnd >= newPayment.periodEnd))
                return false;
            else
                return dbPayment.periodEnd != newPayment.periodEnd;
        }
    }
    else {
        // The existing payment in DB is payed
        if (dbPayment.method == "stripe") {
            // The existing database payment is a Stripe payment - update if different
            return !dbPayment.isEqualTo(newPayment);
        }
        else {
            // The existing payment is not a Stripe payment
            if (newPayment.payed) {
                // The new payment is payed
                // Update if the new period end is later than the existing period end
                return newPayment.periodEnd > dbPayment.periodEnd;
            }
            else {
                // The new payment is unpayed - don't update
                return false;
            }
        }
    }
}

const getDateFromEpochTimestamp = (timestamp) => {
    if (timestamp == null)
        return null;

    return new Date(timestamp * 1000);
}

const getPaymentPropertyForSubscription = (subscription) => {

    if (subscription == null)
        return new auth0.UserPaymentProperty(false, null, null, null, null, "stripe", null, null);

    var periodStart = getDateString(getDateFromEpochTimestamp(subscription.current_period_start));
    var periodEnd = getDateString(getDateFromEpochTimestamp(subscription.current_period_end));

    return new auth0.UserPaymentProperty(true, periodStart, periodEnd, subscription.interval, subscription.interval_count, "stripe", subscription.amount, subscription.currency);
}

/**
 * Cancel a Stripe subscription
 * @param {string} flavour - Fee flavour
 * @param {number} subscriptionId
 */
const cancelStripeSubscription = async (flavour, subscriptionId) => {
    const stripeClient = getStripeClientForFlavour(flavour);
    return await stripeClient.subscriptions.del(subscriptionId);
}

/**
 * Cancel a Stripe subscription, and check that it belongs to a specific user
 * @param {number} userId
 * @param {string} flavour - Fee flavour
 * @param {number} subscriptionId
 */
const cancelStripeSubscriptionForUser = async (userId, flavour, subscriptionId) => {

    var user = await auth0.getAuth0User(userId);

    var stripeCustomer = getStripeCustomerForUser(user, flavour);

    if (!stripeCustomer)
        throw "No Stripe customer stored on the user";

    var subUser = await _getStripeSubscriptionsForUser(userId);


    let subscriptionsToSearch;
    switch (flavour) {
        case fee_flavour_membership:
            subscriptionsToSearch = subUser.membfee_subscriptions;
            break;

        case fee_flavour_housecard:
            subscriptionsToSearch = subUser.housecard_subscriptions;
            break;

        default:
            throw "Invalid fee flavor";
    }

    let subscriptionFound = false;
    if (subscriptionsToSearch) {
        for (var s of subscriptionsToSearch) {
            if (s.subscription_id == subscriptionId) {
                subscriptionFound = true;
                break;
            }
        }
    }

    if (subscriptionFound) {
        await cancelStripeSubscription(flavour, subscriptionId);
        return syncUser(userId);
    }
    else {
        throw "Subscription not found";
    }
}

/**
 * Get all Stripe prices and products
 * @param {any} flavour
 */
const getPrices = async (flavour) => {

    const stripeClient = getStripeClientForFlavour(flavour);

    const products = (await stripeClient.products.list({ active: true, limit: 100 })).data;
    const prices = (await stripeClient.prices.list({ active: true, limit: 100 })).data;

    return { prices, products };
}

/* CHECKOUT */

const checkStripeSession = async (flavour, userId) => {

    var managementClient = auth0.getManagementClient();

    const user = await managementClient.getUser({ id: userId });

    const session = await getStripeClientForFlavour(flavour).checkout.sessions.retrieve(user.app_metadata.stripe_session_id);

    await managementClient.updateUser({ id: userId }, {
        app_metadata: {
            ["stripe_customer_" + flavour]: session.customer,
            ["stripe_status_" + flavour]: session.payment_status,
        }
    });
}

const createCheckoutSession = async (flavour, userId, price) => {

    console.log(price);

    var managementClient = auth0.getManagementClient();

    const user = await managementClient.getUser({ id: userId });

    let sessionObj = {
        payment_method_types: ['card'],
        client_reference_id: userId,
        line_items: [
            {
                price: price,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: 'https://' + process.env.WEB_HOST + '/afterpurchase?flavour=' + flavour,
        cancel_url: 'https://' + process.env.WEB_HOST + '/subscription',
    };


    if (user.app_metadata && user.app_metadata["stripe_customer_" + flavour]) {
        sessionObj = { ...sessionObj, customer: user.app_metadata["stripe_customer_" + flavour] };
    } else {
        sessionObj = { ...sessionObj, customer_email: user.email };
    }

    console.log(sessionObj);

    const session = await getStripeClientForFlavour(flavour).checkout.sessions.create(sessionObj);

    await managementClient.updateUser({ id: userId }, { app_metadata: { stripe_session_id: session.id } });

    return session.id;
}

/** PAYOUTS */

class StripePayoutResultObject {
    constructor(flavour, payout) {
        this.flavour = flavour;
        this.payout_id = payout.id;
        this.arrival_date = payout.arrival_date;
        this.created = payout.created;
        this.amount = payout.amount == null ? null : payout.amount / 100; // Amount received in öre
        this.currency = payout.currency == null ? null : payout.currency.toUpperCase();
        this.failure_code = payout.failure_code;
        this.failure_message = payout.failure_message;
   }
}

/** Get all Stripe payouts
 * @returns - A list of StripePaymentResultObject objects
 */
const getStripePayouts = async () => {

    const result = [];

    for (var p of await _getStripePayouts(stripe_membfee)) {
        result.push(new StripePayoutResultObject(fee_flavour_membership, p));
    }

    for (var p of await _getStripePayouts(stripe_housecard)) {
        result.push(new StripePayoutResultObject(fee_flavour_housecard, p));
    }

    return result.sort((a, b) => numericCompare(a.arrival_date, b.arrival_date,false));
}

const _getStripePayouts = async (stripeClient) => {

    return await readPagedStripeData((args) => stripeClient.payouts.list(args));
}

class StripePayoutTransactionListResultObject {
    constructor(flavour, chargesAmount, chargesCurrency, feesAmount, feesCurrency, transactions) {
        this.flavour = flavour;
        this.charges_amount = chargesAmount;
        this.charges_currency = chargesCurrency;
        this.fees_amount = feesAmount;
        this.fees_currency = feesCurrency;
        this.transactions = transactions;
    }
}

class StripePayoutTransactionResultObject {
    constructor(flavour, transaction) {
        this.flavour = flavour;
        this.transaction_id = transaction.id;
        this.arrival_date = transaction.arrival_date;
        this.created = transaction.created;
        this.amount = transaction.amount == null ? 0 : transaction.amount / 100; // Amount received in öre
        this.currency = transaction.currency == null ? null : transaction.currency.toUpperCase();
        this.description = transaction.description;
        this.type = transaction.type;
        this.fee_amount = transaction.fee == null ? 0 : transaction.fee / 100; // Amount received in öre
        this.fee_currency = this.currency;

        this.fees = [];

        if (transaction.fee_details) {

            for (var fee of transaction.fee_details) {

                var _fee = new StripePayoutTransactionFeeResultObject(fee);

                this.fee_currency = _fee.currency; // Store the currency on main object (expecting all fees to be in the same currency)

                this.fees.push(_fee);
            }
        }

        // Source and user_id is popuated by _makeStripePayoutTransactionResultObject
        this.source = null;
        this.user_id = null;
    }
}

const _makeStripePayoutTransactionResultObject = async (flavour, transaction, userByStripeCustomerId) => {

    var result = new StripePayoutTransactionResultObject(flavour, transaction);

    if (transaction.source) {

        var billingEmail = null;
        if (transaction.source.billing_details) {
            billingEmail = transaction.source.billing_details.email;
        }
        
        if (transaction.source.customer) {

            var user = userByStripeCustomerId[transaction.source.customer];

            var _email = null;
            var sourceName = null;

            if (user != null) {
                result.user_id = user.user_id;
                _email = user.email;
                if (user.name) {
                    sourceName = user.name + " (" + user.email + ")";
                }
                else {
                    sourceName = user.email;
                }
            }
            else {
                var customer = await getStripeClientForFlavour(flavour).customers.retrieve(transaction.source.customer);
                if (customer == null) {
                    sourceName = "(Stripe customer " + transaction.source.customer + ")";
                }
                else {
                    _email = customer.email;
                    sourceName = "(Stripe customer " + customer.email + ")";
                }
            }

            result.source = sourceName;

            if (billingEmail && _email !== billingEmail) {
                result.source += " (billing email: " + billingEmail + ")";
            }

        }
    }

    return result;
}

class StripePayoutTransactionFeeResultObject {
    constructor(fee) {
        this.amount = fee.amount == null ? null : fee.amount / 100; // Amount received in öre
        this.currency = fee.currency == null ? null : fee.currency.toUpperCase();
        this.type = fee.type;
    }
}

/**
 * Get transactions included in a payout
 * @param {any} flavour
 * @param {any} payoutId
 */
const getStripePayoutTransactions = async (flavour, payoutId) => {
    const stripeClient = getStripeClientForFlavour(flavour);
    const transactions = await _getStripePayoutTransactions(stripeClient, payoutId);

    const allUsers = await auth0.getAuth0Users();

    const userByStripeCustomerId = {};
    for (var u of allUsers) {
        var stripeCustomerId = getStripeCustomerForUser(u, flavour);
        if (stripeCustomerId) {
            userByStripeCustomerId[stripeCustomerId] = u;
        }
    }

    const _transactions = [];
    let chargesAmount = 0, chargesCurrency = null, feesAmount = 0, feesCurrency = null;

    const addCharge = (amount, currency) => {
        chargesAmount += amount;

        if (chargesCurrency === null) {
            chargesCurrency = currency;
        }
        else if (amount !== 0 && chargesCurrency !== currency) {
            chargesCurrency = "";
        }
    }

    const addFee = (amount, currency) => {
        feesAmount += amount;

        if (feesCurrency === null) {
            feesCurrency = currency;
        }
        else if (amount !== 0 && feesCurrency !== currency) {
            feesCurrency = "";
        }
    }

    for (var t of transactions.filter(x => x.type != "payout")) {
        var _t = await _makeStripePayoutTransactionResultObject(flavour, t, userByStripeCustomerId);
        _transactions.push(_t);

        if (_t.amount >= 0) {
            addCharge(_t.amount, _t.currency);
        }
        else {
            addFee(_t.amount, _t.currency);
        }

        if (_t.fee_amount !== 0) {
            addFee(_t.fee_amount, _t.fee_currency);
        }
    }


    return new StripePayoutTransactionListResultObject(flavour, chargesAmount, chargesCurrency, feesAmount, feesCurrency, _transactions);
}

const _getStripePayoutTransactions = async (stripeClient, payoutId) => {

    const mainArgs = {
        payout: payoutId,
        expand: ['data.source']
    };

    return await readPagedStripeData((args) => stripeClient.balanceTransactions.list(args), mainArgs);
}

module.exports = {
    /**
    * A user (Auth0 user or "dummy" user if the Stripe user is not connected to an Auth0 user), with information about all Stripe subscriptions, suitable to pass to client
    */
    UserStripeSubscriptionResultObject,
    /** Information about a Stripe subscription */
    StripeSubscriptionInfo,
    /** List all active Stripe subscriptions (for all users)
     * @returns - A list of UserStripeSubscriptionResultObject objects
     */
    getStripeSubscriptions,
    getStripeSubscriptionsForUser,
    /**
     * Cancel a Stripe subscription (to user for admins)
     * @param {string} flavour - Fee flavour
     * @param {number} subscriptionId
     */
    cancelStripeSubscription,
    /**
     * Cancel a Stripe subscription, and check that it belongs to a specific user (to be used for end-users)
     * @param {number} userId
     * @param {string} flavour - Fee flavour
     * @param {number} subscriptionId
     */
    cancelStripeSubscriptionForUser,
    checkStripeSession,
    createCheckoutSession,
    /**
     * Get all Stripe prices and products
     * @param {any} flavour
     */
    getPrices,
    syncUser,
    syncUsers,
    /** Get all Stripe payouts
     * @returns - A list of StripePayoutResultObject objects
     */
    getStripePayouts,
    /**
     * Get transactions included in a payout
     * @param {any} flavour
     * @param {any} payoutId
     */
    getStripePayoutTransactions
}
