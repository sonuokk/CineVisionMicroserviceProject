import { Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { UserService } from '../services/userService'
import { addUserToState, removeUserFromState } from '../store/actions/userActions';
import KaanKaplanTextInput from '../utils/customFormItems/KaanKaplanTextInput';
import GoogleAuthButton from '../utils/GoogleAuthButton';

export default function LoginModal() {

    const userService = new UserService();

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [authMode, setAuthMode] = useState("login");
    const [resetEmail, setResetEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authMessage, setAuthMessage] = useState(null);
    const [formKey, setFormKey] = useState(0);

    function showAuthMessage(type, text) {
        setAuthMessage({ type, text });
    }

    function clearAuthMessage() {
        setAuthMessage(null);
    }

    function resetLoginModal() {
        setAuthMode("login");
        setResetEmail("");
        setIsSubmitting(false);
        setAuthMessage(null);
        setFormKey(currentKey => currentKey + 1);
    }

    function clearBookingSession() {
        sessionStorage.removeItem("lastBooking");
        sessionStorage.removeItem("lastBookingUserEmail");
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
        clearBookingSession();
        dispatch(addUserToState(userPayload))

        let closeButton = document.getElementById("close-button");
        closeButton?.click();

        const pendingPath = sessionStorage.getItem("cineSagaPendingPath");
        if (pendingPath) {
            sessionStorage.removeItem("cineSagaPendingPath");
            navigate(pendingPath);
        } else if (["PENDING", "REJECTED"].includes(userPayload?.theaterManagerRequestStatus)) {
            navigate("/profile");
        }

        clearAuthMessage();
    }

    function googleLogin(credential) {
        if (isSubmitting) {
            return;
        }
        dispatch(removeUserFromState())
        setIsSubmitting(true);
        clearAuthMessage();

        userService.googleLogin(credential)
            .then(result => completeAuthenticatedLogin(result.data))
            .catch(e => showAuthMessage("error", getErrorMessage(e, "Google sign-in failed. Please try again.")))
            .finally(() => setIsSubmitting(false))
    }

    function login(loginDto) {
        if (isSubmitting) {
            return;
        }
        dispatch(removeUserFromState())
        setIsSubmitting(true);
        clearAuthMessage();

        userService.login({
            email: loginDto.loginEmail,
            password: loginDto.loginPassword
        }).then(result => {

            if (result.status === 200) {
                completeAuthenticatedLogin(result.data);
            }
        }).catch(e => {
            const message = getErrorMessage(e, "Email or password is incorrect. Please try again.");
            showAuthMessage("error", message);
        }).finally(() => setIsSubmitting(false))
    }

    function requestPasswordReset(values) {
        if (isSubmitting) {
            return;
        }
        const email = values.resetEmail?.trim().toLowerCase();
        if (!email) {
            showAuthMessage("error", "Enter your account email.");
            return;
        }

        setIsSubmitting(true);
        clearAuthMessage();
        userService.requestPasswordResetOtp({ email }).then(result => {
            setResetEmail(email);
            setAuthMode("resetConfirm");
            showAuthMessage("success", "If this email exists, a password reset OTP has been sent.");
        }).catch(e => {
            const message = getErrorMessage(e, "Could not start password reset. Please try again.");
            showAuthMessage("error", message);
        }).finally(() => setIsSubmitting(false))
    }

    function resetPassword(values) {
        if (isSubmitting) {
            return;
        }
        if (values.newPassword !== values.confirmPassword) {
            showAuthMessage("error", "Passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        clearAuthMessage();
        userService.resetPassword({
            email: resetEmail,
            otp: (values.otp || "").replace(/\D/g, "").slice(0, 6),
            newPassword: values.newPassword
        }).then(() => {
            setAuthMode("login");
            setResetEmail("");
            showAuthMessage("success", "Password reset. Please sign in with your new password.");
        }).catch(e => {
            const message = getErrorMessage(e, "Could not reset password. Please check the OTP.");
            showAuthMessage("error", message);
        }).finally(() => setIsSubmitting(false))
    }

    function modalTitle() {
        if (authMode === "resetRequest") {
            return "Reset Password";
        }
        if (authMode === "resetConfirm") {
            return "Enter Reset OTP";
        }
        return "Sign In";
    }

    useEffect(() => {
        const loginModal = document.getElementById("loginModal");
        if (!loginModal) {
            return undefined;
        }

        loginModal.addEventListener("show.bs.modal", resetLoginModal);
        loginModal.addEventListener("hidden.bs.modal", resetLoginModal);

        return () => {
            loginModal.removeEventListener("show.bs.modal", resetLoginModal);
            loginModal.removeEventListener("hidden.bs.modal", resetLoginModal);
        }
    }, [])

  return (
    <div>
        <div className="modal fade" id="loginModal" tabIndex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                <div className="modal-header login-modal-header">
                    <h5 className="modal-title" id="loginModalLabel">{modalTitle()}</h5>
                    <button id='close-button' type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                    <Formik
                        key={formKey}
                        enableReinitialize
                        initialValues={{
                            loginEmail: "",
                            loginPassword: "",
                            resetEmail: "",
                            otp: "",
                            newPassword: "",
                            confirmPassword: ""
                        }}
                        onSubmit={(value) => {
                            if (authMode === "resetRequest") {
                                requestPasswordReset(value);
                            } else if (authMode === "resetConfirm") {
                                resetPassword(value);
                            } else {
                                login(value);
                            }
                        }}>
                        <Form autoComplete="off">
                            <div className="modal-body">
                                {authMessage ? (
                                    <div className={`auth-inline-message ${authMessage.type}`} role="alert">
                                        {authMessage.text}
                                    </div>
                                ) : null}
                                {authMode === "login" ? (
                                <>
                                <GoogleAuthButton onCredential={googleLogin} disabled={isSubmitting} label="Sign in with Google" />
                                <div className='auth-divider'><span>or</span></div>
                                <div className="form-floating mb-3">
                                    <KaanKaplanTextInput id="loginEmail" type="email" name="loginEmail" className="form-control" placeholder="Email" autoComplete="off" required />
                                    <label htmlFor="loginEmail">Email</label>
                                </div>
                                <div className="form-floating mb-3">
                                    <KaanKaplanTextInput id="loginPassword" type="password" name="loginPassword" className="form-control" placeholder="Password" autoComplete="new-password" required />
                                    <label htmlFor="loginPassword">Password</label>
                                </div>
                                <div className='auth-modal-links'>
                                    <button type='button' className='auth-text-button' onClick={() => {
                                        clearAuthMessage();
                                        setAuthMode("resetRequest");
                                    }}>
                                        Forgot password?
                                    </button>
                                    <span>
                                        New to CineSaga?
                                        <a href='!#'
                                        data-bs-toggle="modal" data-bs-target="#registerModal"> Create an account </a>
                                    </span>
                                </div>
                                </>
                                ) : null}

                                {authMode === "resetRequest" ? (
                                <>
                                <p className='auth-helper-text'>Enter your registered email and we will send a 6-digit OTP to reset your password.</p>
                                <div className="form-floating mb-3">
                                    <KaanKaplanTextInput id="resetEmail" type="email" name="resetEmail" className="form-control" placeholder="Email" autoComplete="off" required />
                                    <label htmlFor="resetEmail">Account Email</label>
                                </div>
                                <button type='button' className='auth-text-button' onClick={() => {
                                    clearAuthMessage();
                                    setAuthMode("login");
                                }}>
                                    Back to sign in
                                </button>
                                </>
                                ) : null}

                                {authMode === "resetConfirm" ? (
                                <>
                                <p className='auth-helper-text'>Enter the OTP sent to <strong>{maskEmail(resetEmail)}</strong>, then choose a new password.</p>
                                <div className="form-floating mb-3">
                                    <KaanKaplanTextInput id="resetOtp" type="text" name="otp" className="form-control" placeholder="OTP" inputMode="numeric" maxLength="6" autoComplete="one-time-code" required />
                                    <label htmlFor="resetOtp">6-digit OTP</label>
                                </div>
                                <div className="form-floating mb-3">
                                    <KaanKaplanTextInput id="newPassword" type="password" name="newPassword" className="form-control" placeholder="New Password" autoComplete="new-password" pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,72}" title="Use 8+ characters with uppercase, lowercase, number and special character" required />
                                    <label htmlFor="newPassword">New Password</label>
                                </div>
                                <div className="form-floating mb-3">
                                    <KaanKaplanTextInput id="confirmPassword" type="password" name="confirmPassword" className="form-control" placeholder="Confirm Password" autoComplete="new-password" required />
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                </div>
                                <button type='button' className='auth-text-button' onClick={() => {
                                    clearAuthMessage();
                                    setAuthMode("resetRequest");
                                }}>
                                    Use another email
                                </button>
                                </>
                                ) : null}
                            </div>
                            <div className="modal-footer">
                                <button type="submit" className="btn btn-primary login-modal-btn" disabled={isSubmitting}>
                                    {authMode === "resetRequest" ? (isSubmitting ? "Sending..." : "Send Reset OTP") :
                                        authMode === "resetConfirm" ? (isSubmitting ? "Resetting..." : "Reset Password") :
                                            (isSubmitting ? "Signing in..." : "Sign In")}
                                </button>
                            </div>
                        </Form>
                    </Formik>

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

