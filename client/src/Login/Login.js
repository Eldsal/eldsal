import React from "react";

import { Input, Button, Alert } from "reactstrap";

import { post } from "../api";
import { setAccessToken } from "../helpers";

export const LoginComponent = () => {
  const [email, setEmail] = React.useState();
  const [password, setPassword] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState();

  const authHandler = async () => {
    try {
      setLoading(true);
      setError(false);

      await post("/login", { email, password })
        .then(({ token }) => {
          localStorage.setItem("authorizationToken", token);
          setAccessToken(token);
        });
    } catch (err) {
      setLoading(false);
      if (err.message === "Request failed with status code 403") {
        setError("Wrong username and/or password");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <>
      <Input label="Email" placeholder="säl@eldsäl.se" type="email" onChange={(e) => setEmail(e.target.value)} value={email} />
      <Input label="Password" placeholder="******" type="password" onChange={(e) => setPassword(e.target.value)} value={password} />

      <Button disabled={loading} text={loading ? "Please wait" : "Sign In"} onClick={authHandler} />

      {error ? (<Alert>${error}</Alert>) : ""}
    </>
  );
};

export default LoginComponent;
