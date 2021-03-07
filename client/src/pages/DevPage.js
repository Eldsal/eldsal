import React, { useState } from "react";
import {
    Nav, NavItem, NavLink, TabContent, TabPane
} from 'reactstrap';
import classnames from 'classnames';
import { withAuthenticationRequired } from "@auth0/auth0-react";
import AppContent from "../components/common/AppContent";
import { useUser } from '../hooks/user';
import { useUi } from '../hooks/ui';

const DevPage = () => {

    const { isUserLoading, isDeveloper } = useUser();

    const [activeTab, setActiveTab] = useState('home');

    const toggleTab = tab => {
        if (activeTab !== tab) setActiveTab(tab);
    }

    const { alertModal, confirmModal } = useUi();

    const test = () => {
        console.log("test");
        alertModal(null, "Test message", "Test title", (button) => alert("Closed: " + button));
    };

    const test2 = () => {
        console.log("test 2");
        confirmModal("info", "Test message 2", "Test title 2", (button) => alert("Closed 2: " + button));
    };

    if (isUserLoading) {
        return <div />
    }
    else if (!isDeveloper) {
        return <AppContent>
            <div className="alert alert-danger">Permission denied</div>
        </AppContent>
    }
    else {
        return (
            <AppContent>
                <h1>Developer</h1>
                <Nav tabs>
                    <NavItem>
                        <NavLink
                            className={classnames({ active: activeTab === 'home' })}
                            onClick={() => { toggleTab('home'); }}
                        >
                            Home
                        </NavLink>
                    </NavItem>
                </Nav>
                <TabContent activeTab={activeTab} className="mt-4">
                    <TabPane tabId="home">
                        <p>Welcome to the developer page</p>
                        <button className="btn btn-secondary" onClick={() => test()}>Test</button>
                        <button className="btn btn-secondary ml-2" onClick={() => test2()}>Test 2</button>
                    </TabPane>
                </TabContent>
            </AppContent >
        );
    }
};

export default withAuthenticationRequired(DevPage);
