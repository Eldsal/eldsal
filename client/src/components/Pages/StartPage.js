import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Button from "reactstrap/lib/Button";
import logo from "../../images/eldsal-logo.svg";
import { useGetTest } from "../../hooks/api/test";

const LogoutButton = () => {
    const { logout } = useAuth0();

    return <Button onClick={() => logout()}>Log Out</Button>;
};

const StartPage = () => {

    const { user, isAuthenticated } = useAuth0();
    const [responseCode, fetch] = useGetTest();

    if (!isAuthenticated) {
        return (
            <div className="App">
                <header className="App-header">
                    <p>You are not logged in</p>
                    <p><a href="/Login">Login</a></p>
                    <div>
                        <LogoutButton />
                    </div>
                </header>
            </div>);
    }

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    Logged in: {user.name}
                </p>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <a
                    onClick={() => fetch()}
                >
                    {/* eslint-disable-next-line react/no-unescaped-entities */}
          Welcome to Eldsäl's membership site {responseCode}
                </a>
            </header>
            <div>
                <LogoutButton />
            </div>
        </div>
    );
};

export default StartPage;
