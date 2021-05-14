import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { useModal } from "react-modal-hook";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useApi } from '../hooks/api';
import { UserSubscriptionsModal } from './UserSubscriptionsModal';
import { formatDate, formatCurrency } from '../utils.js';
import { useSortableTable } from '../hooks/table'

export const AdminSubscriptionList = ({ x }) => {

    const [dataLoaded, setDataLoaded] = useState(false);
    const [data, setData] = useState(null);
    const { apiGet } = useApi();
    const [selectedItem, setSelectedItem] = useState(null);
    const { Table, makeSelectColumnFilter } = useSortableTable();

    ReactModal.setAppElement("body");

    const [showModal, hideModal] = useModal(() => (
        <UserSubscriptionsModal user={selectedItem} hideModal={hideModal} />
    ), [selectedItem]);

    const showSubscriptionsModal = (user) => {
        setSelectedItem(user);
        showModal();
    }

    useEffect(() => {

        apiGet(`admin/get-subscriptions`)
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

    function displaySubscription(subscription, includeProductName = true) {

        if (subscription.read_error)
            return <span className="text-danger">{subscription.read_error_message}</span>;

        var interval = subscription.interval_count == 1 ? subscription.interval : subscription.interval_count + " " + subscription.interval + "s";

        var result =
            <>
                <span>{formatCurrency(subscription.amount, subscription.currency, false)}/{interval}{includeProductName ? <small> ({subscription.product_name})</small> : null}</span>
                {subscription.status != "active" && <><br /><span className="text-danger">{subscription.status}</span></>}
            </>;

        return result;
    }

    function displaySubscriptionList(subscriptionList, includeProductName = true) {
        if (subscriptionList && subscriptionList.length > 0) {

            var result = displaySubscription(subscriptionList[0], includeProductName);

            if (subscriptionList.length > 1) {
                return <span data-filter="[yes][multiple]">{result}<br /><span className="text-danger">(More than one subscription)</span></span>;
            }
            else {
                return <span data-filter="[yes]">{result}</span>;
            }

        }
        else {
            return <span className="text-muted" data-filter="[no]">(None)</span>;
        }
    }

    const columns = React.useMemo(
        () => [
            {
                id: 'name',
                Header: 'Name',
                accessor: 'user_name',
                Cell: ({ value, row }) => <span className={`btn btn-link p-0 m-0 ${row.original.is_existing_user ? "" : "text-danger"}`} onClick={() => showSubscriptionsModal(row.original)}>{value}</span>,
                sortType: 'textIgnoreCase',
            },
            {
                id: 'email',
                Header: 'Email',
                accessor: 'email',
                sortType: 'textIgnoreCase',
            },
            {
                id: 'membership',
                Header: 'Membership',
                accessor: (row, rowIndex) => displaySubscriptionList(row.membfee_subscriptions),
                Filter: makeSelectColumnFilter([new Option('No', 'no'), new Option('Yes', 'yes'), new Option('Multiple', 'multiple')]),
                filter: 'dataFilter'
            },
            {
                id: 'housecard',
                Header: 'Housecard',
                accessor: (row, rowIndex) => displaySubscriptionList(row.housecard_subscriptions),
                Filter: makeSelectColumnFilter([new Option('No', 'no'), new Option('Yes', 'yes'), new Option('Multiple', 'multiple')]),
                filter: 'dataFilter'
            }
        ],
        []
    );

    return !dataLoaded
        ? (<span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>)
        : (<>
            <h3>Stripe subscriptions</h3>
            <Table columns={columns} data={data} sort={true} filter={true} />
        </>
        );
};

export default AdminSubscriptionList;
