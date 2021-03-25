import React from "react";
import { withAuthenticationRequired } from "@auth0/auth0-react";
import AppContent from "../components/common/AppContent";

const ContactPage = () => {

    return (
        <AppContent>
            <h1>Contact</h1>
            <p>Here you find contact information for Eldsäl, links to platforms and other resources.</p>

            <h4>Email addresses</h4>
            <table className="table">
                <tbody>
                    <tr>
                        <td><a href="mailto:ekonomi@eldsal.se ">ekonomi@eldsal.se</a></td>
                        <td>Questions regarding economy.</td>
                    </tr>
                    <tr>
                        <td><a href="mailto:kontakt@eldsal.se ">kontakt@eldsal.se</a></td>
                        <td>General questions that need personal assistance.</td>
                    </tr>
                    <tr>
                        <td><a href="mailto:styrelse@eldsal.se ">styrelse@eldsal.se</a></td>
                        <td>Questions to the board of Eldsäl association. Use only for strict ADMINISTRATIVE matters.</td>
                    </tr>
                    <tr>
                        <td><a href={"mailto:" + process.env.REACT_APP_WEBMASTER_EMAIL}>{process.env.REACT_APP_WEBMASTER_EMAIL}</a></td>
                        <td>Questions regarding the member web.</td>
                    </tr>
                </tbody>
            </table>

            <div class="alert alert-warning">
                Questions regarding Eldsäl that need URGENT attention are directed to the “Fast Response and communication group” It’s members are found on the trello board.<br />
                Otherwise, make a post on the Trello board to raise a question.
            </div>

            <h4>Resources</h4>
            <table className="table">
                <thead>
                    <tr>
                        <th width="200">Name</th>
                        <th width="200">Link</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Master guide</td>
                        <td><a target="_blank" href="https://docs.google.com/document/u/0/d/1B_zUaZ2KQcvuaJtxWoqVrMjTI9c1RDmUgO3fXg5oFgk/mobilebasic?fbclid=IwAR2VSZQfJA50WcWS8WNX5FV6Y20bxoaGf3F1yYYWF8Q9pbSbHAuYdJy_Z-E">Master Guide to Eldsäl</a></td>
                        <td>The master guide to Eldsäl, containing useful information about who we are, what we do and how we do it.</td>
                    </tr>
                    <tr>
                        <td>Public web page</td>
                        <td><a target="_blank" href="https://eldsal.se">https://eldsal.se</a></td>
                        <td>The public web page for Eldsäl.</td>
                    </tr>
                    <tr>
                        <td>Facebook</td>
                        <td><a target="_blank" href="https://www.facebook.com/groups/1502622916603124">Eldsäl Burning House Göteborg</a></td>
                        <td>The Facebook group where we share information and announce events.</td>
                    </tr>
                    <tr>
                        <td>Trello</td>
                        <td><a target="_blank" href="https://trello.com/invite/b/PXQBhjya/a3c11ff7cf2f7384122c9325b7bda110/elds%C3%A4l">Eldsäl Trello board</a></td>
                        <td>Trello is our decision making platform. </td>
                    </tr>
                    <tr>
                        <td>Google Drive</td>
                        <td><a target="_blank" href="https://drive.google.com/drive/folders/1vPMomviVLUnl24XSr-som02gl2TKn5Rn?usp=sharing">Eldsäl main folder</a></td>
                        <td>Shared documents are stored on Google Drive. All Eldsäl members should have access to the Google Drive folder, via the email address used when registrating. It not, please send an e-mail to <a href="mailto:dokument@eldsal.se">dokument@eldsal.se</a>.</td>
                    </tr>
                </tbody>
            </table>

        </AppContent>
    );
};

export default withAuthenticationRequired(ContactPage);
