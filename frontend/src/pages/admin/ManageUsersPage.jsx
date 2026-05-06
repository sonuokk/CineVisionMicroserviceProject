import { Form, Formik } from 'formik';
import React, { useEffect, useState } from 'react'
import { toast, ToastContainer } from 'react-toastify';
import { UserService } from '../../services/userService';
import KaanKaplanTextInput from '../../utils/customFormItems/KaanKaplanTextInput';

export default function ManageUsersPage() {

    const userService = new UserService();
    const [users, setUsers] = useState([]);

    const loadUsers = () => {
        userService.getAllUsers()
            .then(result => setUsers(result.data))
            .catch(() => toast.error("Could not load users. Please sign in as admin.", {
                theme: "colored",
                position: "top-center"
            }));
    }

    useEffect(() => {
        loadUsers();
    }, [])

    const promoteUser = (values, helpers) => {
        userService.promoteUserToAdmin(values.email)
            .then(result => {
                toast.success(`${result.data.fullName || result.data.email} is now an admin.`, {
                    theme: "colored",
                    position: "top-center"
                });
                helpers.resetForm();
                loadUsers();
            })
            .catch(e => {
                const message = e.response?.data?.message
                    || Object.values(e.response?.data || {})[0]
                    || "Could not promote user.";
                toast.error(message, {
                    theme: "colored",
                    position: "top-center"
                });
            });
    }

    return (
        <div className="container py-5 mt-5 text-start">
            <div className="row justify-content-center">
                <div className="col-12 col-lg-8">
                    <h2 className="mb-3">Manage Users</h2>
                    <p className="text-muted">Promote an existing registered user to admin by email.</p>

                    <Formik initialValues={{ email: "" }} onSubmit={promoteUser}>
                        <Form className="row gy-3 align-items-end mb-5">
                            <div className="col-12 col-md-8">
                                <label htmlFor="promoteEmail" className="form-label">User Email</label>
                                <KaanKaplanTextInput id="promoteEmail" type="email" name="email" className="form-control" placeholder="user@example.com" required />
                            </div>
                            <div className="col-12 col-md-4">
                                <button type="submit" className="btn btn-primary w-100">Make Admin</button>
                            </div>
                        </Form>
                    </Formik>

                    <div className="table-responsive">
                        <table className="table table-striped align-middle">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.userId || user.email}>
                                        <td>{user.fullName || "-"}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role}</td>
                                    </tr>
                                ))}
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center text-muted py-4">No users found.</td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    )
}
