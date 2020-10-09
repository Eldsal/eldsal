import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Button from "reactstrap/lib/Button";
import AppContent from "../Common/AppContent";

const StartPage = () => {

    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();

    if (!isAuthenticated) {
        return <div />
    }

    return (
        <AppContent>
            <h1>Start</h1>
            <p>Here is a summary of the user's profile info and membership status</p>
        </AppContent>
    );
};

export default StartPage;
