import { Form, Formik } from 'formik';
import React, { useState } from 'react'
import { UserService } from '../services/userService'
import KaanKaplanTextInput from '../utils/customFormItems/KaanKaplanTextInput';
import { ToastContainer, toast } from 'react-toastify';

export default function RegisterModal() {

    const userService = new UserService();
    const [pendingEmail, setPendingEmail] = useState("");
    const [waitingForOtp, setWaitingForOtp] = useState(false);
    const [developmentOtp, setDevelopmentOtp] = useState("");

    const registerCustomer = (values) => {

        if (values.password === values.passwordAgain) {

            let customer = {
                customerName: values.customerName,
                email: values.email,
                    phone: values.phone?.trim() || "",
                password: values.password
            };

            userService.addCustomer(customer).then(result => {
                if(result.status === 200) {
                    setPendingEmail(customer.email);
                    setWaitingForOtp(true);
                    setDevelopmentOtp(result.data?.developmentOtp || "");
                    toast("OTP sent to your email. Enter it to create your account.", {
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
            })
        } else {
            toast.error("Passwords do not match.", {
                theme: "colored",
                position: "top-center"
            });
        }
    }

    const verifyRegistrationOtp = (values) => {
        userService.verifyCustomerOtp({
            email: pendingEmail,
            otp: values.otp
        }).then(result => {
            if (result.status === 200) {
                setWaitingForOtp(false);
                setPendingEmail("");
                setDevelopmentOtp("");
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
        })
    }

  return (
    <div>
        <div class="modal fade" id="registerModal" tabindex="-1" aria-labelledby="registerModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                <div class="modal-header login-modal-header">
                    <h5 class="modal-title" id="registerModalLabel">Create Account</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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
                        <div class="modal-body">
                            {waitingForOtp ? (
                            <>
                                <p className='text-start ps-2'>Enter the 6-digit OTP sent to {pendingEmail}.</p>
                                {developmentOtp ? <p className='text-start ps-2 text-muted'>Development OTP: {developmentOtp}</p> : null}
                                <div className="form-floating mb-3">
                                    <KaanKaplanTextInput type="text" name="otp" className="form-control" id="registrationOtp" placeholder='OTP' pattern="[0-9]{6}" maxLength="6" required/>
                                    <label for="registrationOtp">OTP</label>
                                </div>
                            </>
                            ) : (
                            <>
                            <div class="form-floating mb-3">
                                <KaanKaplanTextInput type="text" name="customerName" className="form-control" id="customerName" placeholder='Full Name' required/>
                                <label for="customerName">Full Name</label>
                            </div>
                            <div className="form-floating mb-3">
                                <KaanKaplanTextInput type="email" name="email" className="form-control" id="email" placeholder='Email' required />
                                <label for="email">Email</label>
                            </div>
                            <div className="form-floating mb-3">
                                <KaanKaplanTextInput type="tel" name="phone" className="form-control" id="phone" placeholder='Optional' />
                                <label for="phone">Indian Mobile Number Optional</label>
                            </div>
                            <div className="form-floating mb-3">
                                <KaanKaplanTextInput type="password" name="password" className="form-control" id="password" placeholder='Password' pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,72}" title="Use 8+ characters with uppercase, lowercase, number and special character" required/>
                                <label for="password">Password</label>
                            </div>
                            <div className="form-floating mb-3">
                                <KaanKaplanTextInput type="password" name="passwordAgain" className="form-control" id="passwordAgain" placeholder='Confirm Password' required/>
                                <label for="passwordAgain">Confirm Password</label>
                            </div>
                            </>
                            )}
                            <p className='ps-2 text-start'>
                                Already have an account? 
                                <a href='!#' id="loginModalLink" style={{color:"black"}}
                                data-bs-toggle="modal" data-bs-target="#loginModal"> Sign In </a>
                            </p>
                        </div>
                        <div class="modal-footer">
                            {waitingForOtp ? (
                                <button type="button" class="btn btn-outline-secondary" onClick={() => {
                                    setWaitingForOtp(false);
                                    setPendingEmail("");
                                    setDevelopmentOtp("");
                                }}>Edit Details</button>
                            ) : null}
                            <button type="submit" class="btn btn-primary login-modal-btn">{waitingForOtp ? "Verify OTP" : "Send OTP"}</button>
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

