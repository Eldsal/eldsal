import React, {useEffect} from "react";
import {useLocation} from "react-router-dom";
import {useAuth0, withAuthenticationRequired} from "@auth0/auth0-react";
import axios from "axios";
import AppContent from "../common/AppContent";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const AfterPurchasePage = () => {
  const { getAccessTokenSilently } = useAuth0();
  const query = useQuery();

  const checkStatus = async () => {
    const flavour = query.get("flavour");
    const accessToken = await getAccessTokenSilently();
    await axios.get(`/api/check-stripe-session?flavour=${flavour}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  };

  useEffect(() => {
    checkStatus().then(window.location.href = "/subscription");
  }, []);

  return (
    <AppContent>
      <h1>Please wait</h1>
    </AppContent>
  );
};

export default withAuthenticationRequired(AfterPurchasePage);
