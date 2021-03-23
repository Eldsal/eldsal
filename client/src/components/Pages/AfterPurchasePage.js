import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import AppContent from "../common/AppContent";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useApi } from '../../hooks/api';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const AfterPurchasePage = () => {
    const { getAccessTokenSilently } = useAuth0();
    const query = useQuery();
    const { apiGet, apiPatch, apiPost } = useApi();

    const checkStatus = async () => {
        const flavour = query.get("flavour");

        apiGet(`check-stripe-session?flavour=${flavour}`)
            .then(success => {
                window.location.href = "/subscription";
            },
                error => alert("An error occurred: " + error)
            );
    };

    useEffect(() => {
        checkStatus();
    }, []);

    return (
        <AppContent>
            <span><FontAwesomeIcon icon="spinner" spin /> Please wait...</span>
        </AppContent>
    );
};

export default withAuthenticationRequired(AfterPurchasePage);
