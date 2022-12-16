import React, { useEffect, useState } from "react";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { loadStripe } from "@stripe/stripe-js";
import AppContent from "../components/common/AppContent";
import { useApi } from '../hooks/api';
import { formatUtcTimestamp, formatDate, fee_flavour_membership, fee_flavour_housecard, getFeeFlavourName } from '../utils.js';
import { useUser } from '../hooks/user';
import { useUi } from '../hooks/ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatCurrency, formatCurrencyAndInterval } from '../utils.js';

const SubscriptionPage = () => {
    const stripePromises = { housecard: loadStripe(process.env.REACT_APP_STRIPE_KEY_ELDSAL_AB) };
    const { userInfo, isUserLoading } = useUser();
    const { apiGet, apiPatch, apiPost } = useApi();
    const { alertModal, confirmModal } = useUi();

    const [pps, setPps] = useState({
        housecard: { prices: null, products: null }
    });

    const [userSubscriptions, setUserSubscriptions] = useState(null);
    const [syncedUser, setSyncedUser] = useState(null);
    const [showBuyHouseCard, setShowBuyHouseCard] = useState(null); // null, "buy", "view"
    const [showBuyHouseCardAllPrices, setShowBuyHouseCardAllPrices] = useState(false);

    const getSyncedUser = () => {

        apiPatch(`sync-user`)
            .then(success => {
                setSyncedUser(success.data);
            },
                error => {
                    alertModal("error", "Stripe syncing failed");
                }
            )
    }

    const getSubscriptions = () => {
        apiGet(`user-subscriptions`)
            .then(
                success => {
                    const data = success.data;
                    if (typeof (data) === "object") {
                        setUserSubscriptions(success.data);
                    }
                    else {
                        console.log("Invalid response");
                    }
                },
                fail => {
                    console.log("Fail: " + fail);
                })
            .catch(reason => {
                console.log("Fail: " + reason);
            });
    }

    const fetchPrices = async (feeFlavor) => {
        if (pps[feeFlavor].prices == null) {
            const response = await apiGet("prices?flavour=" + feeFlavor);

            let newPps = { ...pps };

            newPps[feeFlavor] = response.data;

            setPps(newPps);
        }
    }

    const cancelSubscription = (feeFlavor, subscription) => {

        var feeName = getFeeFlavourName(feeFlavor, false);

        confirmModal("warning", "Do you want to cancel your " + feeName + " subscription?", "Cancel subscription", () => {
            apiPatch(`cancel-subscription/${userInfo.user_id}/${feeFlavor}/${subscription.subscription_id}`)
                .then(
                    success => {
                        subscription.read_error = true;
                        subscription.read_error_message = "Cancelled";
                        alertModal("success", "Your " + feeName + " subscription is cancelled", "Subscription cancelled");
                    },
                    err => {
                        console.log(err);
                        alertModal("error", "Failed to cancel subscription");
                    })
                .catch(err => {
                    console.log(err);
                    alertModal("error", "Failed to cancel subscription");
                });
        }, false, "Yes", "No");
    }

    // const getPrice = (id, flavour) => pps[flavour].prices.filter((price) => (price.product === id))[0];
    const getProduct = (id, flavour) => pps[flavour].products.filter((product) => (product.id === id))[0];

    useEffect(() => {
        getSyncedUser();
        getSubscriptions();
        // eslint-disable-next-line
    }, []);

    const showPrices = (feeFlavor, buy) => {
        switch (feeFlavor) {
            case fee_flavour_housecard:
                setShowBuyHouseCardAllPrices(false);
                setShowBuyHouseCard(buy ? "buy" : "view");
                break;
        }
        fetchPrices(feeFlavor);
    }

    const purchaseProduct = async (priceId, flavour) => {
        // Get Stripe.js instance
        const stripe = await stripePromises[flavour];

        const response = await apiPost(`create-checkout-session?flavour=${flavour}&price=${priceId}`);

        // When the customer clicks on the button, redirect them to Checkout.
        const result = await stripe.redirectToCheckout({
            sessionId: response.data.id
        });

        if (result.error) {
            // If `redirectToCheckout` fails due to a browser or network
            // error, display the localized error message to your customer
            // using `result.error.message`.
        }
    };

    const displaySubscriptionList = (feeFlavor, subscriptionList) => {

        let feeName;
        let syncedPayment;
        switch (feeFlavor) {
            case fee_flavour_housecard:
                feeName = "Membership";
                syncedPayment = syncedUser.payments.housecard;
                break;

            default:
                syncedPayment = null;
                break;
        }

        return subscriptionList && subscriptionList.length ?
            subscriptionList.map(item => (
                <tr key={item}>
                    {item.read_error &&
                        <>
                            <td colSpan="3" className="text-danger">{item.read_error_message}</td>
                            <td><button className="btn btn-primary btn-sm" onClick={() => showPrices(feeFlavor, true)} title="Buy a subscription">Show prices</button></td>
                        </>
                    }
                    {!item.read_error &&
                        <>
                            <td>{item.product_name}{item.price_name ? " (" + item.price_name + ")" : ""}</td>
                            <td>{formatCurrencyAndInterval(item.amount, item.currency, item.interval, item.interval_count)}</td>
                            <td>{formatUtcTimestamp(item.current_period_start)} - {formatUtcTimestamp(item.current_period_end)}</td>
                            <td>
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => cancelSubscription(feeFlavor, item)} title="Cancel the subscription">Cancel  subscription</button>
                                <button className="btn btn-outline-secondary btn-sm ml-2" onClick={() => showPrices(feeFlavor, false)} title="Show available prices">Show prices</button>
                            </td>
                        </>
                    }
                </tr>
            ))
            :
            (syncedPayment && (syncedPayment.paid || syncedPayment.periodEnd) ?
                <tr className={syncedPayment.paid ? "" : "text-danger"}>
                    <td>{feeName}{syncedPayment.paid ? "" : " (EXPIRED)"}</td>
                    <td>{formatCurrencyAndInterval(syncedPayment.amount, syncedPayment.currency, syncedPayment.interval, syncedPayment.intervalCount)}</td>
                    <td>{formatDate(syncedPayment.periodStart)} - {formatDate(syncedPayment.periodEnd)}</td>
                    <td>
                        {syncedPayment.paid ?
                            <span className="text-muted">(Manual payment)</span>
                            : <button className="btn btn-primary btn-sm" onClick={() => showPrices(feeFlavor, true)} title="Buy a subscription">Show prices</button>}
                    </td>

                </tr>
                :
                <tr>
                    <td>{feeName}</td>
                    <td colSpan="2" className="text-muted">(None)</td>
                    <td><button className="btn btn-primary btn-sm" onClick={() => showPrices(feeFlavor, true)} title="Buy a subscription">Show prices</button></td>
                </tr>);
    }

    const displayPrices = (feeFlavor, viewMode) => {

        var prices = pps[feeFlavor].prices;

        if (prices == null)
            return null;

        let defaultPrices = {};

        for (let product of pps[feeFlavor].products) {
            if (product && product.default_price) {
                defaultPrices[product.id] = product.default_price;
            }
        }

        if (showBuyHouseCardAllPrices === false) {
            prices = prices.filter(price => {
                return price.id === defaultPrices[price.product];
            });
        }

        prices.sort((a, b) => {

            // First, sort by interval

            if (a.recurring.interval < b.recurring.interval)
                return -1;

            if (a.recurring.interval > b.recurring.interval)
                return 1;

            // Interval is the same

            // Check interval count (1 months before 6 months)

            if (a.recurring.interval_count < b.recurring.interval_count)
                return -1;

            if (a.recurring.interval_count > b.recurring.interval_count)
                return 1;

            // Interval and interval count is the same

            // Prices named "Standard" are presented first

            let defaultPriceA = defaultPrices[a.product];
            let defaultPriceB = defaultPrices[a.product];

            if (a.id === defaultPriceA)
                return -1;

            if (b.id === defaultPriceB)
                return 1;

            /*
            if (a.nickname == "Standard")
                return -1;

            if (b.nickname == "Standard")
                return 1;
            */

            // Then by price

            if (a.unit_amount < b.unit_amount)
                return -1;

            if (a.unit_amount > b.unit_amount)
                return 1;

            return 0;
        });

        return (
            <>
                <table className="table mb-0">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {prices.map((price) =>
                            <tr key={price.id}>
                                <td>{getProduct(price.product, feeFlavor).name}{price.nickname ? ", " + price.nickname : ""}</td>
                                <td>{formatCurrency(price.unit_amount / 100, price.currency.toUpperCase())} / {price.recurring.interval_count == 1 ? price.recurring.interval : price.recurring.interval_count.toString() + " " + price.recurring.interval + "s"}</td>
                                <td>
                                    {viewMode === "buy" &&
                                        <button
                                            type="button"
                                            onClick={() => { purchaseProduct(price.id, feeFlavor); }}
                                            id="status"
                                            className="btn btn-primary"
                                        >Buy</button>
                                    }
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {!showBuyHouseCardAllPrices &&
                    <p><button type="button" onClick={() => { setShowBuyHouseCardAllPrices(true) }} className="btn btn-link">Show more options</button></p>
                }
            </>
        );
    };

    return (
        <AppContent>
            <h1>Subscription</h1>
            <p>This is where you manage your membership fee subscription.</p>
            <p>You must pay the membership fee to be a member of Eldsäl.</p>
            <div className="alert alert-warning mt-3">
                The Eldsäl membership fee has been removed, since we no longer have costs for the Eldsäl house. 
            </div>
            
            {false && !showBuyHouseCard &&
                <>
                    <h5 className="mt-4">Your subscription</h5>

                    {userSubscriptions && syncedUser
                        ?
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Amount</th>
                                    <th>Current period</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {displaySubscriptionList(fee_flavour_housecard, userSubscriptions.housecard_subscriptions)}
                            </tbody>
                        </table>

                        : <span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>
                    }

                    {syncedUser &&
                        <div className="alert alert-info mt-3">
                            If you want to pay for membership from a company, or for other reasons want to handle payments with manual invoices, please contact <a href="mailto:ekonomi@eldsal.se">ekonomi@eldsal.se</a>
                        </div>
                    }

                </>
            }

            {false && showBuyHouseCard !== null && <>
                <h3>Buy membership subscription</h3>
                <p>Select a subscription to sign up for.</p>
                <div className="alert alert-info">
                    All subscriptions give the same benefits, but you may choose to pay different amounts per month depending on your financial ability.<br />
                    Eldsäl relies on donations from members, so picking a donation option is highly appreciated (click "Show more options" for all available prices).
                </div>
                <div>
                    {pps[fee_flavour_housecard].prices ?
                        displayPrices(fee_flavour_housecard, showBuyHouseCard)
                        : <span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>}
                </div>

                <button type="button" onClick={() => setShowBuyHouseCard(null)} className="btn btn-outline-secondary mt-3">Cancel</button>
            </>
            }
            

        </AppContent>
    );
};

export default withAuthenticationRequired(SubscriptionPage);
