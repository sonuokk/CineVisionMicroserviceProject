import { Form, Formik } from 'formik';
import React from 'react'
import { useDispatch } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import { UserService } from '../services/userService'
import { addUserToState, removeUserFromState } from '../store/actions/userActions';
import KaanKaplanTextInput from '../utils/customFormItems/KaanKaplanTextInput';

export default function LoginModal() {

    const userService = new UserService();

    const dispatch = useDispatch();

    function login(loginDto) {
        dispatch(removeUserFromState())

        userService.login(loginDto).then(result => {

            if (result.status === 200) {
                dispatch(addUserToState(result.data))
    
                let closeButton = document.getElementById("close-button");
                closeButton.click();

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
        })
    }


  return (
    <div>
        <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                <div class="modal-header login-modal-header">
                    <h5 class="modal-title" id="loginModalLabel">Sign In</h5>
                    <button id='close-button' type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                    <Formik
                        enableReinitialize
                        initialValues={{}}
                        onSubmit={(value) => {
                            login(value);
                        }}>
                        <Form>
                            <div class="modal-body">
                                <div class="form-floating mb-3">
                                    <KaanKaplanTextInput id="email" type="email" name="email" class="form-control" placeholder="Email" required />
                                    <label for="floatingInput">Email</label>
                                </div>
                                <div class="form-floating mb-3">
                                    <KaanKaplanTextInput id="password" type="password" name="password" class="form-control" placeholder="Password" required />
                                    <label for="floatingPassword">Password</label>
                                </div>
                                <p className='ps-2 text-start'>
                                    New to CineSaga?
                                    <a href='!#' style={{color:"black"}}
                                        data-bs-toggle="modal" data-bs-target="#registerModal"> Create an account </a>
                                </p>
                            </div>
                            <div class="modal-footer">
                                <button type="submit" class="btn btn-primary login-modal-btn">Sign In</button>
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

