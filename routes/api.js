const express = require("express");
const router = express.Router();
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const fetch = require('node-fetch');
const axios = require('axios');


router.get("/test", (req, res) => {
    return res.status(200).json({ success: true })
});

module.exports = router;

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
    'xxx-audience': 'https://app.eldsal.se/api/v1',
    audience: 'https://eldsal.eu.auth0.com/api/v2/',
    issuer: `https://login.eldsal.se/`,
    algorithms: ['RS256']
});


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
router.patch('/updateUser/:userId', checkJwt, async function (req, res) {

    const userId = req.params.userId;

    userArgument = req.body;

    const url = `https://login.eldsal.se/api/v2/users/${userId}`;

    var y = await axios.patch(url, {
        ...userArgument
    },
        {

            headers: {
                Authorization: req.headers.authorization,
                'Content-Type': 'application/json',
            },
        }
    )
        .then(
            success => {
                console.log('changed successfully');
            },
            fail => {
                console.log('failed', fail);
            });

    res.json();
});