import React from "react";
import ReactDOM from "react-dom";
import "./styles/app.scss";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

ReactDOM.render(
    <Auth0Provider
        domain={process.env.REACT_APP_AUTH0_DOMAIN}
        clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
        redirectUri={window.location.origin}
        returnTo={window.location.origin}
        audience={process.env.REACT_APP_AUDIENCE}
        scope="read:current_user update:current_user read:current_user_metadata update:current_user_metadata"
        useRefreshTokens="true"
    >
        <App />
    </Auth0Provider>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
