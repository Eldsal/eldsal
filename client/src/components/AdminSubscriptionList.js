import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { useModal } from "react-modal-hook";
import {
    Table
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useApi } from '../hooks/api';
import { UserSubscriptionsModal } from './UserSubscriptionsModal';
import { formatDate } from '../utils.js';

export const AdminSubscriptionList = ({ x }) => {

    const [dataLoaded, setDataLoaded] = useState(false);
    const [data, setData] = useState(null);
    const { apiGet } = useApi();
    const [selectedItem, setSelectedItem] = useState(null);

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
                        console.log(success.data);
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

        var result = <span>{subscription.amount} {subscription.currency}/{interval}{includeProductName ? <small> ({subscription.product_name})</small> : null}</span>;

        return result;
    }

    function displaySubscriptionList(subscriptionList, includeProductName = true) {
        if (subscriptionList && subscriptionList.length > 0) {

            var result = displaySubscription(subscriptionList[0], includeProductName);

            if (subscriptionList.length > 1) {
                return <>{result}<br/><span className="text-danger">(More than one subscription)</span></>;
            }
            else {
                return result;
            }

        }
        else {
            return <span className="text-muted">(None)</span>;
        }
    }

    return !dataLoaded
        ? (<span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>)
        : (<>
            <h3>Stripe subscriptions</h3>
            <Table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Membership</th>
                        <th>Housecard</th>
                    </tr>
                </thead>
                <tbody>
                    {data && data.length ?
                        data.map(item => (
                            <tr key={item.user_id}>
                                <td><span className={`btn btn-link p-0 m-0 ${item.is_existing_user ? "" : "text-danger"}`} onClick={() => showSubscriptionsModal(item)}>{item.user_name}</span></td>
                                <td>{item.email}</td>
                                <td>{displaySubscriptionList(item.membfee_subscriptions)}</td>
                                <td>{displaySubscriptionList(item.housecard_subscriptions)}</td>
                                <td>{item.email}</td>
                            </tr>
                        ))
                        :
                        (<tr>
                            <td colspan="4">(No subscriptions found)</td>
                        </tr>)
                    }
                </tbody>
            </Table>
        </>
        );
};

export default AdminSubscriptionList;
