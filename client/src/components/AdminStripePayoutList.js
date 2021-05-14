import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { useModal } from "react-modal-hook";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useApi } from '../hooks/api';
import { StripePayoutModal } from './StripePayoutModal';
import { formatDate, formatUtcTimestamp, formatCurrency, getFeeFlavourName } from '../utils.js';
import { useSortableTable } from '../hooks/table'

export const AdminStripePayoutList = ({ x }) => {

    const [dataLoaded, setDataLoaded] = useState(false);
    const [data, setData] = useState(null);
    const { apiGet } = useApi();
    const [selectedItem, setSelectedItem] = useState(null);
    const { Table, SelectColumnFilter, makeSelectColumnFilter } = useSortableTable();

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

    const columns = React.useMemo(
        () => [
            {
                id: 'date',
                Header: 'Date',
                accessor: 'arrival_date',
                Cell: ({ value, row }) => <span className="btn btn-link p-0 m-0" onClick={() => showPayoutModal(row.original)}>{formatUtcTimestamp(value)}</span>,
            },
            {
                id: 'type',
                Header: 'Type',
                accessor: (row, rowIndex) => getFeeFlavourName(row.flavour),
                Filter: SelectColumnFilter
            },
            {
                id: 'amount',
                Header: 'Amount',
                className: 'text-right pr-3',
                accessor: 'amount',
                Cell: ({ value, row }) => <span>
                    {formatCurrency(row.original.amount, row.original.currency, true)}
                    {
                        row.original.failure_code !== null &&
                        <><br /><span className="text-danger">Failed</span></>
                    }
                </span>,
            },
            {
                id: 'payoutId',
                Header: 'Payout ID',
                accessor: 'payout_id'
            }
        ],
        []
    );


    return !dataLoaded
        ? (<span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>)
        : (<>
            <h3>Stripe payouts</h3>
            <Table columns={columns} data={data} filter={true} sort={true}>
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
