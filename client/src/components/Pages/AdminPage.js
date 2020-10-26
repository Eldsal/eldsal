import React from "react";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import Button from "reactstrap/lib/Button";
import AppContent from "../Common/AppContent";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useUser } from '../../hooks/user';

const AdminPage = () => {

    const { isUserLoading, isAdmin } = useUser();

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
                <p>Here is the admin page</p>
            </AppContent>
        );
    }
};

export default withAuthenticationRequired(AdminPage);
