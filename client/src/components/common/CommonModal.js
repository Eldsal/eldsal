import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import {
    Table
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ModalCloseButton } from './ModalCloseButton';

export const CommonModal = ({ children, hideModal, buttons = "close", onSave}) => {

    ReactModal.setAppElement("body");

    const makeButton = (button) => {
        switch (button) {
            case "close":
                return <button key={button} className="btn btn-secondary mr-2" onClick={hideModal}>Close</button>;

            case "save":
                return <button key={button} className="btn btn-primary mr-2" onClick={onSave}>Save</button>;

            case "cancel":
                return <button key={button} className="btn btn-secondary mr-2" onClick={hideModal}>Cancel</button>;

            default:
                return <button key={button} disabled className="btn btn-secondary mr-2" title="Unrecognized button">{button}</button>;
        }
    }


    return (
        <ReactModal isOpen>
            <ModalCloseButton hideModal={hideModal} />
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
