import React, { useEffect } from "react";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import axios from "axios";
import AppContent from "../Common/AppContent";

const AfterPurchasePage = () => {
  const { getAccessTokenSilently } = useAuth0();

  const checkStatus = async () => {
    const accessToken = await getAccessTokenSilently();
    await axios.get("/api/check-stripe-session", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  };

  useEffect(() => {
    checkStatus();
    window.location.href = "/subscription";
  }, [checkStatus]);

  return (
    <AppContent>
      <h1>Please wait</h1>
    </AppContent>
  );
};

export default withAuthenticationRequired(AfterPurchasePage);
