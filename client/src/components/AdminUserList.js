import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { useModal } from "react-modal-hook";
import {
    Table
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useApi } from '../hooks/api';
import { UserModal } from './UserModal';
import { formatDate } from '../utils.js';
import { useUi } from '../hooks/ui';

export const AdminUserList = () => {

    const [usersLoaded, setUsersLoaded] = useState(false);
    const [users, setUsers] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const { apiGet, apiPatch } = useApi();
    const { alertModal } = useUi(); 

    ReactModal.setAppElement("body");

    const [showModal, hideModal] = useModal(() => (
        <UserModal user={selectedUser} hideModal={hideModal} />
    ), [selectedUser]);

    const showUserModal = (user) => {
        setSelectedUser(user);
        showModal();
    }

    const formatMembership = (user) => {
        return formatFee(user.payments.membership);
    }

    const formatHousecard = (user) => {
        return formatFee(user.payments.housecard);
    }

    const formatFee = (paymentProperty) => {

        var hasPaid = paymentProperty.paid;
        var periodStartDate = paymentProperty.periodStart ? new Date(paymentProperty.periodStart) : null;
        var periodEndDate = paymentProperty.periodEnd ? new Date(paymentProperty.periodEnd) : null;
        var isError = paymentProperty.error;
        var errorMessage = paymentProperty.errorMessage;

        if (isError) {
            return <span className="text-danger">ERROR: {errorMessage}</span>;
        }
        else {
            if (hasPaid) {
                return <span><span className="text-success">Paid</span><small> (until {formatDate(periodEndDate)})</small></span>;
            }
            else {
                return <span><span className="text-danger">Not paid</span><small>{periodEndDate ? " (expired " + formatDate(periodEndDate) + ")" : ""}</small></span>;
            }
        }
    }

    const exportUsers = () => {
        apiGet(`admin/export-users`)
            .then((response) => {
                const fileName = "Eldsäl Member List " + formatDate(new Date()) + ".csv";
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
            });
    }

    const syncUsers = () => {
        apiPatch(`admin/sync-users`)
            .then(success => {
                setUsers(success.data);
                alertModal("success", "Stripe payments are synced");
            },
                error => {
                    alertModal("error", "Stripe syncing failed");
                }
            )
    }

    useEffect(() => {
        apiGet(`admin/get-users`)
            .then(
                success => {
                    const data = success.data;
                    if (typeof (data) === "object" && typeof (data.length) === "number") {
                        setUsers(success.data);
                        setUsersLoaded(true);
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


    return !usersLoaded
        ? (<span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>)
        : (<>
            <h3>Members</h3>
            <Table>
                <thead>
                    <tr>
                        <th></th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Membership</th>
                        <th>Housecard</th>
                    </tr>
                </thead>
                <tbody>
                    {users.length ?
                        users.map(user => (
                            <tr key={user.user_id}>
                                <td><img className="App-avatar" src={user.picture} alt={user.name} onClick={() => showUserModal(user)} /></td>
                                <td><span className="btn btn-link p-0 m-0" onClick={() => showUserModal(user)}>{user.name}</span></td>
                                <td>{user.email}</td>
                                <td>{formatMembership(user)}</td>
                                <td>{formatHousecard(user)}</td>
                            </tr>
                        ))
                        :
                        (<tr>
                            <td colSpan="4">(No users found)</td>
                        </tr>)
                    }
                </tbody>
            </Table>
            <div className="mt-4">
                <button className="btn btn-outline-secondary mr-2" onClick={() => syncUsers()}>Sync Stripe payments</button>
                <button className="btn btn-outline-secondary mr-2" onClick={() => exportUsers()}>Download member list</button>
            </div>
        </>
        );
};

export default AdminUserList;
