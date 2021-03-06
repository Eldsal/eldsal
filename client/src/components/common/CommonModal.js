import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import {
    Table
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ModalCloseButton } from './ModalCloseButton';

export const CommonModal = ({ children, hideModal, buttons = "close", callback = null, callbackOnDismiss = false, useDynamicHeight = false, closeLabel = "Close", okLabel = "OK", saveLabel =" Save", cancelLabel = "Cancel"}) => {

    ReactModal.setAppElement("body");

    const _onButton = (button) =>
    {
        var useCallback;

        switch (button) {
            case "close":
                useCallback = callbackOnDismiss === true;
                break;

            case "cancel":
                useCallback = callbackOnDismiss === true;
                break;

            case "ok":
                useCallback = true;
                break;

            case "save":
                useCallback = true;
                break;

            default:
                useCallback = false;
                break;
        }

        // Callback
        if (useCallback && typeof (callback) === "function") {
            var result = callback(button);
            // If callback returns false, don't hide modal
            if (result === false)
                return;
        }
        hideModal();
    }

    const makeButton = (button) => {
        switch (button) {
            case "close":
                return <button key={button} className="btn btn-secondary mr-2" onClick={() => _onButton(button)}>{closeLabel ? closeLabel : "Close"}</button>;

            case "save":
                return <button key={button} className="btn btn-primary mr-2" onClick={() => _onButton(button)}>{saveLabel ? saveLabel : "Save"}</button>;

            case "ok":
                return <button key={button} className="btn btn-primary mr-2" onClick={() => _onButton(button)}>{okLabel ? okLabel : "OK"}</button>;

            case "cancel":
                return <button key={button} className="btn btn-secondary mr-2" onClick={() => _onButton(button)}>{cancelLabel ? cancelLabel : "Cancel"}</button>;

            default:
                return <button key={button} disabled className="btn btn-secondary mr-2" title="Unrecognized button">{button}</button>;
        }
    }

    const style = useDynamicHeight === true ? { content: { inset: "40px 40px auto 40px" } } : {};

    return (
        <ReactModal isOpen style={style} >
            <ModalCloseButton hideModal={() => _onButton("close")} />
            <div className="d-flex flex-column align-content-stretch" style={{ height: "100%" }}>
                <div className="flex-grow-1">
                    {children}
                </div>
                <div className="flex-grow-0 pt-2">
                    {buttons && buttons.split(",").map(x => makeButton(x))}
                </div>
            </div>
        </ReactModal>
    );
};

export default CommonModal;
