import { Form, Formik } from 'formik';
import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { UserService } from '../services/userService'
import { addUserToState, removeUserFromState } from '../store/actions/userActions';
import KaanKaplanTextInput from '../utils/customFormItems/KaanKaplanTextInput';

export default function LoginModal() {

    const userService = new UserService();

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [authMode, setAuthMode] = useState("login");
    const [resetEmail, setResetEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    function login(loginDto) {
        if (isSubmitting) {
            return;
        }
        dispatch(removeUserFromState())
        setIsSubmitting(true);

        userService.login(loginDto).then(result => {

            if (result.status === 200) {
                dispatch(addUserToState(result.data))
    
                let closeButton = document.getElementById("close-button");
                closeButton.click();

                const pendingPath = sessionStorage.getItem("cineSagaPendingPath");
                if (pendingPath) {
                    sessionStorage.removeItem("cineSagaPendingPath");
                    navigate(pendingPath);
                }

                toast("Welcome back!", {
                    theme: "colored",
                    position: "top-center"
                })
            }
        }).catch(e => {
            const message = getErrorMessage(e, "Email or password is incorrect. Please try again.");
            toast.error(message, {
                theme: "colored",
                position: "top-center"
            })
        }).finally(() => setIsSubmitting(false))
    }

    function requestPasswordReset(values) {
        if (isSubmitting) {
            return;
        }
        const email = values.resetEmail?.trim().toLowerCase();
        if (!email) {
            toast.error("Enter your account email.", {
                theme: "colored",
                position: "top-center"
            });
            return;
        }

        setIsSubmitting(true);
        userService.requestPasswordResetOtp({ email }).then(result => {
            setResetEmail(email);
            setAuthMode("resetConfirm");
            toast("Password reset OTP sent if this email exists.", {
                theme: "colored",
                position: "top-center"
            });
        }).catch(e => {
            const message = getErrorMessage(e, "Could not start password reset. Please try again.");
            toast.error(message, {
                theme: "colored",
                position: "top-center"
            });
        }).finally(() => setIsSubmitting(false))
    }

    function resetPassword(values) {
        if (isSubmitting) {
            return;
        }
        if (values.newPassword !== values.confirmPassword) {
            toast.error("Passwords do not match.", {
                theme: "colored",
                position: "top-center"
            });
            return;
        }

        setIsSubmitting(true);
        userService.resetPassword({
            email: resetEmail,
            otp: (values.otp || "").replace(/\D/g, "").slice(0, 6),
            newPassword: values.newPassword
        }).then(() => {
            setAuthMode("login");
            setResetEmail("");
            toast("Password reset. Please sign in with your new password.", {
                theme: "colored",
                position: "top-center"
            });
        }).catch(e => {
            const message = getErrorMessage(e, "Could not reset password. Please check the OTP.");
            toast.error(message, {
                theme: "colored",
                position: "top-center"
            });
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
                        enableReinitialize
                        initialValues={{}}
                        onSubmit={(value) => {
                            if (authMode === "resetRequest") {
                                requestPasswordReset(value);
                            } else if (authMode === "resetConfirm") {
                                resetPassword(value);
                            } else {
                                login(value);
                            }
                        }}>
                        <Form>
                            <div className="modal-body">
                                {authMode === "login" ? (
                                <>
                                <div className="form-floating mb-3">
                                    <KaanKaplanTextInput id="loginEmail" type="email" name="email" className="form-control" placeholder="Email" required />
                                    <label htmlFor="loginEmail">Email</label>
                                </div>
                                <div className="form-floating mb-3">
                                    <KaanKaplanTextInput id="loginPassword" type="password" name="password" className="form-control" placeholder="Password" required />
                                    <label htmlFor="loginPassword">Password</label>
                                </div>
                                <div className='auth-modal-links'>
                                    <button type='button' className='auth-text-button' onClick={() => setAuthMode("resetRequest")}>
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
                                    <KaanKaplanTextInput id="resetEmail" type="email" name="resetEmail" className="form-control" placeholder="Email" required />
                                    <label htmlFor="resetEmail">Account Email</label>
                                </div>
                                <button type='button' className='auth-text-button' onClick={() => setAuthMode("login")}>
                                    Back to sign in
                                </button>
                                </>
                                ) : null}

                                {authMode === "resetConfirm" ? (
                                <>
                                <p className='auth-helper-text'>Enter the OTP sent to <strong>{resetEmail}</strong>, then choose a new password.</p>
                                <div className="form-floating mb-3">
                                    <KaanKaplanTextInput id="resetOtp" type="text" name="otp" className="form-control" placeholder="OTP" inputMode="numeric" maxLength="6" required />
                                    <label htmlFor="resetOtp">6-digit OTP</label>
                                </div>
                                <div className="form-floating mb-3">
                                    <KaanKaplanTextInput id="newPassword" type="password" name="newPassword" className="form-control" placeholder="New Password" pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,72}" title="Use 8+ characters with uppercase, lowercase, number and special character" required />
                                    <label htmlFor="newPassword">New Password</label>
                                </div>
                                <div className="form-floating mb-3">
                                    <KaanKaplanTextInput id="confirmPassword" type="password" name="confirmPassword" className="form-control" placeholder="Confirm Password" required />
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                </div>
                                <button type='button' className='auth-text-button' onClick={() => setAuthMode("resetRequest")}>
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
        <ToastContainer />
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

