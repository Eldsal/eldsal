import React, { Suspense, lazy } from "react";
import { withRouter, Switch, Route } from "react-router-dom";
import PageLoader from "./components/Common/PageLoader";

const waitFor = (Tag) => (props) => <Tag {...props} />;
const StartPage = lazy(() => import("./components/Pages/StartPage"));

const Routes = ({ location }) => (
  <Suspense fallback={<PageLoader />}>
    <Switch location={location}>
      <Route path="/" component={waitFor(StartPage)} />
    </Switch>
  </Suspense>
);

export default withRouter(Routes);
