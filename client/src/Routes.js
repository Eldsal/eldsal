import React, { Suspense, lazy } from "react";
import { withRouter, Switch, Route } from "react-router-dom";
import PageLoader from "./components/Common/PageLoader";

const waitFor = (Tag) => (props) => <Tag {...props} />;
const LoginPage = lazy(() => import("./components/Pages/LoginPage"));
const StartPage = lazy(() => import("./components/Pages/StartPage"));
const SubscriptionPage = lazy(() => import("./components/Pages/SubscriptionPage"));
const ProfilePage = lazy(() => import("./components/Pages/ProfilePage"));

const Routes = ({ location }) => (
    <Suspense fallback={<PageLoader />}>
        <Switch location={location}>
            <Route path="/login" component={waitFor(LoginPage)} />
            <Route path="/start" component={waitFor(StartPage)} />
            <Route path="/subscription" component={waitFor(SubscriptionPage)} />
            <Route path="/profile" component={waitFor(ProfilePage)} />
            <Route path="/" component={waitFor(LoginPage)} />
        </Switch>
    </Suspense>
);

export default withRouter(Routes);
