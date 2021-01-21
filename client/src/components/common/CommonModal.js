import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import {
    Table
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ModalCloseButton } from './ModalCloseButton';

export const CommonModal = ({ children, hideModal }) => {

    ReactModal.setAppElement("body");

    return (
        <ReactModal isOpen>
            <ModalCloseButton hideModal={hideModal} />
            <div className="d-flex flex-column align-content-stretch" style={{ height: "100%" }}>
                <div className="flex-grow-1">
                    {children}
                </div>
                <div className="flex-grow-0 pt-2">
                    <button className="btn btn-secondary" onClick={hideModal}>Close</button>
                </div>
            </div>
        </ReactModal>
    );
};

export default CommonModal;
