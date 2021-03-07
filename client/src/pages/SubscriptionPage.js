import React, { useEffect, useState } from "react";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import Button from "reactstrap/lib/Button";
import { loadStripe } from "@stripe/stripe-js";
import Row from "reactstrap/lib/Row";
import Col from "reactstrap/lib/Col";
import AppContent from "../components/common/AppContent";
import StripeSubscriptionComponent from "../components/Subscription/StripeSubscriptionComponent";
import { useApi } from '../hooks/api';
import { UserSubscriptionsModal } from '../components/UserSubscriptionsModal';
import { useModal } from "react-modal-hook";
import { formatUtcTimestamp, getDateFormValue, fee_flavour_membership, fee_flavour_housecard, getFeeFlavourName } from '../utils.js';
import { useUser } from '../hooks/user';
import { useUi } from '../hooks/ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const SubscriptionPage = () => {
    const stripePromises = { housecard: loadStripe(process.env.REACT_APP_STRIPE_KEY_ELDSAL_AB), membfee: loadStripe(process.env.REACT_APP_STRIPE_KEY_ELDSAL_ORG) };
    const { userInfo, isUserLoading } = useUser();
    const { apiGet, apiPatch, apiPost } = useApi();
    const { alertModal, confirmModal } = useUi();

    const [pps, setPps] = useState({
        membfee: { prices: [], products: [] },
        housecard: { prices: [], products: [] }
    });
    const [subscriptions, setSubscriptions] = useState({ membfeeSubs: [], housecardSubs: [] });
    const [userSubscriptions, setUserSubscriptions] = useState(null);

    const [showModal, hideModal] = useModal(() => (
        <UserSubscriptionsModal user={userSubscriptions} hideModal={hideModal} />
    ), [userSubscriptions]);

    const showSubscriptionsModal = () => {
        showModal();
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

    const fetchSubscriptions = async () => {
        apiGet("/api/subscriptions")
            .then(success => {
                setSubscriptions(success.data);
            })
    };

    const fetchPrices = async () => {

        const response = await apiGet("prices?flavour=membfee");

        let newPps = { ...pps };

        newPps = { ...newPps, membfee: response.data };

        const response2 = await apiGet("prices?flavour=housecard");

        newPps = { ...newPps, housecard: response2.data };

        console.log("fetchPrices response")
        console.log(newPps)

        setPps(newPps);
    };

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
        getSubscriptions();
        fetchSubscriptions();
        fetchPrices();
        // eslint-disable-next-line
    }, []);



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

    const checkStatus = async () => {
        const response = await apiGet("subscription");
    };

    const getPriceRows = (flavour) => {
        if (pps[flavour]) {
            return pps[flavour].prices.map((price) => (
                <Row key={price.id}>
                    <Col>{price.nickname}, {getProduct(price.product, flavour).description}, {price.unit_amount / 100} kr</Col>
                    <Col>
                        <button
                            type="button"
                            onClick={() => { purchaseProduct(price.id, flavour); }}
                            id="status"
                            className="btn btn-primary"
                        >Buy!
            </button>
                    </Col>
                </Row>
            ));
        }

        return null;
    };

    function displaySubscriptionList(feeType, subscriptionList) {
        return <table className="table">
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
                {subscriptionList && subscriptionList.length ?
                    subscriptionList.map(item => (
                        <tr key={item}>
                            {item.read_error &&
                                <td colSpan="5" className="text-danger">{item.read_error_message}</td>
                            }
                            {!item.read_error &&
                                <>
                                    <td>{item.product_name}{item.price_name ? " (" + item.price_name + ")" : ""}</td>
                                    <td>{item.amount} {item.currency}</td>
                                    <td>{item.interval_count == 1 ? item.interval : item.interval_count.toString() + " " + item.interval + "s"}</td>
                                    <td>{formatUtcTimestamp(item.current_period_start)} - {formatUtcTimestamp(item.current_period_end)}</td>
                                    <td><button className="btn btn-outline-secondary btn-sm" onClick={() => cancelSubscription(feeType, item)} title="Cancel the subscription">Cancel</button></td>
                                </>
                            }
                        </tr>
                    ))
                    :
                    (<tr>
                        <td colSpan="4" className="text-muted">(None)</td>
                    </tr>)
                }
            </tbody>
        </table>
    }


    return (
        <AppContent>
            <h1>Subscription</h1>
            <p>Here the user may manage the membership subscriptions for membership fee and house access fee.</p>

            <h5>Your subscriptions</h5>

            {userSubscriptions
                ?
                <>
                    <strong>Membership</strong>
                    {displaySubscriptionList(fee_flavour_membership, userSubscriptions.membfee_subscriptions)}
                    <strong>Housecard</strong>
                    {displaySubscriptionList(fee_flavour_housecard, userSubscriptions.housecard_subscriptions)}
                </>

                : <span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>
            }

            <Row>
                <button type="button" onClick={() => showModal()} id="status" className="btn btn-primary">Status</button>
            </Row>

            <Row>
                {getPriceRows(fee_flavour_membership)}
            </Row>

            <Row>
                {getPriceRows(fee_flavour_housecard)}
            </Row>



        </AppContent>
    );
};

export default withAuthenticationRequired(SubscriptionPage);
