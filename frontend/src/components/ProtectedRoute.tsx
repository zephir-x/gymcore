import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export default function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) return <div>Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    // If we are logged in, <Outlet> will render the target component
    return <Outlet />
}