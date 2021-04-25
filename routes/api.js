const express = require("express");
const router = express.Router();
const utils = require("./utils");
const response = require("./response");
const middleware = require("./middleware");
const auth0 = require("./auth0");
const stripe = require("./stripe");

module.exports = router;

const { returnError, badRequest, internalServerError } = response;
const { checkJwt, checkLoggedInUser, checkUserIsAdmin, checkUserIsDeveloper } = middleware;
const { getManagementClient } = auth0;


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

router.get('/getLoggedInUser', checkJwt, async function (req, res) {
    console.log('getLoggedInUser');

    if (!req.user || !req.user.sub)
        returnError(res, "No logged in user", 401);

    const userId = req.user.sub;

    auth0.getUser(userId, true)
        .then(data => res.json(data))
        .catch(function (err) {
            // Handle error.
            console.error(err);
            returnError(res, err);
        });
});

/* Sync Stripe payments for logged in user
 **/
router.patch('/sync-user', checkJwt, async function (req, res) {

    console.log('sync-user');
    const userId = req.user.sub;
    console.log(userId);

    stripe.syncUser(userId)
        .then(success => auth0.getUser(userId, true))
        .then(data => res.json(data))
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

    console.log(userId);

    auth0.updateUserProfile(userId, req)
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
router.get('/getChangeUserPasswordUrl/:userId', checkJwt, async function (req, res) {

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

    auth0.getUsers()
        .then(data => res.json(data))
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

    auth0.exportUsers()
        .then(fileContent => {
            res.status(200).contentType("text/csv").attachment("EldsalMemberList.csv").send(fileContent);
        },
            error => {
                console.error(error);
                returnError(res, error);
            });
});

/* Sync Stripe payments for all users
 **/
router.patch('/admin/sync-users', checkJwt, checkUserIsAdmin, async function (req, res) {

    console.log('admin/sync-users');

    stripe.syncUsers()
        .then(success => auth0.getUsers())
        .then(data => res.json(data))
        .catch(function (err) {
            // Handle error.
            console.error(err);
            returnError(res, err);
        });

});

/* Sync Stripe payments for a user
 **/
router.patch('/admin/sync-user/:userId', checkJwt, checkUserIsAdmin, async function (req, res) {

    console.log('admin/sync-user');
    const userId = req.params.userId;
    console.log(userId);

    stripe.syncUser(userId)
        .then(success => auth0.getUser(userId,true))
        .then(data => res.json(data))
        .catch(function (err) {
            // Handle error.
            console.error(err);
            returnError(res, err);
        });

});

router.patch('/admin/update-user-roles/:userId', checkJwt, checkUserIsAdmin, async function (req, res) {

    console.log('admin/update-user-roles');

    const userId = req.params.userId;
    console.log(userId);

    const { roles } = req.body;

    console.log(roles)

    auth0.adminUpdateUserRoles(req.user.sub, userId, roles)
        .then(userClientObject => {
            res.json(userClientObject);
        })
        .catch(function (err) {
            // Handle error.
            console.error(err);
            internalServerError(res, err);
        });
});


/* Update membership fee payment for user
 * Argument object:
 *  paid: boolean
 *  method: string ("manual" | "stripe")
 *  paidUntil: date (YYYY-MM-DD)
 *  amount: number (yearly amount)
 **/
router.patch('/admin/update-user-membership/:userId', checkJwt, checkUserIsAdmin, async function (req, res) {

    console.log('admin/update-user-membership');

    const userId = req.params.userId;
    console.log(userId);

    auth0.adminUpdateUserFeeFromRequest(utils.fee_flavour_membership, userId, req)
        .then(userClientObject => {
            res.json(userClientObject);
        })
        .catch(function (err) {
            // Handle error.
            console.error(err);
            internalServerError(res, err);
        });
});

/* Update housecard fee payment for user
 * Argument object:
 *  paid: boolean
 *  method: string ("manual" | "stripe")
 *  paidUntil: date (YYYY-MM-DD)
 *  amount: number (monthly amount, regardless of the period actually paid)
 **/
router.patch('/admin/update-user-housecard/:userId', checkJwt, checkUserIsAdmin, async function (req, res) {

    console.log('admin/update-user-housecard');

    const userId = req.params.userId;
    console.log(userId);

    auth0.adminUpdateUserFeeFromRequest(utils.fee_flavour_housecard, userId, req)
        .then(userClientObject => {
            res.json(userClientObject);
        })
        .catch(function (err) {
            // Handle error.
            console.error(err);
            internalServerError(res, err);
        });
});



/** Get a list of Stripe subscriptions */
router.get('/admin/get-subscriptions', checkJwt, checkUserIsAdmin, async (req, res) => {

    console.log('admin/get-subscriptions');
    
    stripe.getStripeSubscriptions()
        .then(users => res.json(users))
        .catch(function (err) {
            // Handle error.
            console.error(err);
            internalServerError(res, err);
        });
});

/** Cancel a Stripe subscription for membership (for admins) */
router.patch('/admin/cancel-subscription-membfee/:subscriptionId', checkJwt, checkUserIsAdmin, async (req, res) => {

    console.log('admin/cancel-subscription-membfee');

    const subscriptionId = req.params.subscriptionId;
    console.log(subscriptionId);

    stripe.cancelStripeSubscription(utils.fee_flavour_membership, subscriptionId)
        .then(
            success => res.json(),
            error => returnError(res, error),
        );
});

/** Cancel a Stripe subscription for housecard (for admins) */
router.patch('/cancel-subscription/:userId/:flavour/:subscriptionId', checkJwt, checkLoggedInUser, async (req, res) => {

    console.log('cancel-subscription');

    const userId = req.params.userId;
    const flavour = req.params.flavour;
    const subscriptionId = req.params.subscriptionId;
    console.log(userId);
    console.log(flavour);
    console.log(subscriptionId);

    stripe.cancelStripeSubscriptionForUser(userId, flavour, subscriptionId)
        .then(
            success => res.json(),
            error => returnError(res, error),
        );
});

/** Cancel a Stripe subscription for membership */
router.patch('/admin/cancel-subscription-membfee/:subscriptionId', checkJwt, checkUserIsAdmin, async (req, res) => {

    console.log('admin/cancel-subscription-membfee');

    const subscriptionId = req.params.subscriptionId;
    console.log(subscriptionId);

    stripe.cancelStripeSubscription(utils.fee_flavour_membership, subscriptionId)
        .then(
            success => res.json(),
            error => returnError(res, error),
        );
});

router.get('/user-subscriptions', checkJwt, async (req, res) => {

    console.log('user-subscriptions');

    const userId = req.user.sub;

    console.log(userId);

    stripe.getStripeSubscriptionsForUser(userId)
        .then(data => {
            res.json(data);
        })
});

router.get('/prices', checkJwt, async (req, res) => {

    const flavour = req.query.flavour;

    stripe.getPrices(flavour)
        .then(data => res.json(data));
});

router.get('/check-stripe-session', checkJwt, async (req, res) => {

    console.log('check-stripe-session');

    const flavour = req.query.flavour;
    const userId = req.user.sub;

    try {
        await stripe.checkStripeSession(flavour, userId);
        await stripe.syncUser(userId);
        res.json({});
    }
    catch (err) {
        returnError(res, err);
    }
});

router.post('/create-checkout-session', checkJwt, async (req, res) => {

    console.log('create-checkout-session');

    const flavour = req.query.flavour;
    const price = req.query.price;
    const userId = req.user.sub;

    console.log(price);

    const sessionId = await stripe.createCheckoutSession(flavour, userId, price);

    res.json({ id: sessionId });
});

router.get('/admin/get-stripe-payouts', checkJwt, checkUserIsAdmin, async (req, res) => {

    console.log('admin/get-stripe-payouts');

    stripe.getStripePayouts()
        .then(data => res.json(data));
});

router.get('/admin/get-stripe-payout-transactions', checkJwt, checkUserIsAdmin, async (req, res) => {

    console.log('admin/get-stripe-payouts');

    const flavour = req.query.flavour;
    const payout = req.query.payout;

    console.log(payout);

    stripe.getStripePayoutTransactions(flavour, payout)
        .then(data => res.json(data));
});

/** GOOGLE GROUPS */

router.get('/dev/google-test', checkJwt, checkUserIsDeveloper, async (req, res) => {

    console.log('dev/google-test');

    google.test();

    res.json();
});