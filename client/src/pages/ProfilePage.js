import React, { useState, useEffect } from "react";
import { withAuthenticationRequired } from "@auth0/auth0-react";
import AppContent from "../components/common/AppContent";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useUser } from '../hooks/user';
import { useApi } from '../hooks/api';

const ProfilePage = () => {

    const { userInfo, isUserLoading } = useUser();
    const { apiGet, apiPatch } = useApi();

    var pageStates = { "view": 0, "updateProfile": 1, "changePassword": 2 };
    const [pageState, setPageState] = useState(pageStates.view);

    var saveStates = { "none": 0, "saving": 1, "savedProfile": 2, "errorProfile": 3, "savedPassword": 4, "errorPassword": 5 };
    const [saveState, setSaveState] = useState(saveStates.none);

    const [givenName, setGivenName] = useState(null);
    const [givenNameError, setGivenNameError] = useState(null);
    const [familyName, setFamilyName] = useState(null);
    const [familyNameError, setFamilyNameError] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState(null);
    const [phoneNumberError, setPhoneNumberError] = useState(null);
    const [addressLine1, setAddressLine1] = useState(null);
    const [addressLine1Error, setAddressLine1Error] = useState(null);
    const [addressLine2, setAddressLine2] = useState(null);
    const [postalCode, setPostalCode] = useState(null);
    const [postalCodeError, setPostalCodeError] = useState(null);
    const [city, setCity] = useState(null);
    const [cityError, setCityError] = useState(null);
    const [country, setCountry] = useState(null);
    const [countryError, setCountryError] = useState(null);
    const [birthDate, setBirthDate] = useState(null);
    const [birthDateError, setBirthDateError] = useState(null);

    const [showValidationForUnmodifiedFields, setShowValidationForUnmodifiedFields] = useState(false);

    const [isUpdateProfileFormValid, setIsUpdateProfileFormValid] = useState(false)

    const showPage = (pageState) => {
        setSaveState(saveStates.none);
        setShowValidationForUnmodifiedFields(false);
        setPageState(pageState);
    }

    useEffect(() => {
        setIsUpdateProfileFormValid(validateUpdateProfileForm())
    }, [givenName, familyName, phoneNumber, birthDate, addressLine1, postalCode, city, country]) // any state variable(s) included in here will trigger the effect to run


    useEffect(() => {
        if (userInfo == null)
            return;

        setGivenName(nullIfEmpty(userInfo.given_name))
        setFamilyName(nullIfEmpty(userInfo.family_name))        
        setPhoneNumber(nullIfEmpty(userInfo.phone_number))
        setAddressLine1(nullIfEmpty(userInfo.address_line_1))
        setAddressLine2(nullIfEmpty(userInfo.address_line_2))
        setPostalCode(nullIfEmpty(userInfo.postal_code))
        setCity(nullIfEmpty(userInfo.city))
        setCountry(nullIfEmpty(userInfo.country))
        setBirthDate(nullIfEmpty(userInfo.birth_date))
        
    }, [userInfo]);

    const validateUpdateProfileForm = () => {

        let errors = 0;

        if (isEmpty(givenName)) {
            setGivenNameError('First name is required')
            errors++;
        } else {
            setGivenNameError(null)
        }
        if (isEmpty(familyName)) {
            setFamilyNameError('Surname is required')
            errors++;
        } else {
            setFamilyNameError(null)
        }
        if (isEmpty(phoneNumber)) {
            setPhoneNumberError('Phone number is required')
            errors++;
        } else if (!/^\+[0-9 -]{10,30}$/.test(phoneNumber)) {
            setPhoneNumberError("Enter a phone number with country prefix (e.g. +NN NNN NN NN)")
            errors++;
        }
        else {
            setPhoneNumberError(null)
        }
        if (isEmpty(birthDate)) {
            setBirthDateError('Birth date is required')
            errors++;
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
            setBirthDateError("Enter a birth date as YYYY-MM-DD")
            errors++;
        } else {
            setBirthDateError(null)
        }
        if (isEmpty(addressLine1)) {
            setAddressLine1Error('Address is required')
            errors++;
        } else {
            setAddressLine1Error(null)
        }
        if (isEmpty(postalCode)) {
            setPostalCodeError('Postal code is required')
            errors++;
        } else {
            setPostalCodeError(null)
        }
        if (isEmpty(city)) {
            setCityError('City is required')
            errors++;
        } else {
            setCityError(null)
        }
        if (isEmpty(country)) {
            setCountryError('Country is required')
            errors++;
        } else {
            setCountryError(null)
        }

        return errors === 0;
    }


    function isEmpty(value) {
        return value === null || value === "" || typeof (value) == "undefined";
    }

    function nullIfEmpty(value) {
        if (isEmpty(value))
            return null;
        else
            return value;
    }

    function emptyStringIfNull(value) {
        if (isEmpty(value))
            return "";
        else
            return value;
    }

    const updateProfile = async () => {

        setShowValidationForUnmodifiedFields(true);

        if (!isUpdateProfileFormValid) {
            return;
        }

        setSaveState(saveStates.saving);

        var userArgument = {
            given_name: givenName,
            family_name: familyName,
            birth_date: birthDate,
            phone_number: phoneNumber,
            address_line_1: addressLine1,
            address_line_2: addressLine2,
            postal_code: postalCode,
            city: city,
            country: country
        }

        apiPatch(`updateUserProfile/${userInfo.user_id}`, userArgument)
            .then(
                success => {
                    showPage(pageStates.view);
                    setSaveState(saveStates.savedProfile);
                },
                fail => {
                    console.log(fail);
                    setSaveState(saveStates.errorProfile);
                })
            .catch(reason => {
                setSaveState(saveStates.errorProfile);
            });
    }

    const changePassword = async () => {

        apiGet(`getChangeUserPasswordUrl/${userInfo.user_id}`)
            .then(
                success => {
                    window.location.assign(success.data.url);
                },
                fail => {
                    console.log("Fail: " + fail);
                })
            .catch(reason => {
                setSaveState(saveStates.errorPassword);
            });
    }

    if (isUserLoading) {
        return <div />
    }

    function renderSaveState() {
        switch (saveState) {
            case saveStates.none:
                return "";
            case saveStates.saving:
                return <span><FontAwesomeIcon icon="spinner" spin /> Saving...</span>;
            case saveStates.savedProfile:
                return <div className="alert alert-success"><FontAwesomeIcon icon="check" /> Your profile is updated</div>;
            case saveStates.errorProfile:
                return <div className="alert alert-danger"><FontAwesomeIcon icon="exclamation-circle" /> An error occurred updating your profile</div>;
            case saveStates.savedPassword:
                return <div className="alert alert-success"><FontAwesomeIcon icon="check" /> Your password is changed</div>;
            case saveStates.errorPassword:
                return <div className="alert alert-danger"><FontAwesomeIcon icon="exclamation-circle" /> An error occurred changing your password</div>;
            default:
                return "";
        }
    }

    function showValidationError(property, errProperty) {
        if (property === null && !showValidationForUnmodifiedFields)
            return "";

        return errProperty && <div className="mt-1 text-danger">{errProperty}</div>
    }

    const renderPageHeader = () => {
        switch (pageState) {
            case pageStates.view:
                return (<section>
                    <h1>Profile</h1>
                    <p>Here the user can view and edit profile information</p>
                </section>);

            case pageStates.updateProfile:
                return (<section>
                    <h1>Update profile</h1>
                    <p>Update your profile information</p>
                </section>);

            default:
                return <div className="text-danger">(Invalid page state)</div>
        }
    }

    const renderPageContent = () => {
        switch (pageState) {
            case pageStates.view:
                return (<div style={{ maxWidth: "400px" }}>
                    <div className="row text-left">
                        <div className="col-4">Email</div>
                        <div className="col-8 text-muted" title="Email address can't be changed, it is your login username.">{userInfo == null ? "" : userInfo.email}</div>
                    </div>
                    <div className="row text-left">
                        <div className="col-4">First name</div>
                        <div className="col-8">{emptyStringIfNull(givenName)}</div>
                    </div>
                    <div className="row text-left">
                        <div className="col-4">Surname</div>
                        <div className="col-8">{emptyStringIfNull(familyName)}</div>
                    </div>
                    <div className="row text-left">
                        <div className="col-4">Phone number</div>
                        <div className="col-8">{emptyStringIfNull(phoneNumber)}</div>
                    </div>
                    <div className="row text-left">
                        <div className="col-4">Birth date</div>
                        <div className="col-8">{emptyStringIfNull(birthDate)}</div>
                    </div>
                    <div className="row text-left">
                        <div className="col-4">Address</div>
                        <div className="col-8">
                            {emptyStringIfNull(addressLine1)}<br />
                            {emptyStringIfNull(addressLine2)}</div>
                    </div>
                    <div className="row text-left">
                        <div className="col-4">Postal code</div>
                        <div className="col-8">{emptyStringIfNull(postalCode)}</div>
                    </div>
                    <div className="row text-left">
                        <div className="col-4">City</div>
                        <div className="col-8">{emptyStringIfNull(city)}</div>
                    </div>
                    <div className="row text-left">
                        <div className="col-4">Country</div>
                        <div className="col-8">{emptyStringIfNull(country)}</div>
                    </div>
                    <div className="mt-4">
                        <button type="button" onClick={() => showPage(pageStates.updateProfile)} id="stateUpdateProfile" className="btn btn-primary">Update profile</button>
                        <button type="button" onClick={() => changePassword()} id="stateUpdateProfile" className="btn btn-primary ml-2">Change password</button>
                    </div>
                </div>);

            case pageStates.updateProfile:
                return (<div style={{ maxWidth: "500px" }}>
                    <div className="form-group">
                        <label htmlFor="inp_given_name">First name</label>
                        <input id="inp_given_name" value={emptyStringIfNull(givenName)} onChange={(evt) => setGivenName(evt.target.value)} type="text" className="form-control" placeholder="First name" required />
                        {showValidationError(givenName, givenNameError)}
                    </div>
                    <div className="form-group">
                        <label htmlFor="inp_family_name">Surname</label>
                        <input id="inp_family_name" value={emptyStringIfNull(familyName)} onChange={(evt) => setFamilyName(evt.target.value)} type="text" className="form-control" placeholder="Surname" required />
                        {showValidationError(familyName, familyNameError)}
                    </div>
                    <div className="form-group">
                        <label htmlFor="inp_phone_number">Phone number</label>
                        <input id="inp_phone_number" value={emptyStringIfNull(phoneNumber)} onChange={(evt) => setPhoneNumber(evt.target.value)} type="tel" className="form-control" placeholder="+NN NNN NNN NNN" required />
                        {showValidationError(phoneNumber, phoneNumberError)}
                    </div>
                    <div className="form-group">
                        <label htmlFor="inp_birth_date">Birth date</label>
                        <input id="inp_birth_date" value={emptyStringIfNull(birthDate)} onChange={(evt) => setBirthDate(evt.target.value)} type="date" className="form-control" placeholder="YYYY-MM-DD" required />
                        {showValidationError(birthDate, birthDateError)}
                    </div>
                    <div className="form-group">
                        <label htmlFor="inp_address_line_1">Address line 1</label>
                        <input id="inp_address_line_1" value={emptyStringIfNull(addressLine1)} onChange={(evt) => setAddressLine1(evt.target.value)} type="text" className="form-control" placeholder="Address" required />
                        {showValidationError(addressLine1, addressLine1Error)}
                    </div>
                    <div className="form-group">
                        <label htmlFor="inp_address_line_2">Address line 2 (optional)</label>
                        <input id="inp_address_line_2" value={emptyStringIfNull(addressLine2)} onChange={(evt) => setAddressLine2(evt.target.value)} type="text" className="form-control" placeholder="" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="inp_postal_code">Postal code</label>
                        <input id="inp_postal_code" value={emptyStringIfNull(postalCode)} onChange={(evt) => setPostalCode(evt.target.value)} type="text" className="form-control" placeholder="Postal code" required />
                        {showValidationError(postalCode, postalCodeError)}
                    </div>
                    <div className="form-group">
                        <label htmlFor="inp_city">City</label>
                        <input id="inp_city" value={emptyStringIfNull(city)} onChange={(evt) => setCity(evt.target.value)} type="text" className="form-control" placeholder="City" required />
                        {showValidationError(city, cityError)}
                    </div>
                    <div className="form-group">
                        <label htmlFor="inp_country">Country</label>
                        <input id="inp_country" value={emptyStringIfNull(country)} onChange={(evt) => setCountry(evt.target.value)} type="text" className="form-control" placeholder="Country" required />
                        {showValidationError(country, countryError)}
                    </div>
                    <div className="mt-4">
                        <button type="button" onClick={() => updateProfile()} id="submitProfile" className="btn btn-primary">Update</button>
                        <button type="button" onClick={() => showPage(pageStates.view)} className="btn btn-outline-secondary ml-2">Cancel</button>
                    </div>
                </div>);

            default:
                return "";
        }
    }

    return (
        <AppContent>
            {renderPageHeader()}
            {isUserLoading && (<span><FontAwesomeIcon icon="spinner" spin /> Loading...</span>)}
            {!isUserLoading && renderPageContent()}
            <div className="mt-4">{renderSaveState()}</div>
        </AppContent>
    );
};

export default withAuthenticationRequired(ProfilePage);
