import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export const useUser = () => {
    const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();

    const [isUserLoading, setUserIsLoading] = useState(true)
    const [isUserError, setUserIsError] = useState(false)
    const [userInfo, setUserInfo] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {

        if (!isAuthenticated)
            return;

        loadUser();
    }, [user, isAuthenticated]);

    const loadUser = () => {

        const url = `${process.env.REACT_APP_API}users/${user.sub}`;

        return getAccessTokenSilently()
            .then(accessToken => fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                }
            }))
            .then(res => {
                return res;
            })
            .then(res => {
                if (res.ok) {
                    return res;
                }
                else {
                    setUserIsError(true);
                    setUserIsLoading(false);
                    return Promise.reject(res);
                }
            })
            .then(res => res.json())
            .then(json => {
                setUserInfo(json);

                if (json.app_metadata) {
                    if (json.app_metadata.roles === "admin") {
                        setIsAdmin(true);
                    }
                }

                setUserIsLoading(false);

                return json;
            });
    }

    return { isUserLoading, isUserError, user, isAuthenticated, userInfo, isAdmin };
};

export default useUser;
