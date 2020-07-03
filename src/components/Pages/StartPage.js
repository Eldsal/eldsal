import React from 'react'
import logo from "../../images/eldsal-logo.svg";
const StartPage = () => {

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://eldsal.se"
          target="_blank"
          rel="noopener noreferrer"
        >
          Welcome to Eldsäl's membership site
        </a>
      </header>
    </div>
  );
}

export default StartPage;