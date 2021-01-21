import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const ModalCloseButton = ({hideModal}) => {

    return (
        <div className="modal-close-button" onClick={hideModal}><FontAwesomeIcon icon="times-circle" /></div>
    );
};

export default ModalCloseButton;
