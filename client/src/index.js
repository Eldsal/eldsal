import React from "react";
import ReactDOM from "react-dom";
import "./styles/app.scss";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App";
import * as serviceWorker from "./serviceWorker";

ReactDOM.render(
    <Auth0Provider
        domain="dev-eldsal.eu.auth0.com"
        clientId="NU69FpPswLd6akcFnlYwqM4HoFmNg3Ny"
        redirectUri="http://localhost:3000/Start"
        returnTo="http://localhost:3000/Login"
    >
        <App />
    </Auth0Provider>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
