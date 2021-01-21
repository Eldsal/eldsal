import React from "react";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import Button from "reactstrap/lib/Button";
import AppContent from "../components/common/AppContent";

const SubscriptionPage = () => {

    const { user, isAuthenticated } = useAuth0();

    if (!isAuthenticated) {
        return <div />;
    }

    return (
        <AppContent>
            <h1>Subscription</h1>
            <p>Here the user may manage the membership subscriptions for membership fee and house access fee.</p>
        </AppContent>
    );
};

export default withAuthenticationRequired(SubscriptionPage);