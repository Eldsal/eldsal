import React from "react";

import { BrowserRouter as Router } from "react-router-dom";
// App Routes
import Routes from "./Routes";

import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'

library.add(fas);

function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <Routes />
    </Router>
  );
}

export default App;
