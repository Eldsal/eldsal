import React from "react";
import logo from "../../images/eldsal-logo.svg";
import { LoginComponent } from "../../Login/Login";

const StartPage = () => (
  <div className="App">
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <p>
        Edit <code>src/components/Pages/StartPage.js</code> and save to reload.
      </p>
      <a
        className="App-link"
        href="https://eldsal.se"
        target="_blank"
        rel="noopener noreferrer"
      >
        {/* eslint-disable-next-line react/no-unescaped-entities */}
        Welcome to Eldsäl's membership site
      </a>
    </header>
    <div>
      <LoginComponent />
    </div>
  </div>
);

export default StartPage;
