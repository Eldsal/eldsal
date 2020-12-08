import React from "react";
import AppHeader from "../Common/AppHeader";

const AppContent = (props) => {

    const { showHeader } = props;

    const hideHeader = showHeader === "false";

    return (
        <div className="App">
            {!hideHeader && <AppHeader />}
            <div className="App-body">
                {props.children}
            </div>
        </div>
    );
};

export default AppContent;
