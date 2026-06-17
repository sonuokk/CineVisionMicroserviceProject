import React from 'react'

export default function LoggedOut() {
  return (
    <>
      <li className="nav-item">
        <a className="nav-link" href="#!" data-bs-toggle="modal" data-bs-target="#registerModal" onClick={closeMovieDrawer}>Register</a>
      </li>
      <li className="nav-item">
        <a className="nav-link" href="#!" data-bs-toggle="modal" data-bs-target="#loginModal" onClick={closeMovieDrawer}>Sign In</a>
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

