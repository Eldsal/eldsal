import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Button from "reactstrap/lib/Button";
import SiteHeader from "../Common/SiteHeader";
import logo from "../../images/eldsal-logo.svg";

const ProfilePage = () => {

    const { user, isAuthenticated } = useAuth0();

    if (!isAuthenticated) {
        return <div />;
    }

    return (
        <div className="App">
            <SiteHeader />
            <h1>Profile</h1>
            <p>Here the user can view and edit profile information</p>
        </div>
    );
};

export default ProfilePage;
