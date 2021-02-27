import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CommonModal from "./common/CommonModal";
import { formatDate, getDateFormValue } from '../utils.js';
import { useApi } from '../hooks/api';

export const UserModal = ({ user, hideModal }) => {

    ReactModal.setAppElement("body");

    const { apiGet, apiPatch, apiGetErrorMessage } = useApi();

    const [editMembership, setEditMembership] = useState(false);
    const [editMembershipPayed, setEditMembershipPayed] = useState(false);
    const [editMembershipMethod, setEditMembershipMethod] = useState("");
    const [editMembershipPayedUntil, setEditMembershipPayedUntil] = useState(null);
    const [editMembershipAmount, setEditMembershipAmount] = useState(null);
    const [editMembershipSaving, setEditMembershipSaving] = useState(false);
    const [editMembershipSaveError, setEditMembershipSaveError] = useState(false);
    const [editMembershipSaveErrorMessage, setEditMembershipSaveErrorMessage] = useState(null);

    const [editHousecard, setEditHousecard] = useState(false);
    const [editHousecardPayed, setEditHousecardPayed] = useState(false);
    const [editHousecardMethod, setEditHousecardMethod] = useState("");
    const [editHousecardPayedUntil, setEditHousecardPayedUntil] = useState(null);
    const [editHousecardAmount, setEditHousecardAmount] = useState(null);
    const [editHousecardSaving, setEditHousecardSaving] = useState(false);
    const [editHousecardSaveError, setEditHousecardSaveError] = useState(false);
    const [editHousecardSaveErrorMessage, setEditHousecardSaveErrorMessage] = useState(null);

    const formatProperty = (value) => {
        return emptyStringIfNull(value);
    }

    const formatFee = (paymentProperty) => {

        var hasPayed = paymentProperty.payed;
        var payedUntilDate = paymentProperty.payedUntil ? new Date(paymentProperty.payedUntil) : null;
        var methodName = paymentProperty.methodName;
        var amount = paymentProperty.amount;
        var amountPeriod = paymentProperty.amountPeriod;
        var isError = paymentProperty.error;
        var errorMessage = paymentProperty.errorMessage;

        var formattedAmount;

        if (amount === undefined || amount === null || isNaN(amount) || amount < 0) {
            formattedAmount = "-";
        }
        else {
            formattedAmount = amount.toString();
        }

        if (isError) {
            return <span className="text-danger">ERROR: {errorMessage}</span>;
        }
        else {
            if (hasPayed) {
                return <span><span className="text-success">Payed</span> ({formattedAmount} SEK/{amountPeriod} until {formatDate(payedUntilDate)}, method: {methodName})</span>;
            }
            else {
                return <span><span className="text-danger">Not payed</span>{payedUntilDate ? " (expired " + formatDate(payedUntilDate) + ", method: " + methodName + ")" : ""}</span>;
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
            payedUntil: editMembershipPayedUntil,
            amount: editMembershipAmount
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
            payedUntil: editHousecardPayedUntil,
            amount: editHousecardAmount
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
        setEditMembershipPayedUntil(getDateFormValue(user.payments.membership.payedUntil));
        setEditMembershipAmount(user.payments.membership.amount);

        setEditHousecard(false);
        setEditHousecardSaving(false);
        setEditHousecardSaveError(false);
        setEditHousecardPayed(user.payments.housecard.payed);
        setEditHousecardMethod(user.payments.housecard.method);
        setEditHousecardPayedUntil(getDateFormValue(user.payments.housecard.payedUntil));
        setEditHousecardAmount(user.payments.housecard.amount);

    }, [user]);

    return (
        <CommonModal hideModal={hideModal}>
            <h3>Member</h3>
            {user ?
                <>
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
                            <tr>
                                <td>
                                    Membership fee
                                </td>
                                <td>
                                    {!editMembership &&
                                        <>{formatFee(user.payments.membership)} <button type="button" className="btn btn-secondary btn-sm float-right" onClick={() => showEditMembership()}>Edit</button></>}
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
                                                        <label htmlFor="edit-membership-payed-until">Payed until</label>
                                                        <input type="date" className="form-control" id="edit-membership-payed-until" value={editMembershipPayedUntil} onChange={(evt) => setEditMembershipPayedUntil(evt.target.value)} />
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
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    House card fee
                                </td>
                                <td>
                                    {!editHousecard &&
                                        <>{formatFee(user.payments.housecard)} <button type="button" className="btn btn-secondary btn-sm float-right" onClick={() => showEditHousecard()}>Edit</button></>}
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
                                                        <label htmlFor="edit-housecard-payed-until">Payed until</label>
                                                        <input type="date" className="form-control" id="edit-housecard-payed-until" value={editHousecardPayedUntil} onChange={(evt) => setEditHousecardPayedUntil(evt.target.value)} />
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
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </>
                : (<span>No user selected</span>)}
        </CommonModal >
    );
};

export default UserModal;
