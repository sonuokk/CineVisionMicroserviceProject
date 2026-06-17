import React from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom';
import { removeUserFromState } from '../store/actions/userActions';

export default function LoggedIn() {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  function signOut() {
    closeMovieDrawer();
    sessionStorage.removeItem("lastBooking");
    sessionStorage.removeItem("lastBookingUserEmail");
    sessionStorage.removeItem("cineSagaPendingPath");
    dispatch(removeUserFromState());
    navigate("/");
  }

  return (
    <>
      <li className="nav-item">
        <button type='button' className="nav-link nav-action-button" onClick={() => {
          closeMovieDrawer();
          navigate("/profile");
        }}>
          Profile
        </button>
      </li>
      <li className="nav-item">
        <button type='button' className="nav-link nav-action-button" onClick={signOut}>
          Sign Out
        </button>
      </li>
    </>
  )
}

function closeMovieDrawer() {
  const drawer = document.getElementById("offcanvasTop")
  if (!drawer?.classList.contains("show")) {
    return
  }

  const bootstrapOffcanvas = window.bootstrap?.Offcanvas?.getInstance(drawer)
  if (bootstrapOffcanvas) {
    bootstrapOffcanvas.hide()
    return
  }

  drawer.querySelector("[data-bs-dismiss='offcanvas']")?.click()
}

