/*
 * Sync task, executed daily as a sheduled task
 */

require("dotenv").config();

const stripe = require("../stripe");

console.log("Executing 'sync' task");

(async () => {
    console.log("Synching Stripe subscriptions...")
    await stripe.syncUsers();
    console.log("All Stripe subscriptions synced")

    console.log("All syncing done");
})();

console.log("Exiting");

