import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CommonModal from "./common/CommonModal";
import { formatCurrency, formatUtcTimestamp, getFeeFlavourName } from '../utils.js';
import { useUi } from '../hooks/ui';
import { useApi } from '../hooks/api';

export const StripePayoutModal = ({ payout, hideModal }) => {

    ReactModal.setAppElement("body");

    const { apiGet } = useApi();

    const [transactions, setTransactions] = useState(null);

    useEffect(() => {
        // Load transactions
        setTransactions(null);

        if (payout) {
            apiGet(`admin/get-stripe-payout-transactions?flavour=${payout.flavour}&payout=${payout.payout_id}`)
                .then(
                    success => {
                        const data = success.data;
                        if (typeof (data) === "object") {
                            setTransactions(success.data);
                        }
                        else {
                            console.log("Invalid response");
                        }
                    },
                    fail => {
                        console.log("Fail: " + fail);
                    })
                .catch(reason => {
                    console.log("Fail: " + reason);
                });
        }

    }, [payout]);

    return (
        <CommonModal hideModal={hideModal}>
            <h3>Stripe payout</h3>
            {payout ?
                <>

                    <table className="table table-sm">
                        <tbody>

                            <tr>
                                <td>
                                    Payout ID
                                </td>
                                <td>
                                    {payout.payout_id}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Type
                                </td>
                                <td>
                                    {getFeeFlavourName(payout.flavour)}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Created
                                </td>
                                <td>
                                    {formatUtcTimestamp(payout.created)}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Arrival date
                                </td>
                                <td>
                                    {formatUtcTimestamp(payout.arrival_date)}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Amount
                                </td>
                                <td>
                                    {formatCurrency(payout.amount, payout.currency, true)}
                                </td>
                            </tr>
                            {payout.failure_code !== null &&
                                <>
                                    <tr>
                                        <td className="text-danger">
                                            Failure code
                                </td>
                                        <td className="text-danger">
                                            {payout.failure_code}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-danger">
                                            Failure message
                                </td>
                                        <td className="text-danger">
                                            {payout.failure_message}
                                        </td>
                                    </tr>
                                </>
                            }
                        </tbody>
                    </table>

                    <h5>Transactions</h5>
                    <table className="table table-sm">
                        <thead>
                            <tr>
                                <th>Created</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Source</th>
                                <th className="text-right pr-3">Amount</th>
                                <th className="text-right pr-3">Fee</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions
                                ?
                                <>
                                    {transactions.transactions.length > 0 ?
                                        transactions.transactions.map(item => (
                                            <tr key={item.transaction_id}>
                                                <td>{formatUtcTimestamp(item.created, true)}</td>
                                                <td>{item.type}</td>
                                                <td>{item.description}</td>
                                                <td>{item.source}</td>
                                                <td className="text-right pr-3">{formatCurrency(item.amount, item.currency, true)}</td>
                                                <td className="text-right">{item.fee_amount === null || item.fee_amount === 0 ? <span className="text-muted">(None)</span> : formatCurrency(item.fee_amount, item.fee_currency, true)}{item.fee}</td>
                                            </tr>
                                        ))
                                        :
                                        (<tr>
                                            <td colSpan="4">(No transactions found)</td>
                                        </tr>)
                                    }
                                </>
                                : <tr>
                                    <td colSpan="4"><FontAwesomeIcon icon="spinner" spin /> Loading...</td>
                                </tr>
                            }
                        </tbody>
                    </table>

                    {transactions &&
                        <>
                            <h5>Summary</h5>
                            <table className="table table-sm">
                                <tbody>
                                    <tr>
                                        <td><strong>Total payments</strong></td>
                                    <td className="text-right">{formatCurrency(transactions.charges_amount, transactions.charges_currency, true)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Total fees</strong></td>
                                    <td className="text-right">{formatCurrency(-transactions.fees_amount, transactions.fees_currency, true)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Balance</strong></td>
                                    <td className="text-right">{transactions.charges_currency == transactions.fees_currency
                                        ? formatCurrency(transactions.charges_amount - transactions.fees_amount, transactions.charges_currency, true)
                                            : <span className="text-danger">Different currencies</span>
                                        }</td>
                                    </tr>
                                </tbody>
                            </table>
                        </>
                    }

                </>
                : (<span>No payout selected</span>)}
        </CommonModal >
    );
};

export default StripePayoutModal;
