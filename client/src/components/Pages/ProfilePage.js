import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Button from "reactstrap/lib/Button";
import AppContent from "../Common/AppContent";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const ProfilePage = () => {

    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();

    console.log("user: " + JSON.stringify(user));
    console.log("isAuthenticated: " + JSON.stringify(isAuthenticated));

    const [userLoading, setUserLoading] = useState(true);
    const [error, setError] = useState(false);

    var saveStates = { "none": 0, "saving": 1, "saved": 2, "error": 3 };

    const [givenName, setGivenName] = useState("");
    const [familyName, setFamilyName] = useState("");
    const [saveState, setSaveState] = useState(saveStates.none);

    const loadUser = () => {

        console.log("Load user: " + user.sub.toString());

        const url = `${process.env.REACT_APP_API}users/${user.sub}`;

        return getAccessTokenSilently()
            .then(accessToken => fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                }
            }))
            .then(res => { setUserLoading(false); return res; })
            .then(res => {
                if (res.ok)
                    return res;
                else {
                    setError(true);
                    return Promise.reject(res);
                }
            })
            .then(res => res.json())
            .then(json => {
                setGivenName(json.user_metadata ? json.user_metadata.given_name : "")
                setFamilyName(json.user_metadata ? json.user_metadata.family_name : "")
                return json;
            });
    }

    useEffect(() => {
        if (!isAuthenticated)
            return;

        console.log("useEffect");

        loadUser();
    }, [user]);

    var userProfile = {
        given_name: "",
        family_name: ""
    }

    const updateProfile = async () => {

        setSaveState(saveStates.saving);

        console.log("updateProfile");

        var name = givenName + " " + familyName;

        var userArgument = {
            name: name,
            user_metadata: {
                given_name: givenName,
                family_name: familyName,
            }
        }

        const url = `/api/updateUser/${user.sub}`;

        return getAccessTokenSilently()
            .then(accessToken => {
                axios.patch(url, {
                    ...userArgument
                },
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
                    .then(
                        success => {
                            setSaveState(saveStates.saved);
                        },
                        fail => {
                            setSaveState(saveStates.error);
                        })
                    .catch(reason => {
                        setSaveState(saveStates.error);
                    })
            })
            .then(
                success => { },
                fail => {
                    setUserLoading(false);
                    setError(true);
                    setSaveState(saveStates.error);
                });
    }

    if (!isAuthenticated) {
        return <div />
    }

    function renderSaveState() {
        switch (saveState) {
            case saveStates.none:
                return "";
            case saveStates.saving:
                return <span><FontAwesomeIcon icon="spinner" spin/> Saving...</span>;
            case saveStates.saved:
                return <div className="alert alert-success"><FontAwesomeIcon icon="check"/> Your profile is updated</div>;
            case saveStates.error:
                return <div className="alert alert-danger"><FontAwesomeIcon icon="exclamation-circle"/> An error occurred updating your profile</div>;
            default:
                return "";
        }
    }


    return (
        <AppContent>
            <h1>Profile</h1>
            <p>Here the user can view and edit profile information</p>
            {error && (<span>Error</span>)}
            {!error && userLoading && (<span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>)}
            {!error && !userLoading && (
                <div>
                    <div className="form-group">
                        <label htmlFor="inp_given_name">First name</label>
                        <input id="inp_given_name" value={givenName} onChange={(evt) => setGivenName(evt.target.value)} type="text" className="form-control" placeholder="First name" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="inp_family_name">Surname</label>
                        <input id="inp_family_name" value={familyName} onChange={(evt) => setFamilyName(evt.target.value)} type="text" className="form-control" placeholder="Surname" required />
                    </div>
                    <button type="button" onClick={updateProfile} id="submit" name="submit" className="btn btn-primary pull-right">Update</button>
                    <div className="mt-4">{renderSaveState()}</div>
                </div>
            )}
        </AppContent>);
};

export default ProfilePage;
