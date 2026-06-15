import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export default function ProtectedRoute() {
    const { isAuthenticated } = useAuth()

    // If we're not logged in, React Router will use <Navigate> to redirect us to /login
    // The "replace" parameter prevents freeloaders from clicking "Back" in their browser to return
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    // If we are logged in, <Outlet> will render the target component (e.g. Dashboard)
    return <Outlet />
}