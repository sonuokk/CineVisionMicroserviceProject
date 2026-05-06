import { Form, Formik } from 'formik';
import React from 'react'
import { ToastContainer, toast } from 'react-toastify';
import { UserService } from '../services/userService';
import KaanKaplanTextInput from '../utils/customFormItems/KaanKaplanTextInput';

export default function AdminSetupModal() {

    const userService = new UserService();

    const createAdmin = (values) => {
        const admin = {
            fullName: values.fullName,
            email: values.email,
            password: values.password,
            setupKey: values.setupKey
        };

        userService.addAdmin(admin).then(result => {
            if (result.status === 200) {
                toast.success("Admin account created. You can sign in now.", {
                    theme: "colored",
                    position: "top-center"
                });
                document.getElementById("close-admin-setup-button")?.click();
                document.getElementById("loginModalLinkFromAdmin")?.click();
            }
        }).catch(e => {
            const message = e.response?.data?.message
                || Object.values(e.response?.data || {})[0]
                || "Could not create admin. Check the setup key and credentials.";
            toast.error(message, {
                theme: "colored",
                position: "top-center"
            });
        });
    }

    return (
        <div>
            <div className="modal fade" id="adminSetupModal" tabIndex="-1" aria-labelledby="adminSetupModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header login-modal-header">
                            <h5 className="modal-title" id="adminSetupModalLabel">Create Admin Account</h5>
                            <button id="close-admin-setup-button" type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <Formik initialValues={{}} onSubmit={(values) => createAdmin(values)}>
                            <Form>
                                <div className="modal-body">
                                    <div className="alert alert-warning small text-start">
                                        Database credentials stay in backend config files. This form only creates the admin user using your configured setup key.
                                    </div>
                                    <div className="form-floating mb-3">
                                        <KaanKaplanTextInput type="text" name="fullName" className="form-control" id="adminFullName" placeholder="Full Name" required />
                                        <label htmlFor="adminFullName">Full Name</label>
                                    </div>
                                    <div className="form-floating mb-3">
                                        <KaanKaplanTextInput type="email" name="email" className="form-control" id="adminEmail" placeholder="Email" required />
                                        <label htmlFor="adminEmail">Email</label>
                                    </div>
                                    <div className="form-floating mb-3">
                                        <KaanKaplanTextInput type="password" name="password" className="form-control" id="adminPassword" placeholder="Password" required />
                                        <label htmlFor="adminPassword">Password</label>
                                    </div>
                                    <div className="form-floating mb-3">
                                        <KaanKaplanTextInput type="password" name="setupKey" className="form-control" id="setupKey" placeholder="Setup Key" required />
                                        <label htmlFor="setupKey">Admin Setup Key</label>
                                    </div>
                                    <a href="!#" id="loginModalLinkFromAdmin" className="d-none"
                                        data-bs-toggle="modal" data-bs-target="#loginModal">Sign In</a>
                                </div>
                                <div className="modal-footer">
                                    <button type="submit" className="btn btn-primary login-modal-btn">Create Admin</button>
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
