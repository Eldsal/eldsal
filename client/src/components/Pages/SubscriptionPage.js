import React from "react";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import AppContent from "../Common/AppContent";

const SubscriptionPage = () => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_KEY_ELDSAL_ORG);


  const handleClick = async () => {
    // Get Stripe.js instance
    const stripe = await stripePromise;
    const accessToken = await getAccessTokenSilently();

    const response = await axios.post("/api/create-checkout-session", {}, {
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
    const response = await axios.get("/api/checkout-success",  {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  };

  if (!isAuthenticated) {
    return <div />;
  }



  return (
    <AppContent>
      <h1>Subscription</h1>
      <p>Here the user may manage the membership subscriptions for membership fee and house access fee.</p>


      <button type="button" onClick={handleClick} id="test" className="btn btn-primary">Test</button>
      <button type="button" onClick={checkStatus} id="test" className="btn btn-primary">Status</button>

    </AppContent>
  );
};

export default withAuthenticationRequired(SubscriptionPage);
