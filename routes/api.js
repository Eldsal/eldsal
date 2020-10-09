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
                console.error(err);
            }
            else {
                console.log('TOKEN: ' + response.access_token);
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
    console.log("hej");
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

// Update a user
router.patch('/updateUser/:userId', checkJwt, checkScopes, async function (req, res) {

    userArgument = req.body;

    var params = { id: req.params.userId };

    getManagementClient()
        .updateUser(params, userArgument)
        .then(function (user) {
            console.log("SUCCESS: " + JSON.stringify(user));
        })
        .catch(function (err) {
            // Handle error.
            console.error(err);
        });

    res.json();
});