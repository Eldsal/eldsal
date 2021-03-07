const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const auth0 = require('./auth0');
const response = require('./response');

const { returnError } = response;
const { getManagementClient, userHasRole } = auth0;

/*
 * Middleware handlers
 */

module.exports = {

    // Authorization middleware. When used, the
    // Access Token must exist and be verified against
    // the Auth0 JSON Web Key Set.
    // Note that the access token is not invalidated when the user logs out, it is self-contained
    checkJwt: jwt({
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
    }),

    // Middleware to check that the submitted parameter "userId" is the the same as the user id in the authentication token.
    // checkJwt must be called before checkLoggedInUser
    checkLoggedInUser: (req, res, next) => {
        if (req.params.userId != req.user.sub) {
            returnError(res, "No logged in user", 401);
        }
        else {
            next();
        }
    },

    // Middleware to check if a user has the "admin" role
    checkUserIsAdmin: async (req, res, next) => {

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
                returnError(res, 'Error getting user: ' + err);
            });
    },

    // Middleware to check if a user has the "dev" role
    checkUserIsDeveloper: async (req, res, next) => {

        const params = { id: req.user.sub };

        auth0.getManagementClient()
            .getUser(params)
            .then(function (user) {

                if (!userHasRole(user, "dev")) {
                    returnError(res, "Developer role required", 403);
                }
                else {
                    next();
                }

            })
            .catch(function (err) {
                returnError(res, 'Error getting user: ' + err);
            });
    }
}