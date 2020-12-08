import React from "react";
import { withAuthenticationRequired } from "@auth0/auth0-react";
import AppContent from "../Common/AppContent";
import { useApi } from '../../hooks/api';

const StartPage = () => {

    const { apiGet } = useApi();

    return (
            <AppContent>
                <h1>Start</h1>
                <p>Here is a summary of the user's profile info and membership status</p>
            </AppContent>
        );
    };

    export default withAuthenticationRequired(StartPage);
