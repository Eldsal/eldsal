import React from 'react';

import { BrowserRouter as Router } from "react-router-dom";
// App Routes
import Routes from "./Routes";

function App() {

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <Routes />
    </Router>
  );
}

export default App;
