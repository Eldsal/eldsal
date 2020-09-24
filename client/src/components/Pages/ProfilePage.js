import React, { useState, useEffect } from "react";
import Async from "react-async";
import { useAuth0 } from "@auth0/auth0-react";
import Button from "reactstrap/lib/Button";
import SiteHeader from "../Common/SiteHeader";
import axios from "axios";
import Axios from "axios";

const ProfilePage = () => {

    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();

    console.log("user: " + JSON.stringify(user));
    console.log("isAuthenticated: " + JSON.stringify(isAuthenticated));

    //const [valueA, errorA, loadingA] = FetchOneResource(user ? user.sub : null);
    //const resourceA = useAsync(loadUser2, [);

    const [userLoading, setUserLoading] = useState(true);
    const [error, setError] = useState(false);

    const [givenName, setGivenName] = useState("");
    const [familyName, setFamilyName] = useState("");

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
                setGivenName(json.user_metadata.given_name)
                setFamilyName(json.user_metadata.family_name)
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

        setUserLoading(true);
        setError(false);

        console.log("updateProfile");

        var name = givenName + " " + familyName;

        var userArgument = {
            name: name,
            user_metadata: {
                given_name: givenName,
                family_name: familyName,
            }
        }

        // !!! Name can't be updated using SSP access token (must be fixed in backend)
        userArgument = {
            user_metadata: {
                given_name: givenName,
                family_name: familyName,
            }
        }

        //const url = `${process.env.REACT_APP_API}users/${user.sub}`;
        // Using our own API
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
            }).then(
                success => {
                    setUserLoading(false);
                    console.log('changed successfully');
                },
                fail => {
                    setUserLoading(false);
                    setError(true);
                    console.log('failed', fail);
                });
    }

    if (!isAuthenticated)
        return (<div />);

    return (
        <div className="App">
            <SiteHeader />
            <h1>Profile</h1>
            <p>Here the user can view and edit profile information</p>
            {error && (<span>Error</span>)}
            {!error && userLoading && (<span>Loading...</span>)}
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
                </div>
            )}
        </div>);
};

export default ProfilePage;
