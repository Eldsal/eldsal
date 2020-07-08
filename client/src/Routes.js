import React, { Suspense, lazy } from "react";
import { withRouter, Switch, Route } from "react-router-dom";
import PageLoader from "./components/Common/PageLoader";

const waitFor = (Tag) => (props) => <Tag {...props} />;
const LoginPage = lazy(() => import("./components/Pages/LoginPage"));
const StartPage = lazy(() => import("./components/Pages/StartPage"));

const Routes = ({ location }) => (
    <Suspense fallback={<PageLoader />}>
        <Switch location={location}>
            <Route path="/Login" component={waitFor(LoginPage)} />
            <Route path="/Start" component={waitFor(StartPage)} />
            <Route path="/" component={waitFor(LoginPage)} />
        </Switch>
    </Suspense>
);

export default withRouter(Routes);
