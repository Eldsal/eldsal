import React, { useEffect, useState } from "react";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import Button from "reactstrap/lib/Button";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import Row from "reactstrap/lib/Row";
import Col from "reactstrap/lib/Col";
import AppContent from "../components/common/AppContent";
import StripeSubscriptionComponent from "../components/Subscription/StripeSubscriptionComponent";
import { useApi } from '../hooks/api';
import { UserSubscriptionsModal } from '../components/UserSubscriptionsModal';
import { useModal } from "react-modal-hook";


const SubscriptionPage = () => {
    const { getAccessTokenSilently } = useAuth0();
    const stripePromises = { housecard: loadStripe(process.env.REACT_APP_STRIPE_KEY_ELDSAL_AB), membfee: loadStripe(process.env.REACT_APP_STRIPE_KEY_ELDSAL_ORG) };
    const [pps, setPps] = useState({
        membfee: { prices: [], products: [] },
        housecard: { prices: [], products: [] }
    });
    const { apiGet } = useApi();

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
        const accessToken = await getAccessTokenSilently();

        const response = await axios.get("/api/subscriptions", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        setSubscriptions(response.data);
    };

    const fetchPrices = async () => {
        const accessToken = await getAccessTokenSilently();

        const response = await axios.get("/api/prices?flavour=membfee", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        let newPps = { ...pps };

        newPps = { ...newPps, membfee: response.data };

        const response2 = await axios.get("/api/prices?flavour=housecard", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        newPps = { ...newPps, housecard: response2.data };
        setPps(newPps);
    };


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
        const accessToken = await getAccessTokenSilently();

        const response = await axios.post(`/api/create-checkout-session?flavour=${flavour}&price=${priceId}`, {}, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });


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
        const accessToken = await getAccessTokenSilently();
        const response = await axios.get("/api/subscription", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
    };

    const getPriceRows = (flavour) => {
        if (pps[flavour]) {
            return pps[flavour].prices.map((price) => (
                <Row>
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

    return (
        <AppContent>
            <h1>Subscription</h1>
            <p>Here the user may manage the membership subscriptions for membership fee and house access fee.</p>




            <Row>
                <button type="button" onClick={() => showModal()} id="status" className="btn btn-primary">Status</button>
            </Row>

            <Row>
                {getPriceRows("membfee")}
            </Row>

            <Row>
                {getPriceRows("housecard")}
            </Row>



        </AppContent>
    );
};

export default withAuthenticationRequired(SubscriptionPage);
