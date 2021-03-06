import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { useModal } from "react-modal-hook";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CommonModal from "../components/common/CommonModal";

export const useUi = () => {

    ReactModal.setAppElement("body");

    const [messageArgs, setMessageArgs] = useState(undefined);

    class MessageArgs {
        constructor(buttons, title, message, okLabel, closeLabel, cancelLabel, callbackFunction, callbackOnDismiss, icon, iconClass) {
            this.buttons = buttons;
            this.title = title;
            this.message = message;
            this.okLabel = okLabel;
            this.closeLabel = closeLabel;
            this.cancelLabel = cancelLabel;
            this.callbackFunction = callbackFunction;
            this.callbackOnDismiss = callbackOnDismiss;
            this.icon = icon;
            this.iconClass = iconClass;
        }
    }

    const [showMessageModal, hideMessageModal] = useModal(() => (
        messageArgs &&
        <CommonModal hideModal={hideMessageModal} buttons={messageArgs.buttons} callback={messageArgs.callbackFunction} callbackOnDismiss={messageArgs.callbackOnDismiss} useDynamicHeight={true} closeLabel={messageArgs.okBtnText} okLabel={messageArgs.okLabel} cancelLabel={messageArgs.cancelLabel}>
                {messageArgs &&
                    <>
                        <h3>{messageArgs.icon && <FontAwesomeIcon icon={messageArgs.icon} className={"pr-2 " + messageArgs.iconClass} />}{messageArgs.title}</h3>
                        <p>{messageArgs.message}</p>
                    </>}
            </CommonModal >
    ), [messageArgs]);

    const alertModal = (type, message, title = null, callbackFunction = null) => {
        var icon;
        var iconClass;
        var defaultTitle;

        switch (type) {
            case "info":
                defaultTitle = "Information";
                icon = "info-circle";
                iconClass = "text-info";
                break;

            case "success":
                defaultTitle = "Information";
                icon = "check";
                iconClass = "text-success";
                break;

            case "warning":
                defaultTitle = "Warning";
                icon = "exclamation-circle";
                iconClass = "text-warning";
                break;

            case "error":
                defaultTitle = "Error";
                icon = "exclamation-triangle";
                iconClass = "text-danger";
                break;

            default:
                defaultTitle = "";
                icon = null;
                iconClass = null;
                break;
        }

        if (!title)
            title = defaultTitle;

        setMessageArgs(new MessageArgs("close", title, message, null, "Close", null, callbackFunction, true, icon, iconClass));

        showMessageModal();
    };

    const confirmModal = (type, message, title, callbackFunction = null, callbackOnDismiss = false, confirmLabel = "OK", cancelLabel = "Cancel") => {

        var icon;
        var iconClass;
        var defaultTitle;

        switch (type) {
            case "info":
                defaultTitle = "Information";
                icon = "info-circle";
                iconClass = "text-info";
                break;

            case "success":
                defaultTitle = "Information";
                icon = "check";
                iconClass = "text-success";
                break;

            case "warning":
                defaultTitle = "Warning";
                icon = "exclamation-circle";
                iconClass = "text-warning";
                break;

            case "error":
                defaultTitle = "Error";
                icon = "exclamation-triangle";
                iconClass = "text-danger";
                break;

            default:
                defaultTitle = "";
                icon = null;
                iconClass = null;
                break;
        }

        if (!title)
            title = defaultTitle;

        setMessageArgs(new MessageArgs("ok,cancel", title, message, confirmLabel ? confirmLabel : "OK", null, cancelLabel ? cancelLabel : "Cancel", callbackFunction, callbackOnDismiss, icon, iconClass));

        showMessageModal();
    };

    return { alertModal, confirmModal };
};

export default useUi;
