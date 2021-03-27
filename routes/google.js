/*
 * Google methods
 */

const readline = require('readline');
const { google } = require('googleapis');
const googleCredentials = require("../google-credentials.json");

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/admin.directory.user'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

const getCredentials = () => {
    return googleCredentials;
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    // configure a JWT auth client
    let jwtClient = new google.auth.JWT(
        googleCredentials.client_email,
        null,
        googleCredentials.private_key,
        [
            'https://www.googleapis.com/auth/admin.directory.group',
            'https://www.googleapis.com/auth/admin.directory.group.member'
        ]);

    //authenticate request
    jwtClient.authorize(function (err, tokens) {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log("Successfully connected!");
            console.log(tokens);
            callback(jwtClient);
        }
    })

    /*
    const { client_secret, client_id, redirect_uris } = credentials;
    const oauth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oauth2Client, callback);
        oauth2Client.credentials = JSON.parse(token);
        callback(oauth2Client);
    });
    */
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oauth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.warn(`Token not stored to ${TOKEN_PATH}`, err);
        console.log(`Token stored to ${TOKEN_PATH}`);
    });
}

/**
 * Lists the first 10 users in the domain.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listUsers(auth) {
    const service = google.admin({ version: 'directory_v1', auth });
    service.users.list({
        customer: 'my_customer',
        maxResults: 10,
        orderBy: 'email',
    }, (err, res) => {
        if (err) return console.error('The API returned an error:', err.message);

        const users = res.data.users;
        if (users.length) {
            console.log('Users:');
            users.forEach((user) => {
                console.log(`${user.primaryEmail} (${user.name.fullName})`);
            });
        } else {
            console.log('No users found.');
        }
    });
}

function listGroupMembers(auth) {
    const service = google.admin({ version: 'directory_v1', auth });

    service.members.list({
        groupKey: 'eldsal-medlemmar@googlegroups.com',
        maxResults: 200
    }, (err, res) => {
        if (err) return console.error('The API returned an error:', err.message);

        const users = res.data.users;
        if (users.length) {
            console.log('Users:');
            users.forEach((user) => {
                console.log(`${user.primaryEmail} (${user.name.fullName})`);
            });
        } else {
            console.log('No users found.');
        }
    });
}

const test = () => {
    authorize(getCredentials(), listGroupMembers);
}

module.exports = {
    test
}
