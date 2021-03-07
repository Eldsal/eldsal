import axios from "axios";
import { useAuth0 } from "@auth0/auth0-react";

export const useApi = () => {

    const { getAccessTokenSilently } = useAuth0();

    const apiGet = async (url) => {
        return getAccessTokenSilently()
            .then(accessToken => {
                return axios.get('/api/' + url,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    })
            })
    };

    const apiPatch = async (url, args) => {
        return getAccessTokenSilently()
            .then(accessToken => {
                return axios.patch('/api/' + url,
                    args,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    })
            })
    };

    /**
     * Get an error message sent by server side (as JSON response body { error: 'message' })
     * @param {any} error
     */
    const apiGetErrorMessage = (error) => {
        if (error && error.response && error.response.data && error.response.data.error)
            return error.response.data.error.toString();
        else
            return null;
    }

    return { apiGet, apiPatch, apiGetErrorMessage };
};

export default useApi;
