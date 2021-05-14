import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { useModal } from "react-modal-hook";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useApi } from '../hooks/api';
import { UserModal } from './UserModal';
import { formatDate, displayNumberOfItems, getRoleName, getAllRoles } from '../utils.js';
import { useUi } from '../hooks/ui';
import { useSortableTable } from '../hooks/table'

export const AdminUserList = () => {

    const [usersLoaded, setUsersLoaded] = useState(false);
    const [users, setUsers] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const { apiGet, apiPatch } = useApi();
    const { alertModal } = useUi();
    const { Table, makeSelectColumnFilter } = useSortableTable();

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

    const hasPaidMembership = (user) => {
        return hasPaidFee(user.payments.membership);
    }

    const hasPaidHousecard = (user) => {
        return hasPaidFee(user.payments.housecard);
    }

    const hasPaidFee = (paymentProperty) => {
        var hasPaid = paymentProperty.paid;
        var isError = paymentProperty.error;
        return hasPaid && !isError;
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
                return <span data-filter="[paid]"><span className="text-success">Paid</span><small> (until {formatDate(periodEndDate)})</small></span>;
            }
            else {
                var expired = !!periodEndDate;
                var filter = "[notpaid]";
                if (expired) {
                    filter += '[expired]';
                }

                return <span data-filter={filter}><span className="text-danger">Not paid</span><small>{expired ? " (expired " + formatDate(periodEndDate) + ")" : ""}</small></span>;
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

    // Column filter for roles
    function RoleColumnFilter({
        column: { filterValue, setFilter, preFilteredRows, id },
    }) {
        // Calculate the options for filtering
        // using the preFilteredRows
        const options = React.useMemo(() => {
            const options = [];
            for (var role of getAllRoles()) {
                options.push(new Option(getRoleName(role), role));
            }
            return options;
        }, [])

        // Render a multi-select box
        return (
            <select className="border"
                value={filterValue}
                onChange={e => {
                    setFilter(e.target.value || undefined)
                }}
            >
                <option value="">All</option>
                {options.map((option, i) => (
                    <option key={i} value={option.value}>
                        {option.text}
                    </option>
                ))}
            </select>
        )
    }

    const paymentColumnFilter = React.useMemo(() =>
        makeSelectColumnFilter([
            new Option('Paid', 'paid'),
            new Option('Not paid', 'notpaid'),
            new Option('Expired', 'expired')
        ])
        , []);

    const columns = React.useMemo(
        () => [
            {
                id: 'avatar',
                accessor: (row, rowIndex) => <img className="App-avatar" src={row.picture} alt={row.name} onClick={() => showUserModal(row)} />,
                disableFilter: true,
                defaultCanFilter: false,
                Filter: ''
           },
            {
                id: 'name',
                Header: 'Name',
                accessor: 'name',
                Cell: ({ value, row }) => <span className="btn btn-link p-0 m-0" onClick={() => showUserModal(row.original)}>{value}</span>,
                sortType: 'textIgnoreCase',
            },
            {
                id: 'email',
                Header: 'Email',
                accessor: 'email',
                sortType: 'textIgnoreCase',
            },
            {
                id: 'created_at',
                Header: 'Signed up',
                accessor: (row, rowIndex) => row['created_at'] ? formatDate(new Date(row['created_at'])) : '',
                Filter: ''
            },
            {
                id: 'roles',
                Header: 'Roles',
                accessor: 'roles',
                Cell: ({ value, row }) => value ? <span data-filter={value.map(x => '[' + x + ']').join('')}>{value.map(x => getRoleName(x)).join(', ')}</span> : null,
                Filter: RoleColumnFilter,
                filter: 'arrayContainsFilter',
                sortType: 'array'
            },
            {
                id: 'membership',
                Header: 'Membership',
                accessor: (row, rowIndex) => formatMembership(row),
                Filter: paymentColumnFilter,
                filter: 'dataFilter'
            },
            {
                id: 'housecard',
                Header: 'Housecard',
                accessor: (row, rowIndex) => formatHousecard(row),
                Filter: paymentColumnFilter,
                filter: 'dataFilter'
            }
        ],
        []
    );

    return !usersLoaded
        ? (<span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>)
        : (<>
            <h3>Members</h3>

            <p>{displayNumberOfItems(users.length, "member", "members")} <small>({users.filter(x => hasPaidMembership(x)).length} with paid membership, {users.filter(x => hasPaidHousecard(x)).length} with paid house card)</small></p>

            <Table columns={columns} data={users} filter={true} sort={true} />

            <div className="mt-4">
                <button className="btn btn-outline-secondary mr-2" onClick={() => syncUsers()}>Sync Stripe payments</button>
                <button className="btn btn-outline-secondary mr-2" onClick={() => exportUsers()}>Download member list</button>
            </div>
        </>
        );
};

export default AdminUserList;
