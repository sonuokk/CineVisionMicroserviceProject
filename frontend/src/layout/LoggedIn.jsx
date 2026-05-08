import React from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom';
import { removeUserFromState } from '../store/actions/userActions';

export default function LoggedIn() {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <div>
        <ul className="navbar-nav ms-auto py-4 py-lg-0">
            <li className="nav-item">
                <button type='button' className="nav-link nav-action-button" onClick={() => navigate("/profile")}>
                  Profile
                </button>
            </li>
            <li className="nav-item">
                <button type='button' className="nav-link nav-action-button" onClick={() => dispatch(removeUserFromState())}>
                  Sign Out
                </button>
            </li>
        </ul>
    </div>
  )
}

