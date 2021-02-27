import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CommonModal from "./common/CommonModal";
import { formatUtcTimestamp, getDateFormValue } from '../utils.js';
import {
    Table
} from 'reactstrap';

export const UserSubscriptionsModal = ({ user, hideModal }) => {

    ReactModal.setAppElement("body");

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

    useEffect(() => {
        // Update edit fee form values

    }, [user]);

    function displaySubscriptionList(subscriptionList)
    {
        return <Table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Amount</th>
                    <th>Interval</th>
                    <th>Current period</th>
                </tr>
            </thead>
            <tbody>
                {subscriptionList && subscriptionList.length ?
                    subscriptionList.map(item => (
                        <tr key={item.user_id}>
                            <td>{item.product_name}</td>
                            <td>{item.amount} {item.currency}</td>
                            <td>{item.interval_count == 1 ? item.interval : item.interval_count.toString() + " " + item.interval + "s"}</td>
                            <td>{formatUtcTimestamp(item.current_period_start)} - {formatUtcTimestamp(item.current_period_end)}</td>
                        </tr>
                    ))
                    :
                    (<tr>
                        <td colspan="4" className="text-muted">(None)</td>
                    </tr>)
                }
            </tbody>
        </Table>
    }

    return (
        <CommonModal hideModal={hideModal}>
            <h3>Member subscriptions</h3>
            {user ?
                <>
                    <p>Active subscriptions for member "{user.user_name}"</p>
                    <table className="table table-sm">
                        <tbody>
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
                                    {displaySubscriptionList(user.membfee_subscriptions)}
                                    
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Housecard
                                </td>
                                <td>
                                    {displaySubscriptionList(user.housecard_subscriptions)}

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
