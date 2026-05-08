import { Form, Formik } from 'formik';
import React, { useState } from 'react'
import { UserService } from '../services/userService'
import KaanKaplanTextInput from '../utils/customFormItems/KaanKaplanTextInput';
import { ToastContainer, toast } from 'react-toastify';

export default function RegisterModal() {

    const userService = new UserService();
    const [pendingEmail, setPendingEmail] = useState("");
    const [waitingForOtp, setWaitingForOtp] = useState(false);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

    const registerCustomer = (values) => {
        if (isSendingOtp) {
            return;
        }

        if (values.password === values.passwordAgain) {
            setIsSendingOtp(true);

            let customer = {
                customerName: values.customerName?.trim(),
                email: values.email?.trim().toLowerCase(),
                password: values.password
            };

            userService.addCustomer(customer).then(result => {
                if(result.status === 200) {
                    setPendingEmail(customer.email);
                    setWaitingForOtp(true);
                    toast("OTP generated. The email is on its way.", {
                        theme:"colored",
                        position:"top-center"
                    })
                }
            }).catch(e => {
                const message = getErrorMessage(e, "Could not create account. Please check your details.");
                toast.error(message, {
                    theme: "colored",
                    position: "top-center"
                });
            }).finally(() => setIsSendingOtp(false))
        } else {
            toast.error("Passwords do not match.", {
                theme: "colored",
                position: "top-center"
            });
        }
    }

    const verifyRegistrationOtp = (values) => {
        if (isVerifyingOtp) {
            return;
        }

        const normalizedOtp = (values.otp || "").replace(/\D/g, "").slice(0, 6);
        if (normalizedOtp.length !== 6) {
            toast.error("Enter the 6-digit OTP from your email.", {
                theme: "colored",
                position: "top-center"
            });
            return;
        }

        setIsVerifyingOtp(true);
        userService.verifyCustomerOtp({
            email: pendingEmail.trim().toLowerCase(),
            otp: normalizedOtp
        }).then(result => {
            if (result.status === 200) {
                setWaitingForOtp(false);
                setPendingEmail("");
                document.querySelector("#loginModalLink").click();
                toast("Your account is verified. Please sign in.", {
                    theme: "colored",
                    position: "top-center"
                });
            }
        }).catch(e => {
            const message = getErrorMessage(e, "Invalid OTP. Please try again.");
            toast.error(message, {
                theme: "colored",
                position: "top-center"
            });
        }).finally(() => setIsVerifyingOtp(false))
    }

  return (
    <div>
        <div className="modal fade" id="registerModal" tabIndex="-1" aria-labelledby="registerModalLabel" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                <div className="modal-header login-modal-header">
                    <h5 className="modal-title" id="registerModalLabel">Create Account</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <Formik
                    enableReinitialize
                    initialValues={{}}
                    onSubmit={(values) => {
                        if (waitingForOtp) {
                            verifyRegistrationOtp(values);
                        } else {
                            registerCustomer(values);
                        }
                    }}>
                    <Form>
                        <div className="modal-body">
                            {waitingForOtp ? (
                            <>
                                <p className='text-start ps-2'>Enter the 6-digit OTP sent to {pendingEmail}.</p>
                                <div className="form-floating mb-3">
                                    <KaanKaplanTextInput type="text" name="otp" className="form-control" id="registrationOtp" placeholder='OTP' inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,12}" maxLength="12" required/>
                                    <label htmlFor="registrationOtp">OTP</label>
                                </div>
                            </>
                            ) : (
                            <>
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
                                <button type="button" className="btn btn-outline-secondary" onClick={() => {
                                    setWaitingForOtp(false);
                                    setPendingEmail("");
                                }}>Edit Details</button>
                            ) : null}
                            <button type="submit" className="btn btn-primary login-modal-btn" disabled={isSendingOtp || isVerifyingOtp}>
                                {waitingForOtp ? (isVerifyingOtp ? "Verifying..." : "Verify OTP") : (isSendingOtp ? "Sending..." : "Send OTP")}
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

