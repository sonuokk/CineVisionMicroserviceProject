import { Form, Formik } from 'formik';
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CityService } from '../services/cityService';
import { UserService } from '../services/userService'
import { addUserToState, removeUserFromState } from '../store/actions/userActions';
import GoogleAuthButton from '../utils/GoogleAuthButton';
import KaanKaplanTextInput from '../utils/customFormItems/KaanKaplanTextInput';

export default function RegisterModal() {

    const userService = useMemo(() => new UserService(), []);
    const cityService = useMemo(() => new CityService(), []);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [pendingEmail, setPendingEmail] = useState("");
    const [waitingForOtp, setWaitingForOtp] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [authMessage, setAuthMessage] = useState(null);
    const [registerStep, setRegisterStep] = useState("role");
    const [selectedRole, setSelectedRole] = useState("");
    const [theaterOptions, setTheaterOptions] = useState([]);
    const [isLoadingTheaters, setIsLoadingTheaters] = useState(false);
    const [selectedTheaterNames, setSelectedTheaterNames] = useState([]);
    const [pendingRegistrationValues, setPendingRegistrationValues] = useState(null);
    const [pendingRegistrationRole, setPendingRegistrationRole] = useState("");
    const [pendingGoogleCredential, setPendingGoogleCredential] = useState("");
    const [pendingGoogleRole, setPendingGoogleRole] = useState("");

    function showAuthMessage(type, text) {
        setAuthMessage({ type, text });
    }

    function clearAuthMessage() {
        setAuthMessage(null);
    }

    function resetRegisterFlow() {
        setPendingEmail("");
        setWaitingForOtp(false);
        setIsSendingOtp(false);
        setIsVerifyingOtp(false);
        setAuthMessage(null);
        setRegisterStep("role");
        setSelectedRole("");
        setSelectedTheaterNames([]);
        setPendingRegistrationValues(null);
        setPendingRegistrationRole("");
        setPendingGoogleCredential("");
        setPendingGoogleRole("");
    }

    function maskEmail(email) {
        if (!email || !email.includes("@")) {
            return email;
        }

        const [localPart, domain] = email.split("@");
        const visibleStart = localPart.slice(0, Math.min(3, localPart.length));
        const visibleEnd = localPart.length > 5 ? localPart.slice(-2) : "";
        return `${visibleStart}***${visibleEnd}@${domain}`;
    }

    function completeAuthenticatedLogin(userPayload) {
        sessionStorage.removeItem("lastBooking");
        sessionStorage.removeItem("lastBookingUserEmail");
        dispatch(addUserToState(userPayload));
        document.querySelector("#registerModal .btn-close")?.click();

        const pendingPath = sessionStorage.getItem("cineSagaPendingPath");
        if (pendingPath) {
            sessionStorage.removeItem("cineSagaPendingPath");
            navigate(pendingPath);
        } else if (["PENDING", "REJECTED"].includes(userPayload?.theaterManagerRequestStatus)) {
            navigate("/profile");
        }
    }

    function getSelectedTheaterPayload(theaterNames = selectedTheaterNames) {
        return theaterNames.map(name => name.trim()).filter(Boolean).join(", ");
    }

    function toggleSelectedTheater(theaterName) {
        setSelectedTheaterNames(currentNames => {
            if (currentNames.some(name => name.toLowerCase() === theaterName.toLowerCase())) {
                return currentNames.filter(name => name.toLowerCase() !== theaterName.toLowerCase());
            }
            return [...currentNames, theaterName];
        });
    }

    function googleLogin(credential, theaterNames = selectedTheaterNames, roleOverride = selectedRole || "CUSTOMER") {
        if (isSendingOtp || isVerifyingOtp) {
            return;
        }
        const role = roleOverride || "CUSTOMER";
        const theaterPayload = getSelectedTheaterPayload(theaterNames);
        if (role === "THEATER_MANAGER" && !theaterPayload) {
            setPendingGoogleCredential(credential);
            setPendingGoogleRole(role);
            setRegisterStep("assignTheater");
            return;
        }

        dispatch(removeUserFromState());
        setIsSendingOtp(true);
        clearAuthMessage();
        userService.googleLogin({
            credential,
            role,
            theaterName: role === "THEATER_MANAGER" ? theaterPayload : undefined
        })
            .then(result => completeAuthenticatedLogin(result.data))
            .catch(e => showAuthMessage("error", getErrorMessage(e, "Google sign-up failed. Please try again.")))
            .finally(() => setIsSendingOtp(false))
    }

    function submitRegisterDetails(values) {
        const role = selectedRole || "CUSTOMER";
        if (role === "THEATER_MANAGER" && !getSelectedTheaterPayload()) {
            setPendingRegistrationValues(values);
            setPendingRegistrationRole(role);
            setRegisterStep("assignTheater");
            return;
        }
        registerCustomer(values, selectedTheaterNames, role);
    }

    const registerCustomer = (values, theaterNames = selectedTheaterNames, roleOverride = selectedRole || "CUSTOMER") => {
        if (isSendingOtp) {
            return;
        }

        if (values.password !== values.passwordAgain) {
            showAuthMessage("error", "Passwords do not match.");
            return;
        }

        setIsSendingOtp(true);
        clearAuthMessage();
        const role = roleOverride || "CUSTOMER";
        const theaterPayload = getSelectedTheaterPayload(theaterNames);

        const customer = {
            customerName: values.customerName?.trim(),
            email: values.email?.trim().toLowerCase(),
            password: values.password,
            role,
            theaterName: role === "THEATER_MANAGER" ? theaterPayload : undefined
        };

        userService.addCustomer(customer).then(result => {
            if(result.status === 200) {
                setPendingRegistrationValues(null);
                setPendingRegistrationRole("");
                setPendingEmail(customer.email);
                setWaitingForOtp(true);
                setRegisterStep("details");
                showAuthMessage("success", role === "THEATER_MANAGER"
                    ? "OTP sent. After verification, your theatre manager request will wait for admin approval."
                    : "OTP sent. Please check your email.");
            }
        }).catch(e => {
            const message = getErrorMessage(e, "Could not create account. Please check your details.");
            showAuthMessage("error", message);
        }).finally(() => setIsSendingOtp(false))
    }

    const verifyRegistrationOtp = (values) => {
        if (isVerifyingOtp) {
            return;
        }

        const normalizedOtp = (values.otp || "").replace(/\D/g, "").slice(0, 6);
        if (normalizedOtp.length !== 6) {
            showAuthMessage("error", "Enter the 6-digit OTP from your email.");
            return;
        }

        setIsVerifyingOtp(true);
        clearAuthMessage();
        userService.verifyCustomerOtp({
            email: pendingEmail.trim().toLowerCase(),
            otp: normalizedOtp
        }).then(result => {
            if (result.status === 200) {
                setWaitingForOtp(false);
                setPendingEmail("");
                document.querySelector("#loginModalLink")?.click();
            }
        }).catch(e => {
            const message = getErrorMessage(e, "Invalid OTP. Please try again.");
            showAuthMessage("error", message);
        }).finally(() => setIsVerifyingOtp(false))
    }

    function confirmTheaterAssignment() {
        const theaterPayload = getSelectedTheaterPayload();
        if (!theaterPayload) {
            showAuthMessage("error", "Choose at least one theatre from the project list.");
            return;
        }
        clearAuthMessage();
        if (pendingGoogleCredential) {
            googleLogin(pendingGoogleCredential, selectedTheaterNames, pendingGoogleRole || selectedRole || "CUSTOMER");
            return;
        }
        if (pendingRegistrationValues) {
            registerCustomer(pendingRegistrationValues, selectedTheaterNames, pendingRegistrationRole || selectedRole || "CUSTOMER");
            return;
        }
        setRegisterStep("details");
    }

    const loadTheaterOptions = useCallback(() => {
        setIsLoadingTheaters(true);
        return cityService.getTheaterLibrary()
            .then(result => {
                const theaters = (result.data || []).flatMap(city => (
                    (city.theaters || city.saloon || []).map(theater => ({
                        cityName: city.cityName,
                        theaterName: theater.theaterName || theater.saloonName
                    }))
                )).filter(theater => theater.theaterName);
                setTheaterOptions(theaters);
                setSelectedTheaterNames(currentNames =>
                    currentNames.filter(name =>
                        theaters.some(theater => theater.theaterName.toLowerCase() === name.toLowerCase())));
            })
            .catch(() => setTheaterOptions([]))
            .finally(() => setIsLoadingTheaters(false));
    }, [cityService]);

    useEffect(() => {
        const registerModal = document.getElementById("registerModal");
        if (!registerModal) {
            return undefined;
        }

        registerModal.addEventListener("hidden.bs.modal", resetRegisterFlow);
        return () => registerModal.removeEventListener("hidden.bs.modal", resetRegisterFlow);
    }, [])

    useEffect(() => {
        loadTheaterOptions();
    }, [loadTheaterOptions])

    useEffect(() => {
        if (registerStep === "assignTheater") {
            loadTheaterOptions();
        }
    }, [loadTheaterOptions, registerStep])

  return (
    <div>
        <div className="modal fade" id="registerModal" tabIndex="-1" aria-labelledby="registerModalLabel" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                <div className="modal-header login-modal-header">
                    <h5 className="modal-title" id="registerModalLabel">{registerStep === "role" ? "Choose Role" : registerStep === "assignTheater" ? "Assign Theatre" : "Create Account"}</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                {registerStep === "role" ? (
                    <>
                        <div className="modal-body">
                            <div className='register-role-step'>
                                <p className='auth-helper-text text-start'>Choose the account type first. The next step uses the same register form.</p>
                                <button type='button' className={`register-role-card ${selectedRole === "CUSTOMER" ? "active" : ""}`} onClick={() => {
                                    clearAuthMessage();
                                    setSelectedRole("CUSTOMER");
                                    setRegisterStep("details");
                                }}>
                                    <i className='fa-regular fa-user'></i>
                                    <span>
                                        <strong>User</strong>
                                        <small>Book tickets and manage your profile</small>
                                    </span>
                                </button>
                                <button type='button' className={`register-role-card ${selectedRole === "THEATER_MANAGER" ? "active" : ""}`} onClick={() => {
                                    clearAuthMessage();
                                    setSelectedRole("THEATER_MANAGER");
                                    setRegisterStep("assignTheater");
                                }}>
                                    <i className='fa-solid fa-building'></i>
                                    <span>
                                        <strong>Theatre Manager</strong>
                                        <small>Select theatres, then wait for admin approval</small>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : registerStep === "assignTheater" ? (
                    <>
                        <div className='modal-body'>
                            {authMessage ? (
                                <div className={`auth-inline-message ${authMessage.type}`} role="alert">
                                    {authMessage.text}
                                </div>
                            ) : null}
                            <div className='theater-assignment-step'>
                                <p className='auth-helper-text text-start'>Choose one or more theatres you want to manage. Admin approval is required before the role is assigned.</p>
                                <div className='auth-role-confirm text-start'>
                                    <strong>Registering as Theatre Manager</strong>
                                    <span>{selectedTheaterNames.length} theatre{selectedTheaterNames.length === 1 ? "" : "s"} selected. These will be sent to admin for approval.</span>
                                </div>
                                {isLoadingTheaters && theaterOptions.length === 0 ? (
                                    <div className='upi-config-warning text-start'>
                                        <strong>Loading theatres...</strong>
                                        <span>Please wait while the theatre list is fetched from Movie Service.</span>
                                    </div>
                                ) : theaterOptions.length === 0 ? (
                                    <div className='upi-config-warning text-start'>
                                        <strong>No theatres found.</strong>
                                        <span>Add theatres in Manage Theatres, then register the theatre manager.</span>
                                    </div>
                                ) : (
                                    <div className='theater-assignment-list'>
                                        {theaterOptions.map(theater => (
                                            <button type='button'
                                                className={`theater-assignment-card ${selectedTheaterNames.some(name => name.toLowerCase() === theater.theaterName.toLowerCase()) ? "active" : ""}`}
                                                key={`${theater.cityName}-${theater.theaterName}`}
                                                onClick={() => toggleSelectedTheater(theater.theaterName)}>
                                                <i className={`fa-solid ${selectedTheaterNames.some(name => name.toLowerCase() === theater.theaterName.toLowerCase()) ? "fa-check" : "fa-location-dot"}`}></i>
                                                <span>
                                                    <strong>{theater.theaterName}</strong>
                                                    <small>{theater.cityName}</small>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className='modal-footer'>
                            <button type='button' className='btn auth-secondary-btn' onClick={() => {
                                setPendingGoogleCredential("");
                                setPendingGoogleRole("");
                                clearAuthMessage();
                                setRegisterStep(pendingGoogleCredential || pendingRegistrationValues ? "details" : "role");
                            }}>Back</button>
                            <button type='button' className='btn btn-primary login-modal-btn' disabled={isSendingOtp || isLoadingTheaters || theaterOptions.length === 0} onClick={confirmTheaterAssignment}>
                                {isSendingOtp ? "Continuing..." : "Continue"}
                            </button>
                        </div>
                    </>
                ) : (
                <Formik
                    enableReinitialize
                    initialValues={{}}
                    onSubmit={(values) => {
                        if (waitingForOtp) {
                            verifyRegistrationOtp(values);
                        } else {
                            submitRegisterDetails(values);
                        }
                    }}>
                    <Form>
                        <div className="modal-body">
                            {authMessage ? (
                                <div className={`auth-inline-message ${authMessage.type}`} role="alert">
                                    {authMessage.text}
                                </div>
                            ) : null}
                            {waitingForOtp ? (
                            <>
                                <p className='auth-helper-text'>Enter the 6-digit OTP sent to <strong>{maskEmail(pendingEmail)}</strong>.</p>
                                <div className="form-floating mb-3">
                                    <KaanKaplanTextInput type="text" name="otp" className="form-control" id="registrationOtp" placeholder='OTP' inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,12}" maxLength="12" required/>
                                    <label htmlFor="registrationOtp">OTP</label>
                                </div>
                            </>
                            ) : (
                            <>
                            <GoogleAuthButton onCredential={googleLogin} disabled={isSendingOtp || isVerifyingOtp} label="Sign up with Google" />
                            <div className='auth-divider'><span>or</span></div>
                            <div className="form-floating mb-3">
                                <KaanKaplanTextInput type="text" name="customerName" className="form-control" id="customerName" placeholder='Full Name' required/>
                                <label htmlFor="customerName">Full Name</label>
                            </div>
                            <div className="form-floating mb-3">
                                <KaanKaplanTextInput type="email" name="email" className="form-control" id="registerEmail" placeholder='Email' required />
                                <label htmlFor="registerEmail">Email</label>
                            </div>
                            <div className="form-floating mb-3">
                                <KaanKaplanTextInput type="password" name="password" className="form-control" id="registerPassword" placeholder='Password' pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,72}" title="Use 8+ characters with uppercase, lowercase, number and special character" required/>
                                <label htmlFor="registerPassword">Password</label>
                            </div>
                            <div className="form-floating mb-3">
                                <KaanKaplanTextInput type="password" name="passwordAgain" className="form-control" id="passwordAgain" placeholder='Confirm Password' required/>
                                <label htmlFor="passwordAgain">Confirm Password</label>
                            </div>
                            </>
                            )}
                            <p className='ps-2 text-start auth-switch-copy'>
                                Already have an account?
                                <a href='!#' id="loginModalLink"
                                data-bs-toggle="modal" data-bs-target="#loginModal"> Sign In </a>
                            </p>
                        </div>
                        <div className="modal-footer">
                            {waitingForOtp ? (
                                <button type="button" className="btn auth-secondary-btn" onClick={() => {
                                    setWaitingForOtp(false);
                                    setPendingEmail("");
                                    clearAuthMessage();
                                }}>Edit Details</button>
                            ) : (
                                <button type="button" className="btn auth-secondary-btn" onClick={() => {
                                    clearAuthMessage();
                                    setRegisterStep("role");
                                }}>Back</button>
                            )}
                            <button type="submit" className="btn btn-primary login-modal-btn" disabled={isSendingOtp || isVerifyingOtp}>
                                {waitingForOtp ? (isVerifyingOtp ? "Verifying..." : "Verify OTP") : (isSendingOtp ? "Continuing..." : "Continue")}
                            </button>
                        </div>
                    </Form>
                </Formik>
                )}
                </div>
            </div>
        </div>
    </div>
  )
}

function getErrorMessage(error, fallback) {
    const data = error.response?.data;
    if (!data) {
        return fallback;
    }
    if (typeof data === "string") {
        return data;
    }
    if (data.message) {
        return data.message;
    }
    const ignoredKeys = ["timestamp", "status", "error", "path", "trace", "requestId"];
    const fieldMessage = Object.entries(data).find(([key, value]) =>
        !ignoredKeys.includes(key) && typeof value === "string" && value.trim()
    );
    return fieldMessage ? fieldMessage[1] : fallback;
}
