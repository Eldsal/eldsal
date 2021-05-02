import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CommonModal from "./common/CommonModal";
import { formatUtcTimestamp, displayNumberOfItems, formatCurrency } from '../utils.js';
import {
    Table
} from 'reactstrap';
import { useUi } from '../hooks/ui';
import { useApi } from '../hooks/api';

export const UserSubscriptionsModal = ({ user, hideModal }) => {

    ReactModal.setAppElement("body");

    const { alertModal, confirmModal } = useUi();
    const { apiGet, apiPatch, apiGetErrorMessage } = useApi();

    const [showDetailItem, setShowDetailItem] = useState(null);

    const formatProperty = (value) => {
        return emptyStringIfNull(value);
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

    const cancelSubscription = (feeType, subscription) => {
        confirmModal("warning", "Do you want to cancel this subscription?", "Cancel Stripe subscription", () => {
            apiPatch(`admin/cancel-subscription-${feeType}/${subscription.subscription_id}`)
                .then(
                    success => {
                        console.log("Success");
                        subscription.read_error = true;
                        subscription.read_error_message = "Cancelled";
                        alertModal("success", "The subscription is cancelled");
                    },
                    err => {
                        console.log(err);
                        alertModal("error", "Failed to cancel subscription");
                    })
                .catch(err => {
                    console.log(err);
                    alertModal("error", "Failed to cancel subscription");
                });
        }, false, "Yes", "No");
    }

    useEffect(() => {
        // Update edit fee form values

    }, [user]);

    function displaySubscriptionList(feeType, subscriptionList) {
        return <table className="table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Amount</th>
                    <th>Interval</th>
                    <th>Status</th>
                    <th>Current period</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {subscriptionList && subscriptionList.length ?
                    subscriptionList.map(item => (
                        <tr key={item}>
                            {item.read_error &&
                                <td colSpan="6" className="text-danger">{item.read_error_message}</td>
                            }
                            {!item.read_error &&
                                <>
                                    <td>{item.product_name}{item.price_name ? " (" + item.price_name + ")" : ""}
                                        {showDetailItem == item.subscription_id &&
                                            <div id={"subscription-details-" + item.subscription_id} className="pl-2 pt-2">
                                                <small>
                                                    Subscription Id: {item.subscription_id}<br />
                                        Customer Id: {item.customer_id}<br />
                                        Product Id: {item.product_id}<br />
                                        Price Id: {item.price_id}
                                                </small>
                                            </div>
                                        }
                                    </td>
                                    <td>{formatCurrency(item.amount, item.currency)}</td>
                                    <td>{displayNumberOfItems(item.interval_count, item.interval, item.interval + "s")}</td>
                                    <td className={item.status == "active" ? "text-success" : "text-danger"}>{item.status}</td>
                                    <td>{formatUtcTimestamp(item.current_period_start)} - {formatUtcTimestamp(item.current_period_end)}</td>
                                    <td>
                                        <button className="btn btn-outline-secondary btn-sm" onClick={() => cancelSubscription(feeType, item)} title="Cancel the subscription">Cancel</button>
                                    <button className="btn btn-outline-secondary btn-sm ml-2" onClick={() => setShowDetailItem(showDetailItem == item.subscription_id ? null : item.subscription_id)} title="Show Stripe subscription details">Details</button>
                                    </td>
                                </>
                            }
                        </tr>
                    ))
                    :
                    (<tr>
                        <td colSpan="4" className="text-muted">(None)</td>
                    </tr>)
                }
            </tbody>
        </table>
    }

    return (
        <CommonModal hideModal={hideModal}>
            <h3>Member Stripe subscriptions</h3>
            {user ?
                <>
                    { user.is_existing_user &&
                        <p>Active Stripe subscriptions for member "{user.user_name}".</p>
                    }
                    { !user.is_existing_user &&
                        <>
                            <p>Active Stripe subscriptions for a Stripe customer not connected to a member.</p>
                            <div className="alert alert-warning">
                                This Stripe customer is not connected to a member
                            </div>
                        </>
                    }
                    <table className="table table-sm">
                        <tbody>
                            {user.is_existing_user &&
                                <>
                                    <tr>
                                        <td>
                                            First name
                                </td>
                                        <td>
                                            {formatProperty(user.user_given_name)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            Surname
                                </td>
                                        <td>
                                            {formatProperty(user.user_family_name)}
                                        </td>
                                    </tr>
                                </>
                            }
                            <tr>
                                <td>
                                    Email
                                </td>
                                <td>
                                    {formatProperty(user.email)}
                                </td>
                            </tr>
                            <tr>
                                <td className="pt-2">
                                    <strong>Subscriptions</strong>
                                </td>
                                <td>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Membership
                                </td>
                                <td>
                                    {displaySubscriptionList("membfee", user.membfee_subscriptions)}

                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Housecard
                                </td>
                                <td>
                                    {displaySubscriptionList("housecard", user.housecard_subscriptions)}

                                </td>
                            </tr>
                        </tbody>
                    </table>
                </>
                : (<span>No user selected</span>)}
        </CommonModal >
    );
};

export default UserSubscriptionsModal;
