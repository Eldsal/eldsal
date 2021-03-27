import React from "react";
import { Redirect } from 'react-router-dom'
import { useAuth0 } from "@auth0/auth0-react";
import Button from "reactstrap/lib/Button";

const LoginButton = () => {
    const { loginWithRedirect } = useAuth0();

    return <Button onClick={() => loginWithRedirect()}>Login / Sign up</Button>;
};


const LoginPage = () => {

    const {
        isAuthenticated,
    } = useAuth0();

    if (isAuthenticated) {
        return <Redirect to='/start' />
    }

    return (
        <div className="App">
            <div className="mt-4 text-center">
                <img className="mb-4" src="/eldsal.png" alt="Eldsäl" />
                <h1>
                    Welcome to Eldsäl
                </h1>
                <p>{process.env.REACT_APP_AUTH0_DOMAIN}</p>
                <p className="Login-text">
                    Welcome to the membership site for the Eldsäl association in Göteborg.<br/>
                    Login to manage your membership and payments.
                </p>
            </div>
            <div className="mt-4 text-center">
                <LoginButton />
            </div>
        </div>
    );
};

export default LoginPage;
