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

const AppHeader = (props) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggle = () => setIsOpen(!isOpen);

    const { user, isAuthenticated, logout } = useAuth0();

    if (!isAuthenticated) {
        return (
            <header class="App-header">
                <Navbar color="light" light expand="md">
                    <NavbarBrand href="/">
                        <img src="/eldsal.png" className="App-logo" alt="Eldsäl" />
                        <span class="pl-2">Eldsäl</span>
                    </NavbarBrand>
                </Navbar>
            </header>
        );
    }

    return (
        <header className="App-header">
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
                                    <img className="App-avatar" src={user.picture} alt={user.name} />
                                </DropdownToggle>
                                <DropdownMenu
                                    right={true}>
                                    <DropdownItem>{user.name}</DropdownItem>
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
