const express = require("express");
const router = express.Router();
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const { AuthenticationClient, ManagementClient } = require('auth0');

module.exports = router;

/*
 * FUNCTIONS
 */

// Return an error response. The error message is included in the response body as JSON
function returnError(res, statusMessage, statusCode = 500) {
    console.error("ERROR: " + statusMessage);
    res.status(statusCode).json({ error: statusMessage });
}


// Check if a user has a specific role
// The roles are read from the "roles" property in the users "app_metadata" collection in Auth0.
// Multiple roles are separated by comma
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

// Get an Auth0 management client
// Docs: https://auth0.github.io/node-auth0/module-management.ManagementClient.html
const getManagementClient = () => {
    return new ManagementClient({
        domain: process.env.AUTH0_MGT_DOMAIN,
        clientId: process.env.AUTH0_MGT_CLIENT_ID,
        clientSecret: process.env.AUTH0_MGT_CLIENT_SECRET,
        scope: 'read:users update:users'
    });
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

    if(userId != req.user.sub)
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

/* Get users
 **/
router.get('/getUsers', checkJwt, checkUserIsAdmin, async function (req, res) {

    console.log('getUsers');

    getManagementClient()
        .getUsers()
        .then(function (users) {
            console.log(users);
            res.json(users);
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

    console.log(params);

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