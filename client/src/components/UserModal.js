import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CommonModal from "./common/CommonModal";
import { formatDate, getDateFormValue } from '../utils.js';
import { useApi } from '../hooks/api';
import { useUi } from '../hooks/ui';
import Row from "reactstrap/lib/Row";
import Col from "reactstrap/lib/Col";
import { EditPaymentModal } from './EditPaymentModal';
import { useModal } from "react-modal-hook";

export const UserModal = ({ user, hideModal }) => {

    ReactModal.setAppElement("body");

    const { apiGet, apiPatch, apiGetErrorMessage } = useApi();
    const { alertModal } = useUi(); 

    const [paymentToEdit, setPaymentToEdit] = useState(null);

    const [showPaymentModal, hidePaymentModal] = useModal(() => (
        <EditPaymentModal payment={getPaymentForEditPaymentModal(paymentToEdit)} apiUrl={getApiUrlForEditPaymentModal(paymentToEdit)} onSave={onPaymentSave} hideModal={hidePaymentModal} />
    ), [paymentToEdit]);

    const getPaymentForEditPaymentModal = (payment) => {
        switch (payment) {
            case "membfee":
                return user.payments.membership;
            case "housecard":
                return user.payments.housecard;
            default:
                return null;
        }
    };

    const getApiUrlForEditPaymentModal = (payment) => {
        switch (payment) {
            case "membfee":
                return `admin/update-user-membership/${user.user_id}`;
            case "housecard":
                return `admin/update-user-housecard/${user.user_id}`;
            default:
                return null;
        }
    };

    const editMembershipPayment = () => {
        setPaymentToEdit("membfee");
        showPaymentModal();
    }

    const editHousecardPayment = () => {
        setPaymentToEdit("housecard");
        showPaymentModal();
    }

    const onPaymentSave = (payments) => {
        user.payments = payments;
    }

    const formatProperty = (value) => {
        return emptyStringIfNull(value);
    }

    const formatFee = (paymentProperty) => {

        var hasPayed = paymentProperty.payed;
        var methodName = paymentProperty.methodName;
        var periodStart = paymentProperty.periodStart ? new Date(paymentProperty.periodStart) : null;
        var periodEnd = paymentProperty.periodEnd ? new Date(paymentProperty.periodEnd) : null;
        var interval = paymentProperty.interval;
        var intervalCount = paymentProperty.intervalCount;
        var amount = paymentProperty.amount;
        var currency = paymentProperty.currency;
        var normalizedAmount = paymentProperty.normalizedAmount;
        var normalizedInterval = paymentProperty.normalizedInterval;
        var isError = paymentProperty.error;
        var errorMessage = paymentProperty.errorMessage;

        var formattedAmount;

        if (amount === undefined || amount === null || isNaN(amount) || amount < 0) {
            formattedAmount = "-";
        }
        else {
            formattedAmount = amount.toString();
        }

        var formattedInterval;
        if (interval && intervalCount > 0) {
            formattedInterval = intervalCount.toString() + " " + interval + (intervalCount === 1 ? "" : "s");
        }
        else {
            formattedInterval = "?";
        }

        const displayDetailsTable = () => {
            return <table className="table table-sm mt-2 ml-2">
                <tbody>
                    <tr>
                        <td>Method</td>
                        <td>{methodName}</td>
                    </tr>
                    <tr>
                        <td>Period</td>
                        <td className={hasPayed ? "" : "text-danger"}>{formatDate(periodStart)} - {formatDate(periodEnd)}</td>
                    </tr>
                    <tr>
                        <td>Period length</td>
                        <td>{formattedInterval}</td>
                    </tr>
                    <tr>
                        <td>Amount</td>
                        <td>{formattedAmount} {currency} &nbsp; <small>({normalizedAmount} {currency}/{normalizedInterval})</small></td>
                    </tr>
                </tbody>
            </table>
        }

        if (isError) {
            return <span className="text-danger">ERROR: {errorMessage}</span>;
        }
        else {
            if (hasPayed) {
                return <div className="d-inline-block">
                    <span className="text-success">Payed</span><br />
                    {displayDetailsTable()}
                </div>;
            }
            else {
                return <div className="d-inline-block">
                    <span className="text-danger">Not payed</span> {periodEnd ? <span>(expired)</span> : ""}<br />
                    {periodStart && periodEnd && displayDetailsTable()}
                </div>;
            }
        }
    }

    function isEmpty(value) {
        return value === null || value === "" || typeof (value) == "undefined";
    }

    function emptyStringIfNull(value) {
        if (isEmpty(value))
            return "";
        else
            return value;
    }

    const syncUser = async () => {
        apiPatch(`admin/sync-user/${user.user_id}`)
            .then(success => {
                user.payments = success.data.payments;
                alertModal("success", "Stripe payments are synced");
            },
                error => {
                    alertModal("error", "Stripe syncing failed");
                }
            )
    }

    return (
        <CommonModal hideModal={hideModal}>
            <h3>Member</h3>
            {user ?
                <>
                    <Row>
                        <Col>
                            <p>Details for member "{user.name}"</p>
                            <table className="table table-sm">
                                <tbody>
                                    <tr>
                                        <td>
                                            First name
                                </td>
                                        <td>
                                            {formatProperty(user.given_name)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            Surname
                                </td>
                                        <td>
                                            {formatProperty(user.family_name)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            Email
                                </td>
                                        <td>
                                            {formatProperty(user.email)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            Phone number
                                </td>
                                        <td>
                                            {formatProperty(user.phone_number)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            Birth date
                                </td>
                                        <td>
                                            {formatProperty(user.birth_date)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            Address line 1
                                </td>
                                        <td>
                                            {formatProperty(user.address_line_1)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            Address line 2
                                </td>
                                        <td>
                                            {formatProperty(user.address_line_2)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            Postal code
                                </td>
                                        <td>
                                            {formatProperty(user.postal_code)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            City
                                </td>
                                        <td>
                                            {formatProperty(user.city)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            Country
                                </td>
                                        <td>
                                            {formatProperty(user.country)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            Roles
                                </td>
                                        <td>
                                            {formatProperty(user.roles)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Col>
                        <Col>
                            <h5>Subscriptions</h5>
                            <div><strong>Membership fee</strong></div>
                            <div>
                                {formatFee(user.payments.membership)}<br /><button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={() => editMembershipPayment()}>Edit</button>
                            </div>

                            <div className="mt-3"><strong>House card fee</strong></div>
                            <div>
                                {formatFee(user.payments.housecard)}<br /><button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={() => editHousecardPayment()}>Edit</button>
                            </div>
                            <div className="mt-2"><button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={() => syncUser()}>Sync Stripe payments</button></div>
                        </Col>
                    </Row>
                </>
                : (<span>No user selected</span>)}
        </CommonModal >
    );
};

export default UserModal;
