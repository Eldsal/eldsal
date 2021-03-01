import React, { useState } from "react";
import {
    Nav, NavItem, NavLink, TabContent, TabPane
} from 'reactstrap';
import classnames from 'classnames';
import { withAuthenticationRequired } from "@auth0/auth0-react";
import AppContent from "../components/common/AppContent";
import { useUser } from '../hooks/user';
import AdminUserList from "../components/AdminUserList";
import AdminSubscriptionList from "../components/AdminSubscriptionList";
import { formatUtcTimestamp } from "../utils";

const AdminPage = () => {

    const { isUserLoading, isAdmin } = useUser();

    const [activeTab, setActiveTab] = useState('home');

    const toggleTab = tab => {
        if (activeTab !== tab) setActiveTab(tab);
    }

    if (isUserLoading) {
        return <div />
    }
    else if (!isAdmin) {
        return <AppContent>
            <div className="alert alert-danger">Permission denied</div>
        </AppContent>
    }
    else {
        return (
            <AppContent>
                <h1>Admin</h1>
                <Nav tabs>
                    <NavItem>
                        <NavLink
                            className={classnames({ active: activeTab === 'home' })}
                            onClick={() => { toggleTab('home'); }}
                        >
                            Home
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                            className={classnames({ active: activeTab === 'users' })}
                            onClick={() => { toggleTab('users'); }}
                        >
                            Members
                        </NavLink>
                    </NavItem>
                    <NavItem>
                        <NavLink
                            className={classnames({ active: activeTab === 'subscriptions' })}
                            onClick={() => { toggleTab('subscriptions'); }}
                        >
                            Subscriptions
                        </NavLink>
                    </NavItem>
                </Nav>
                <TabContent activeTab={activeTab} className="mt-4">
                    <TabPane tabId="home">
                        <p>Welcome to the admin page</p>
                    </TabPane>
                    <TabPane tabId="users">
                        {activeTab === "users" && (<AdminUserList />)}
                    </TabPane>
                    <TabPane tabId="subscriptions">
                        {activeTab === "subscriptions" && (<AdminSubscriptionList />)}
                    </TabPane>
                </TabContent>
            </AppContent >
        );
    }
};

export default withAuthenticationRequired(AdminPage);
