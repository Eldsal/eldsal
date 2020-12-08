import React, { useState, useEffect } from "react";
import {
    Nav, NavItem, NavLink, TabContent, TabPane, Table
} from 'reactstrap';
import classnames from 'classnames';
import { withAuthenticationRequired } from "@auth0/auth0-react";
import AppContent from "../Common/AppContent";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useUser } from '../../hooks/user';
import { useApi } from '../../hooks/api';

const AdminPage = () => {

    const { isUserLoading, isAdmin } = useUser();
    const { apiGet } = useApi();

    const [activeTab, setActiveTab] = useState('home');
    const [usersLoaded, setUsersLoaded] = useState(false);
    const [users, setUsers] = useState(null);

    switch (activeTab) {
        case "users":
            if (!usersLoaded) {

                apiGet(`getUsers`)
                    .then(
                        success => {
                            console.log(success)
                            setUsers(success.data);
                            setUsersLoaded(true);
                        },
                        fail => {
                            console.log("Fail: " + fail);
                        })
                    .catch(reason => {
                        console.log("Fail: " + reason);
                    });
            }
            break;
    }

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
                            Users
                        </NavLink>
                    </NavItem>
                </Nav>
                <TabContent activeTab={activeTab} className="mt-4">
                    <TabPane tabId="home">
                        <p>Welcome to the admin page</p>
                    </TabPane>
                    <TabPane tabId="users">
                        <h3>Users</h3>
                        {!usersLoaded && (<span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>)}
                        {usersLoaded && (
                            <Table>
                                <thead>
                                    <tr>
                                        <th>User ID</th>
                                        <th>ID</th>
                                        <th>Title</th>
                                        <th>Completed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        console.log(users)
                                    }
                                    {users.length ?
                                        users.map(todo => (
                                            <tr>
                                                <td>{todo.userId}</td>
                                                <td>{todo.id}</td>
                                                <td>{todo.title}</td>
                                                <td>{todo.completed}</td>
                                            </tr>
                                        ))
                                        :
                                        (<tr>
                                            <td>-</td>
                                            <td>-</td>
                                            <td>-</td>
                                            <td>-</td>
                                        </tr>)
                                    }
                                </tbody>
                            </Table>
                            )}
                    </TabPane>
                </TabContent>
            </AppContent >
        );
    }
};

export default withAuthenticationRequired(AdminPage);
