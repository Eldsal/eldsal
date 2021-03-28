import React, { useEffect, useState } from "react";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import Button from "reactstrap/lib/Button";
import { loadStripe } from "@stripe/stripe-js";
import Row from "reactstrap/lib/Row";
import Col from "reactstrap/lib/Col";
import AppContent from "../components/common/AppContent";
import { useApi } from '../hooks/api';
import { useModal } from "react-modal-hook";
import { formatUtcTimestamp, formatDate, fee_flavour_membership, fee_flavour_housecard, getFeeFlavourName } from '../utils.js';
import { useUser } from '../hooks/user';
import { useUi } from '../hooks/ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const SubscriptionPage = () => {
    const stripePromises = { housecard: loadStripe(process.env.REACT_APP_STRIPE_KEY_ELDSAL_AB), membfee: loadStripe(process.env.REACT_APP_STRIPE_KEY_ELDSAL_ORG) };
    const { userInfo, isUserLoading } = useUser();
    const { apiGet, apiPatch, apiPost } = useApi();
    const { alertModal, confirmModal } = useUi();

    const [pps, setPps] = useState({
        membfee: { prices: null, products: null },
        housecard: { prices: null, products: null }
    });

    const [userSubscriptions, setUserSubscriptions] = useState(null);
    const [syncedUser, setSyncedUser] = useState(null);
    const [showBuyMembfee, setShowBuyMembfee] = useState(false);
    const [showBuyHouseCard, setShowBuyHouseCard] = useState(false);


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
                        console.log(success.data);
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
                        console.log("Success");
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

    const buySubscription = (feeFlavor) => {
        switch (feeFlavor) {
            case fee_flavour_membership:
                setShowBuyHouseCard(false);
                setShowBuyMembfee(true);
                break;

            case fee_flavour_housecard:
                setShowBuyMembfee(false);
                setShowBuyHouseCard(true);
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
            case fee_flavour_membership:
                feeName = "Membership";
                syncedPayment = syncedUser.payments.membfee;
                break;

            case fee_flavour_housecard:
                feeName = "House card";
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
                            <td colSpan="4" className="text-danger">{item.read_error_message}</td>
                            <td><button className="btn btn-primary btn-sm" onClick={() => buySubscription(feeFlavor)} title="Buy a subscription">Buy</button></td>
                        </>
                    }
                    {!item.read_error &&
                        <>
                            <td>{item.product_name}{item.price_name ? " (" + item.price_name + ")" : ""}</td>
                            <td>{item.amount} {item.currency}</td>
                            <td>{item.interval_count.toString() + " " + (item.interval_count == 1 ? item.interval : item.interval + "s")}</td>
                            <td>{formatUtcTimestamp(item.current_period_start)} - {formatUtcTimestamp(item.current_period_end)}</td>
                            <td><button className="btn btn-outline-secondary btn-sm" onClick={() => cancelSubscription(feeFlavor, item)} title="Cancel the subscription">Cancel  subscription</button></td>
                        </>
                    }
                </tr>
            ))
            :
            (syncedPayment && (syncedPayment.payed || syncedPayment.periodEnd) ?
                <tr className={syncedPayment.payed ? "" : "text-danger"}>
                    <td>{feeName}{syncedPayment.payed ? "" : " (EXPIRED)"}</td>
                    <td>{syncedPayment.amount} {syncedPayment.currency}</td>
                    <td>{syncedPayment.intervalCount.toString() + " " + (syncedPayment.intervalCount == 1 ? syncedPayment.interval : syncedPayment.interval + "s")}</td>
                    <td>{formatDate(syncedPayment.periodStart)} - {formatDate(syncedPayment.periodEnd)}</td>
                    <td>
                        {syncedPayment.payed ?
                            <span className="text-muted">(Manual payment)</span>
                            : <button className="btn btn-primary btn-sm" onClick={() => buySubscription(feeFlavor)} title="Buy a subscription">Buy</button>}
                    </td>

                </tr>
                :
                <tr>
                    <td>{feeName}</td>
                    <td colSpan="3" className="text-muted">(None)</td>
                    <td><button className="btn btn-primary btn-sm" onClick={() => buySubscription(feeFlavor)} title="Buy a subscription">Buy</button></td>
                </tr>);
    }

    const displayPrices = (feeFlavor) => {

        var prices = pps[feeFlavor].prices;

        if (prices == null)
            return null;

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

            if (a.nickname == "Standard")
                return -1;

            if (b.nickname == "Standard")
                return 1;

            // Then by price

            if (a.unit_amount < b.unit_amount)
                return -1;

            if (a.unit_amount > b.unit_amount)
                return 1;

            return 0;
        });

        return (
            <table className="table">
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
                            <td>{price.unit_amount / 100} {price.currency.toUpperCase()} / {price.recurring.interval_count == 1 ? price.recurring.interval : price.recurring.interval_count.toString() + " " + price.recurring.interval + "s"}</td>
                            <td>
                                <button
                                    type="button"
                                    onClick={() => { purchaseProduct(price.id, feeFlavor); }}
                                    id="status"
                                    className="btn btn-primary"
                                >Buy</button>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>);
    };

return (
    <AppContent>
        <h1>Subscription</h1>
        <p>Here the user may manage the subscriptions for membership fee and house card fee.</p>
        <p>You must pay the membership fee to be a member of Eldsäl.</p>
        <p>A house card subscription is optional. With a house card subscription you always have access to the Eldsäl house when it's not booked, can more easily book events in the house and can attend events in the house for free (unless organizer request special fee).</p>

        {!showBuyMembfee && !showBuyHouseCard &&
            <>
                <h5 className="mt-4">Your subscriptions</h5>

                {userSubscriptions && syncedUser
                    ?
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Amount</th>
                                <th>Interval</th>
                                <th>Current period</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {displaySubscriptionList(fee_flavour_membership, userSubscriptions.membfee_subscriptions)}
                            {displaySubscriptionList(fee_flavour_housecard, userSubscriptions.housecard_subscriptions)}
                        </tbody>
                    </table>

                    : <span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>
            }

            { syncedUser && !syncedUser.payments.membership.payed &&
                <div className="alert alert-warning mt-3">
                    If you have recently created your profile, any existing payments of membership and house card subscriptions may not be displayed here.<br />
                    We will update your payments shortly. If you have questions about why payments are not showing, please contact <a href={"mailto:" + process.env.REACT_APP_WEBMASTER_EMAIL}>{process.env.REACT_APP_WEBMASTER_EMAIL}</a>.
                    </div>
            }
            </>
        }

        {showBuyMembfee && <>
            <h5>Buy membership subscription</h5>
            <p>Select a subscription to sign up for</p>
            <div>
                {pps[fee_flavour_membership].prices ?
                    displayPrices(fee_flavour_membership)
                    : <span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>}
            </div>
            <button type="button" onClick={() => setShowBuyMembfee(false)} className="btn btn-outline-secondary mt-3">Cancel</button>
        </>
        }

        {showBuyHouseCard && <>
            <h5>Buy house card subscription</h5>
            <p>Select a subscription to sign up for</p>
            <div>
                {pps[fee_flavour_housecard].prices ?
                    displayPrices(fee_flavour_housecard)
                    : <span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>}
            </div>

            <button type="button" onClick={() => setShowBuyHouseCard(false)} className="btn btn-outline-secondary mt-3">Cancel</button>
        </>
        }

    </AppContent>
);
};

export default withAuthenticationRequired(SubscriptionPage);
