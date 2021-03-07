import React, { Suspense, lazy } from "react";
import { withRouter, Switch, Route } from "react-router-dom";
import PageLoader from "./components/common/PageLoader";

const waitFor = (Tag) => (props) => <Tag {...props} />;
const LoginPage = lazy(() => import("./pages/LoginPage"));
const StartPage = lazy(() => import("./pages/StartPage"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const DevPage = lazy(() => import("./pages/DevPage"));
const AfterPurchasePage = lazy(() => import("./components/Pages/AfterPurchasePage"));

const Routes = ({ location }) => (
    <Suspense fallback={<PageLoader />}>
        <Switch location={location}>
            <Route path="/login" component={waitFor(LoginPage)} />
            <Route path="/start" component={waitFor(StartPage)} />
            <Route path="/subscription" component={waitFor(SubscriptionPage)} />
            <Route path="/profile" component={waitFor(ProfilePage)} />
            <Route path="/admin" component={waitFor(AdminPage)} />
            <Route path="/dev" component={waitFor(DevPage)} />
            <Route path="/afterpurchase" component={waitFor(AfterPurchasePage)} />
            <Route path="/" component={waitFor(LoginPage)} />
        </Switch>
    </Suspense>
);

export default withRouter(Routes);
