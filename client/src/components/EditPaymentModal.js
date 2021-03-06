import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CommonModal from "./common/CommonModal";
import { formatDate, getDateFormValue } from '../utils.js';
import { useApi } from '../hooks/api';
import Row from "reactstrap/lib/Row";
import Col from "reactstrap/lib/Col";

export const EditPaymentModal = ({ payment, apiUrl, onSave, hideModal }) => {

    ReactModal.setAppElement("body");

    const { apiGet, apiPatch, apiGetErrorMessage } = useApi();

    const [payed, setPayed] = useState(false);
    const [method, setMethod] = useState("");
    const [periodStart, setPeriodStart] = useState();
    const [interval, setInterval] = useState();
    const [intervalCount, setIntervalCount] = useState();
    const [amount, setAmount] = useState();
    const [currency, setCurrency] = useState();
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const [saveErrorMessage, setSaveErrorMessage] = useState(null);

    const _callback = (button) => {
        if (button == "save") {
            _onSave();
            // Return false, to don't automatically hide the dialog
            return false;
        }
    }

    const _onSave = async () => {

        var args = {
            payed: payed,
            method: method,
            periodStart: periodStart,
            interval: interval,
            intervalCount: intervalCount,
            amount: amount,
            currency: "SEK"
        };

        setSaving(true);
        setSaveError(false);
        setSaveErrorMessage(null);

        apiPatch(apiUrl, args)
            .then(
                success => {
                    console.log("Success");
                    onSave(success.data.payments);
                    setSaving(false);
                    hideModal();
                },
                err => {
                    console.log(err);
                    setSaving(false);
                    setSaveErrorMessage(apiGetErrorMessage(err));
                    setSaveError(true);
                })
            .catch(err => {
                console.log(err);
                setSaving(false);
                setSaveErrorMessage(apiGetErrorMessage(err));
                setSaveError(true);
            });
    }

    const undefIfNull = (value) => {
        return value === null ? undefined : value;
    }

    useEffect(() => {
        setSaving(false);
        setSaveError(false);
        if (payment) {
            setPayed(payment.payed);
            setMethod(payment.method ? payment.method : "manual");
            setPeriodStart(undefIfNull(payment.periodStart));
            setInterval(payment.interval ? payment.interval : payment.normalizedInterval);
            setIntervalCount(undefIfNull(payment.intervalCount));
            setAmount(undefIfNull(payment.amount));
            setCurrency(payment.currency ? payment.currency : "SEK" );
        }
        else {
            setPayed(false);
            setMethod(undefined);
            setPeriodStart(undefined);
            setInterval(undefined);
            setIntervalCount(undefined);
            setAmount(undefined);
            setCurrency("SEK");
        }
    }, [payment]);


    return (
        <CommonModal hideModal={hideModal} buttons="save,cancel" callback={_callback}>
            <h3>Edit payment</h3>
            {payment ?
                <>
                    <div className="form-check">
                        <input type="checkbox" className="form-check-input" id="edit-payment-payed" checked={payed} onChange={(evt) => setPayed(evt.target.checked)} />
                        <label className="form-check-label" htmlFor="edit-payment-payed">Has payed</label>
                    </div>
                    {payed &&
                        <>
                            <div className="form-group">
                                <label htmlFor="edit-payment-method">Method</label>
                                <select className="form-control" id="edit-payment-method" value={method} onChange={(evt) => setMethod(evt.target.value)} >
                                    <option value="">(Select)</option>
                                    <option value="manual">Manual</option>
                                    <option value="stripe">Stripe</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="edit-payment-period-start">Period start</label>
                                <input type="date" className="form-control" id="edit-payment-period-start" value={periodStart} onChange={(evt) => setPeriodStart(evt.target.value)} />
                            </div>
                            <div className="form-row">
                                <div className="form-group col-6">
                                    <label htmlFor="edit-payment-period-interval-count">Period length</label>
                                    <input type="number" className="form-control" id="edit-payment-period-interval-count" value={intervalCount} onChange={(evt) => setIntervalCount(evt.target.value)} />
                                </div>
                                <div className="form-group col-6">
                                    <label htmlFor="edit-payment-period-interval">&nbsp;</label>
                                    <select className="form-control" id="edit-payment-period-interval" value={interval} onChange={(evt) => setInterval(evt.target.value)} >
                                        <option value="">(Select)</option>
                                        <option value="year">year(s)</option>
                                        <option value="month">month(s)</option>
                                    </select>
                                </div>
                            </div>
                            {payment && payment.amount > 0 && payment.currency != "SEK" &&
                                <div className="alert alert-warning">
                                    The amount was set to {payment.amount} {payment.currency}.<br />
                        You must enter a amount in SEK.
                        </div>
                            }
                            <div className="form-group">
                                <label htmlFor="edit-payment-amount">Amount</label>
                                <div className="input-group">
                                    <input type="number" className="form-control" id="edit-payment-amount" value={currency == "SEK" ? amount : null} onChange={(evt) => setAmount(evt.target.value)} />
                                    <div className="input-group-append">
                                        <span className="input-group-text">SEK</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    }
                    {saveError && <div className="alert alert-danger mt-2">Save failed {saveErrorMessage && <span>({saveErrorMessage})</span>}</div>}
                    {saving &&
                        <div className="mt-4"><span><FontAwesomeIcon icon="spinner" spin /> Saving...</span></div>
                    }
                </>
                : (<span>No payment selected</span>)}
        </CommonModal >
    );
};

export default EditPaymentModal;
