import React from 'react'
import { useSelector } from 'react-redux'
import { Route, Routes } from 'react-router-dom'
import AddActorsAndCityToMovie from '../pages/admin/AddActorsAndCityToMovie'
import AddMoviePage from '../pages/admin/AddMoviePage'
import BookedTicketsPage from '../pages/admin/BookedTicketsPage'
import ManageTheatersPage from '../pages/admin/ManageTheatersPage'
import ManageUsersPage from '../pages/admin/ManageUsersPage'
import BuyTicketPage from '../pages/BuyTicketPage'
import DetailPage from '../pages/DetailPage'
import MainPage from '../pages/MainPage'
import PaymnetSuccessPage from '../pages/PaymentSuccessPage'
import ProfilePage from '../pages/ProfilePage'
import ErrorPage from '../utils/utilPages/ErrorPage'
import ProtectedRoute from '../utils/utilPages/ProtectedRoute'

export default function Dashboard() {

  const userFromRedux = useSelector(state => state?.user?.payload)
  const isAdmin = hasRole(userFromRedux, "ADMIN")
  const canManageTheaters = isAdmin || hasRole(userFromRedux, "THEATER_MANAGER")
  const canManageMovies = canManageTheaters

  return (
    <div> 
      <Routes>
        <Route path={"/"} element={<MainPage/>} />
        <Route path={"/movie/:movieId"} element={<DetailPage/>} />
        <Route path={"movie/:movieId/buyTicket"}  element={<BuyTicketPage/>} />       
        <Route path={"/paymentSuccess"}  element={<PaymnetSuccessPage/>} />
        <Route path={"/profile"} element={
          <ProtectedRoute user={userFromRedux}>
            <ProfilePage/>
          </ProtectedRoute>
        } />

        <Route path="/addMovie"  element={
          <ProtectedRoute user={canManageMovies}>
            <AddMoviePage/>
          </ProtectedRoute>   
        } />

        <Route path="/addMovie/:movieId"  element={
          <ProtectedRoute user={canManageMovies}>
            <AddActorsAndCityToMovie/>
          </ProtectedRoute>
        } />       

        <Route path="/admin/users"  element={
          <ProtectedRoute user={isAdmin}>
            <ManageUsersPage/>
          </ProtectedRoute>
        } />       

        <Route path="/admin/theaters"  element={
          <ProtectedRoute user={canManageTheaters}>
            <ManageTheatersPage/>
          </ProtectedRoute>
        } />       

        <Route path="/admin/bookings"  element={
          <ProtectedRoute user={canManageTheaters}>
            <BookedTicketsPage/>
          </ProtectedRoute>
        } />       

        <Route path='*' element={<ErrorPage />} />

      </Routes>

    </div>
  )
}

function hasRole(user, roleName) {
  return user?.roles?.some(role => role === roleName || role === "ROLE_" + roleName)
}
