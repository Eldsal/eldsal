import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { useModal } from "react-modal-hook";
import {
    Table
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useApi } from '../hooks/api';
import { StripePayoutModal } from './StripePayoutModal';
import { formatDate, formatUtcTimestamp, formatCurrency, getFeeFlavourName } from '../utils.js';

export const AdminStripePayoutList = ({ x }) => {

    const [dataLoaded, setDataLoaded] = useState(false);
    const [data, setData] = useState(null);
    const { apiGet } = useApi();
    const [selectedItem, setSelectedItem] = useState(null);

    ReactModal.setAppElement("body");

    const [showModal, hideModal] = useModal(() => (
        <StripePayoutModal payout={selectedItem} hideModal={hideModal} />
    ), [selectedItem]);

    const showPayoutModal = (payment) => {
        setSelectedItem(payment);
        showModal();
    }

    useEffect(() => {

        apiGet(`admin/get-stripe-payouts`)
            .then(
                success => {
                    const data = success.data;
                    if (typeof (data) === "object" && typeof (data.length) === "number") {
                        setData(success.data);
                        setDataLoaded(true);
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
    }, []);

    return !dataLoaded
        ? (<span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>)
        : (<>
            <h3>Stripe payouts</h3>
            <Table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th className="text-right pr-3">Amount</th>
                        <th>Payout ID</th>
                    </tr>
                </thead>
                <tbody>
                    {data && data.length ?
                        data.map(item => (
                            <tr key={item.payout_id}>
                                <td><span className="btn btn-link p-0 m-0" onClick={() => showPayoutModal(item)}>{formatUtcTimestamp(item.arrival_date)}</span></td>
                                <td>{getFeeFlavourName(item.flavour)}</td>
                                <td className="text-right pr-3">{formatCurrency(item.amount, item.currency, true)}
                                    {item.failure_code !== null &&
                                        <><br/><span className="text-danger">Failed</span></>
                                    }
                                    </td>
                                <td>{item.payout_id}</td>
                            </tr>
                        ))
                        :
                        (<tr>
                            <td colspan="4">(No payments found)</td>
                        </tr>)
                    }
                </tbody>
            </Table>
        </>
        );
};

export default AdminStripePayoutList;
