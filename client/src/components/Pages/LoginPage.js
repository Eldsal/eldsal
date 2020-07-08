import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Button from "reactstrap/lib/Button";
import logo from "../../images/eldsal-logo.svg";
import { useGetTest } from "../../hooks/api/test";

const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();

  return <Button onClick={() => loginWithRedirect()}>Log In</Button>;
};


const LoginPage = () => {
  const [responseCode, fetch] = useGetTest();


  return (
      <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Login Page
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
        <LoginButton />
      </div>
    </div>
  );
};

export default LoginPage;
