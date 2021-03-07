const stripe_membfee = require('stripe')(process.env.REACT_APP_STRIPE_PRIVATE_KEY_ELDSAL_ORG);
const stripe_housecard = require('stripe')(process.env.REACT_APP_STRIPE_PRIVATE_KEY_ELDSAL_AB);
const utils = require("./utils");
const auth0 = require("./auth0");

const { stringCompare, getDateString, getNormalizedAmount } = utils;

/*
 * Stripe methods
 */

/** A user, containing information about all Stripe subscriptions */
class UserStripeSubscriptionInfo {
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

/**
 * A user, with information about all Stripe subscriptions
 */
class UserStripeSubscriptionResultObject {
    /**
     * 
     * @param {any} info - A UserStripeSubscriptionInfo object
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
            const dummyUser = new UserStripeSubscriptionInfo(null, customer.email);
            dummyUser.dummy_user_id = nextDummyUserId--;
            addCustomerFunc(dummyUser, customer);
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

    const users = (await auth0.getManagementClient().getUsers());

    const userInfo = users.map(x => new UserStripeSubscriptionInfo(x, x.email));

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

    let result = userInfo.map(x => new UserStripeSubscriptionResultObject(x));

    return result.sort((a, b) => stringCompare(a.user_name, b.user_name));
}

/**
 * Get all active Stripe subscriptions for a user
 * @param {any} userId
 */
const getStripeSubscriptionsForUser = async (userId) => {

    const user = await auth0.getManagementClient().getUser({ id: userId });

    const userInfo = new UserStripeSubscriptionInfo(user, user.email);

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

    return new UserStripeSubscriptionResultObject(userInfo);
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
 * Get all Stripe prices and products
 * @param {any} flavour
 */
const getPrices = async (flavour) => {

    const stripeClient = getStripeClientForFlavour(flavour);

    const products = (await stripeClient.products.list({ limit: 100 })).data;
    const prices = (await stripeClient.prices.list({ limit: 100 })).data;

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
        success_url: 'https://local.eldsal.se/afterpurchase?flavour=' + flavour,
        cancel_url: 'https://local.eldsal.se/subscription',
    };


    if (user.app_metadata["stripe_customer_" + flavour]) {
        sessionObj = { ...sessionObj, customer: user.app_metadata["stripe_customer_" + flavour] };
    } else {
        sessionObj = { ...sessionObj, customer_email: user.email };
    }

    console.log(sessionObj);

    const session = await getStripeClientForFlavour(flavour).checkout.sessions.create(sessionObj);

    await managementClient.updateUser({ id: userId }, { app_metadata: { stripe_session_id: session.id } });

    return session.id;
}

module.exports = {
    /** List all active Stripe subscriptions (for all users)
     * @returns - A list of UserStripeSubscriptionResultObject objects
     */
    getStripeSubscriptions,
    getStripeSubscriptionsForUser,
    /**
     * Cancel a Stripe subscription
     * @param {string} flavour - Fee flavour
     * @param {number} subscriptionId
     */
    cancelStripeSubscription,
    checkStripeSession,
    createCheckoutSession,
    /**
     * Get all Stripe prices and products
     * @param {any} flavour
     */
    getPrices
}
