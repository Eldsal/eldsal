const express = require("express");
const router = express.Router();
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const fetch = require('node-fetch');
const axios = require('axios');
var AuthenticationClient = require('auth0').AuthenticationClient;
var ManagementClient = require('auth0').ManagementClient;

router.get("/test", (req, res) => {
    return res.status(200).json({ success: true })
});

module.exports = router;

function returnError(res, statusMessage) {
    console.error("ERROR: " + statusMessage);
    res.status(500).json(statusMessage);
}

function getManagementClient() {

    var auth0 = new AuthenticationClient({
        domain: 'eldsal.eu.auth0.com',
        clientId: 'p4PqUsM5H7QS81byl44b4rfOXAciYLHN',
        clientSecret: 'st6hdmebqw0qYQshC5eaOrHOO4ufQQoP0nWlWSaq07jOQfD4FEa8GrBi9fotrfY1'
    });

    auth0 = new AuthenticationClient({
        domain: process.env.AUTH0_MGT_DOMAIN,
        clientId: process.env.AUTH0_MGT_CLIENT_ID,
        clientSecret: process.env.AUTH0_MGT_CLIENT_SECRET
    });

    auth0 = new AuthenticationClient({
        domain: 'eldsal.eu.auth0.com',
        clientId: process.env.AUTH0_MGT_CLIENT_ID,
        clientSecret: process.env.AUTH0_MGT_CLIENT_SECRET
    });

    auth0.clientCredentialsGrant(
        {
            audience: 'https://eldsal.eu.auth0.com/api/v2/',
            xaudience: 'https://login.eldsal.se/api/v2/',
            scope: 'read:users update:users'
        },
        function (err, response) {
            if (err) {
                console.log("Error fetching management client")
                console.error(err);
            }
        }
    );

    return new ManagementClient({
        domain: process.env.AUTH0_MGT_DOMAIN,
        clientId: process.env.AUTH0_MGT_CLIENT_ID,
        clientSecret: process.env.AUTH0_MGT_CLIENT_SECRET,
        scope: 'read:users update:users'
    });
}

// Authorization middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and 
    // the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://login.eldsal.se/.well-known/jwks.json`
    }),

    // Validate the audience and the issuer.
    // !!! "audience" should be "https://app.eldsal.se/api/v1" to access our custom API, but that doesn't work right now
    xaudience: 'https://app.eldsal.se/api/v1',
    audience: 'https://eldsal.eu.auth0.com/api/v2/',
    issuer: `https://login.eldsal.se/`,
    algorithms: ['RS256']
});

const checkScopes = jwtAuthz(['read:current_user']);

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
router.patch('/updateUserProfile/:userId', checkJwt, checkScopes, async function (req, res) {

    console.log('updateUserProfile');
    console.log(req.body);

    const { given_name, family_name, birth_date, phone_number, address_line_1, address_line_2, postal_code, city, country} = req.body;

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

    const params = { id: req.params.userId };

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
            res.json(statusMessage);
        })
        .catch(function (err) {
            // Handle error.
            console.error(err);
            returnError(res, err);
        });

});

/* Update a user
 * Argument object:
 *  current_password
 *  new_password
 *  verify_password
 **/
router.patch('/changeUserPassword/:userId', checkJwt, checkScopes, async function (req, res) {

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