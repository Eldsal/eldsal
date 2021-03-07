import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CommonModal from "./common/CommonModal";
import { formatDate, getDateFormValue } from '../utils.js';
import { useApi } from '../hooks/api';
import Row from "reactstrap/lib/Row";
import Col from "reactstrap/lib/Col";
import { EditPaymentModal } from './EditPaymentModal';
import { useModal } from "react-modal-hook";

export const UserModal = ({ user, hideModal }) => {

    ReactModal.setAppElement("body");

    const { apiGet, apiPatch, apiGetErrorMessage } = useApi();

    const [editMembership, setEditMembership] = useState(false);
    const [editMembershipPayed, setEditMembershipPayed] = useState(false);
    const [editMembershipMethod, setEditMembershipMethod] = useState("");
    const [editMembershipPeriodStart, setEditMembershipPeriodStart] = useState(null);
    const [editMembershipInterval, setEditMembershipInterval] = useState(null);
    const [editMembershipIntervalCount, setEditMembershipIntervalCount] = useState(null);
    const [editMembershipAmount, setEditMembershipAmount] = useState(null);
    const [editMembershipCurrency, setEditMembershipCurrency] = useState(null);
    const [editMembershipSaving, setEditMembershipSaving] = useState(false);
    const [editMembershipSaveError, setEditMembershipSaveError] = useState(false);
    const [editMembershipSaveErrorMessage, setEditMembershipSaveErrorMessage] = useState(null);

    const [editHousecard, setEditHousecard] = useState(false);
    const [editHousecardPayed, setEditHousecardPayed] = useState(false);
    const [editHousecardMethod, setEditHousecardMethod] = useState("");
    const [editHousecardPeriodStart, setEditHousecardPeriodStart] = useState(null);
    const [editHousecardInterval, setEditHousecardInterval] = useState(null);
    const [editHousecardIntervalCount, setEditHousecardIntervalCount] = useState(null);
    const [editHousecardAmount, setEditHousecardAmount] = useState(null);
    const [editHousecardCurrency, setEditHousecardCurrency] = useState(null);
    const [editHousecardSaving, setEditHousecardSaving] = useState(false);
    const [editHousecardSaveError, setEditHousecardSaveError] = useState(false);
    const [editHousecardSaveErrorMessage, setEditHousecardSaveErrorMessage] = useState(null);

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
                        <td>Period interval</td>
                        <td>{formattedInterval}</td>
                    </tr>
                    <tr>
                        <td>Amount</td>
                        <td>{formattedAmount} {currency}</td>
                    </tr>
                    <tr>
                        <td>Price / {normalizedInterval}</td>
                        <td>{normalizedAmount} {currency}</td>
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

    const showEditMembership = async () => {
        setEditMembershipSaving(false);
        setEditMembershipSaveError(false);
        setEditMembership(true)
    }

    const saveMembership = async () => {
        var args = {
            payed: editMembershipPayed,
            method: editMembershipMethod,
            periodStart: editMembershipPeriodStart,
            interval: editMembershipInterval,
            intervalCount: editMembershipIntervalCount,
            amount: editMembershipAmount,
            currency: editMembershipCurrency
        };

        setEditMembershipSaving(true);
        setEditMembershipSaveError(false);
        setEditMembershipSaveErrorMessage(null);

        apiPatch(`admin/update-user-membership/${user.user_id}`, args)
            .then(
                success => {
                    console.log("Success");
                    user.payments = success.data.payments;
                    setEditMembershipSaving(false);
                    setEditMembership(false);
                },
                err => {
                    console.log(err);
                    setEditMembershipSaving(false);
                    setEditMembershipSaveErrorMessage(apiGetErrorMessage(err));
                    setEditMembershipSaveError(true);
                })
            .catch(err => {
                console.log(err);
                setEditMembershipSaving(false);
                setEditMembershipSaveErrorMessage(apiGetErrorMessage(err));
                setEditMembershipSaveError(true);
            });
    }

    const showEditHousecard = async () => {
        setEditHousecardSaving(false);
        setEditHousecardSaveError(false);
        setEditHousecard(true)
    }

    const saveHousecard = async () => {
        var args = {
            payed: editHousecardPayed,
            method: editHousecardMethod,
            periodStart: editHousecardPeriodStart,
            interval: editHousecardInterval,
            intervalCount: editHousecardIntervalCount,
            amount: editHousecardAmount,
            currency: editHousecardCurrency
        };

        setEditHousecardSaving(true);
        setEditHousecardSaveError(false);
        setEditHousecardSaveErrorMessage(null);

        apiPatch(`admin/update-user-housecard/${user.user_id}`, args)
            .then(
                success => {
                    console.log("Success");
                    user.payments = success.data.payments;
                    setEditHousecardSaving(false);
                    setEditHousecard(false);
                },
                err => {
                    console.log(err);
                    setEditHousecardSaving(false);
                    setEditHousecardSaveErrorMessage(apiGetErrorMessage(err));
                    setEditHousecardSaveError(true);
                })
            .catch(err => {
                console.log(err);
                setEditHousecardSaving(false);
                setEditHousecardSaveErrorMessage(apiGetErrorMessage(err));
                setEditHousecardSaveError(true);
            });
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

    useEffect(() => {
        // Update edit fee form values
        setEditMembership(false);
        setEditMembershipSaving(false);
        setEditMembershipSaveError(false);
        setEditMembershipPayed(user.payments.membership.payed);
        setEditMembershipMethod(user.payments.membership.method);
        setEditMembershipPeriodStart(getDateFormValue(user.payments.membership.periodStart));
        setEditMembershipInterval(user.payments.membership.interval);
        setEditMembershipIntervalCount(user.payments.membership.intervalCount);
        setEditMembershipAmount(user.payments.membership.amount);
        setEditMembershipCurrency(user.payments.membership.currency);

        setEditHousecard(false);
        setEditHousecardSaving(false);
        setEditHousecardSaveError(false);
        setEditHousecardPayed(user.payments.housecard.payed);
        setEditHousecardMethod(user.payments.housecard.method);
        setEditHousecardPeriodStart(getDateFormValue(user.payments.housecard.periodStart));
        setEditHousecardInterval(user.payments.housecard.interval);
        setEditHousecardIntervalCount(user.payments.housecard.intervalCount);
        setEditHousecardAmount(user.payments.housecard.amount);
        setEditHousecardCurrency(user.payments.housecard.currency);

    }, [user]);

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
                                {!editMembership &&
                                    <>{formatFee(user.payments.membership)}<br /><button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={() => editMembershipPayment()}>Edit</button></>}
                                {editMembership &&
                                    <div className="mt-3 mb-3">
                                        <strong>Edit membership payment</strong><br />
                                        <div className="form-check">
                                            <input type="checkbox" className="form-check-input" id="edit-membership-payed" checked={editMembershipPayed} onChange={(evt) => setEditMembershipPayed(evt.target.checked)} />
                                            <label className="form-check-label" htmlFor="edit-membership-payed">Has payed</label>
                                        </div>
                                        {editMembershipPayed &&
                                            <>
                                                <div className="form-group">
                                                    <label htmlFor="edit-membership-method">Method</label>
                                                    <select className="form-control" id="edit-membership-method" value={editMembershipMethod} onChange={(evt) => setEditMembershipMethod(evt.target.value)} >
                                                        <option value="">(Select)</option>
                                                        <option value="manual">Manual</option>
                                                        <option value="stripe">Stripe</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="edit-membership-amount">Amount</label>
                                                    <div className="input-group">
                                                        <input type="number" className="form-control" id="edit-membership-amount" value={editMembershipAmount} onChange={(evt) => setEditMembershipAmount(evt.target.value)} />
                                                        <div className="input-group-append">
                                                            <span className="input-group-text">SEK/year</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="edit-membership-period-start">Period start</label>
                                                    <input type="date" className="form-control" id="edit-membership-period-start" value={editMembershipPeriodStart} onChange={(evt) => setEditMembershipPeriodStart(evt.target.value)} />
                                                </div>
                                            </>
                                        }
                                        {editMembershipSaveError && <div className="alert alert-danger mt-2">Save failed {editMembershipSaveErrorMessage && <span>({editMembershipSaveErrorMessage})</span>}</div>}
                                        <div className="mt-2">
                                            {editMembershipSaving &&
                                                <div className="mt-4"><span><FontAwesomeIcon icon="spinner" spin /> Saving...</span></div>
                                            }
                                            {!editMembershipSaving &&
                                                <>
                                                    <button type="button" className="btn btn-primary btn-sm" onClick={() => saveMembership()}>Save</button>
                                                    <button type="button" className="btn btn-secondary btn-sm ml-2" onClick={() => setEditMembership(false)}>Cancel</button>
                                                </>
                                            }
                                        </div>
                                    </div>}
                            </div>

                            <div className="mt-3"><strong>House card fee</strong></div>
                            <div>
                                {!editHousecard &&
                                    <>{formatFee(user.payments.housecard)}<br /><button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={() => editHousecardPayment()}>Edit</button></>}
                                {editHousecard &&
                                    <div className="mt-3 mb-3">
                                        <strong>Edit house card payment</strong><br />
                                        <div className="form-check">
                                            <input type="checkbox" className="form-check-input" id="edit-housecard-payed" checked={editHousecardPayed} onChange={(evt) => setEditHousecardPayed(evt.target.checked)} />
                                            <label className="form-check-label" htmlFor="edit-housecard-payed">Has payed</label>
                                        </div>
                                        {editHousecardPayed &&
                                            <>
                                                <div className="form-group">
                                                    <label htmlFor="edit-housecard-method">Method</label>
                                                    <select className="form-control" id="edit-housecard-method" value={editHousecardMethod} onChange={(evt) => setEditHousecardMethod(evt.target.value)} >
                                                        <option value="">(Select)</option>
                                                        <option value="manual">Manual</option>
                                                        <option value="stripe">Stripe</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="edit-housecard-amount">Amount</label>
                                                    <div className="input-group">
                                                        <input type="number" className="form-control" id="edit-housecard-amount" value={editHousecardAmount} onChange={(evt) => setEditHousecardAmount(evt.target.value)} />
                                                        <div className="input-group-append">
                                                            <span className="input-group-text">SEK/month</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="edit-housecard-period-start">Period start</label>
                                                    <input type="date" className="form-control" id="edit-housecard-period-start" value={editHousecardPeriodStart} onChange={(evt) => setEditHousecardPeriodStart(evt.target.value)} />
                                                </div>
                                            </>
                                        }
                                        {editHousecardSaveError && <div className="alert alert-danger mt-2">Save failed {editHousecardSaveErrorMessage && <span>({editHousecardSaveErrorMessage})</span>}</div>}
                                        <div className="mt-2">
                                            {editHousecardSaving &&
                                                <div className="mt-4"><span><FontAwesomeIcon icon="spinner" spin /> Saving...</span></div>
                                            }
                                            {!editHousecardSaving &&
                                                <>
                                                    <button type="button" className="btn btn-primary btn-sm" onClick={() => saveHousecard()}>Save</button>
                                                    <button type="button" className="btn btn-secondary btn-sm ml-2" onClick={() => setEditHousecard(false)}>Cancel</button>
                                                </>
                                            }
                                        </div>
                                    </div>}
                            </div>
                        </Col>
                    </Row>
                </>
                : (<span>No user selected</span>)}
        </CommonModal >
    );
};

export default UserModal;
