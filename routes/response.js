
/*
 * Response methods
 */

/**
 * Return an error response. The error message is included in the response body as JSON.
 * @param {any} res
 * @param {any} statusMessage
 * @param {any} statusCode
 */
const returnError = (res, statusMessage, statusCode = 500) => {

    let errorMessage;
    switch (typeof (statusMessage)) {
        case "string":
            errorMessage = statusMessage;
            break;

        case "number":
        case "boolean":
            errorMessage = statusMessage.toString();
            break;

        default:
            errorMessage = null;
            break;
    }

    console.error(`ERROR ${statusCode}: ${errorMessage}`);

    res.status(statusCode).json({ error: errorMessage });
}

/**
 * Return an error response as Bad Request (400). The error message is included in the response body as JSON.
 * @param {any} res
 * @param {any} statusMessage
 * @param {any} statusCode
 */
const badRequest = (res, statusMessage) => {
    returnError(res, statusMessage, 400);
}

/**
 * Return an error response as Internal Server Error (500). The error message is included in the response body as JSON.
 * @param {any} res
 * @param {any} statusMessage
 * @param {any} statusCode
 */
const internalServerError = (res, statusMessage) => {
    returnError(res, statusMessage, 500);
}

module.exports = {
    /**
     * Return an error response. The error message is included in the response body as JSON.
     * @param {any} res
     * @param {any} statusMessage
     * @param {any} statusCode
     */
    returnError,
    /**
     * Return an error response as Bad Request (400). The error message is included in the response body as JSON.
     * @param {any} res
     * @param {any} statusMessage
     * @param {any} statusCode
     */
    badRequest,
    /**
     * Return an error response as Internal Server Error (500). The error message is included in the response body as JSON.
     * @param {any} res
     * @param {any} statusMessage
     * @param {any} statusCode
     */
    internalServerError
}