import React from "react";
import { Redirect, Route } from "react-router-dom";

// eslint-disable-next-line react/prop-types
export const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...rest}
    render={(props) => (localStorage.getItem("authorizationToken") ? (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Component {...props} />
    ) : (
      <Redirect
        to={{
          pathname: "/",
          // eslint-disable-next-line react/prop-types
          state: { from: props.location }
        }}
      />
    ))}
  />
);

export default PrivateRoute;
