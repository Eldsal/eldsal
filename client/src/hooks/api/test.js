import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { get } from "../../api";

export const useGetTest = () => {
  const { getAccessTokenSilently } = useAuth0();



  const [responseCode, setResponseCode] = useState(0);

  const fetch = async () => {
    const accessToken = await getAccessTokenSilently({
      audience: "https://localhost:3002}/api/v2",
      scope: "read:current_user"
    });

    const response = await get("/test", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    setResponseCode(response.status);
  };

  return [responseCode, fetch];
};

export default useGetTest;
