import { Navigate } from "react-router-dom"

const ProtectedRoute = ({children, user}) => {

    if(user !== "ADMIN" && user !== "ROLE_ADMIN") {
        return <Navigate to="/" />
    }
    return children;
}

export default ProtectedRoute;
