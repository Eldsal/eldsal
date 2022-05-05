import React, { useEffect, useState } from "react";
import { withAuthenticationRequired } from "@auth0/auth0-react";
import AppContent from "../components/common/AppContent";
import { useApi } from '../hooks/api';
import { useUser } from '../hooks/user';
import { useUi } from '../hooks/ui';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Row from "reactstrap/lib/Row";
import Col from "reactstrap/lib/Col";

const StartPage = () => {

    const { apiGet, apiPatch } = useApi();
    const { alertModal } = useUi();
    const { userInfo, userProfileIsValid } = useUser();

    const [syncedUser, setSyncedUser] = useState(null);

    const getSyncedUser = () => {

        apiPatch(`sync-user`)
            .then(success => {
                setSyncedUser(success.data);
            },
                error => {
                    alertModal("error", "Stripe syncing failed");
                }
            )
    }

    const displayStatus = () => {

        const addRow = (header, headerLink, content) => {
            return (
                <Row>
                    <Col xs={4} sm={3} m={2}>
                        <a href={headerLink}>{header}</a>
                    </Col>
                    <Col>
                        {content}
                    </Col>
                </Row>)
        }

        let profile;

        if (!userInfo) {
            profile = <span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>;
        }
        else if (userProfileIsValid()) {
            profile = <span className="text-success">Entered</span>;
        }
        else {
            profile =
                <>
                    <span className="text-danger">Not fully entered</span>
                    <a className="ml-2" href="/profile">Fix</a>
                </>;
        }

        let houseCard;
        if (!syncedUser) {
            houseCard = <span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>;
        }
        else if (syncedUser.payments.housecard.paid) {

            houseCard =
                <>
                    <span className="text-success">Paid</span>
                    <small className="ml-2">(until {syncedUser.payments.housecard.periodEnd})</small>
                </>;
        }
        else {
            houseCard =
                <>
                    <span className="text-danger">Not paid!</span>
                    {syncedUser.payments.housecard.periodEnd ? <small className="ml-2 text-danger">(Expired {syncedUser.payments.housecard.periodEnd})</small> : ""}
                    <a className="ml-2" href="/subscription">Fix</a>
                </>
        }

        return (
            <>
                { addRow("Profile", "/profile", profile)}
                { addRow("Membership", "/subscription", houseCard)}
            </>
        );
    }

    useEffect(() => {
        getSyncedUser();
    }, []);

    return (
        <AppContent>
            <h1>Welcome to Eldsäl</h1>
            <p>This is the member web for the <a href="https://eldsal.se">Eldsäl</a> association. This is where you manage your Eldsäl profile information and subscriptions for membership and house card.</p>
            <p>We plan to include other features in the future, as booking of the Eldsäl house, links to relevant platforms and information, but for now, enjoy! ❤️</p>

            <h5>Your membership status</h5>
            {displayStatus()}
            <p className="mt-4">For questions regarding the member web, please send an email to <a href={"mailto:" + process.env.REACT_APP_WEBMASTER_EMAIL}>{process.env.REACT_APP_WEBMASTER_EMAIL}</a>.</p>
        </AppContent>
    );
};

export default withAuthenticationRequired(StartPage);
