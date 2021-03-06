import React, { useState } from "react";
import {
    Collapse,
    Navbar,
    NavbarToggler,
    NavbarBrand,
    Nav,
    NavItem,
    NavLink,
    UncontrolledDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem
} from 'reactstrap';
import { useAuth0 } from "@auth0/auth0-react";
import { useUser } from '../../hooks/user';

const AppHeader = (props) => {

    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => setIsOpen(!isOpen);

    const { logout } = useAuth0();
    const { userInfo, isAuthenticated, isAdmin, isDeveloper } = useUser();

    if (!isAuthenticated || userInfo == null) {
        return (
            <header className="App-header">
                <Navbar color="light" light expand="md">
                    <NavbarBrand href="/">
                        <img src="/eldsal.png" className="App-logo" alt="Eldsäl" />
                        <span className="pl-2">Eldsäl</span>
                    </NavbarBrand>
                </Navbar>
            </header>
        );
    }

    const displayEnvironment = () => {
        var env = process.env.NODE_ENV;
        if (!env)
            env = "none";

        switch (env) {
            case "production":
                return null;

            default:
                return <div className={`App-environment environment-${env}`}>{env.toUpperCase()}</div>;
        }
    }

    return (
        <header className="App-header">
            <div>{displayEnvironment()}</div>
            <Navbar color="light" light expand="md">
                <NavbarBrand href="/start">
                    <img src="/eldsal.png" className="App-logo" alt="Eldsäl" />
                    <span className="pl-2">Eldsäl</span>
                </NavbarBrand>
                <NavbarToggler onClick={toggle} />
                <Collapse isOpen={isOpen} navbar>
                    <Nav className="mr-auto" navbar>
                        <NavItem>
                            <NavLink href="/start/">Start</NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink href="/subscription">Subscription</NavLink>
                        </NavItem>
                        <NavItem hidden={!isAdmin}>
                            <NavLink href="/admin">Admin</NavLink>
                        </NavItem>
                        <NavItem hidden={!isDeveloper}>
                            <NavLink href="/dev">Dev</NavLink>
                        </NavItem>
                        <NavItem hidden={!isOpen}>
                            <NavLink href="/profile">Profile</NavLink>
                        </NavItem>
                        <NavItem hidden={!isOpen}>
                            <NavLink href="#" onClick={() => logout()}>Logout</NavLink>
                        </NavItem>
                    </Nav>
                    <Nav navbar hidden={isOpen}>
                        <NavItem>
                            <UncontrolledDropdown>
                                <DropdownToggle
                                    tag="span"
                                    data-toggle="dropdown"
                                >
                                    <img className="App-avatar" src={userInfo.picture} alt={userInfo.name} />
                                </DropdownToggle>
                                <DropdownMenu
                                    right={true}>
                                    <DropdownItem>{userInfo.name}</DropdownItem>
                                    <DropdownItem divider />
                                    <DropdownItem><NavLink color="link" href="/profile">Profile</NavLink></DropdownItem>
                                    <DropdownItem><NavLink color="link" href="#" onClick={() => logout()}>Logout</NavLink></DropdownItem>
                                </DropdownMenu>
                            </UncontrolledDropdown>
                        </NavItem>
                    </Nav>
                </Collapse>
            </Navbar>
        </header>
    );
};

export default AppHeader;
