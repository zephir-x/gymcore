import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import ProtectedRoute from "./components/ProtectedRoute"
import { Toaster } from "@/components/ui/sonner"

// We define the path structure in the application
const router = createBrowserRouter([
    {
        path: "/",
        element: <Home />,
    },
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/register",
        element: <Register />,
    },
    {
        element: <ProtectedRoute />,
        children: [
            {
                path: "/dashboard",
                element: <Dashboard />,
            },
            // In the future we will put here e.g. /classes, /admin-panel etc.
        ],
    },
    {
        // The asterisk catches anything that doesn't match the paths above (Error 404)
        path: "*",
        element: <div className="p-10 text-2xl font-bold text-destructive">404 - Page not found</div>,
    }
])

export default function App() {
    return (
        <>
            <RouterProvider router={router} />
            <Toaster position="top-center" richColors />
        </>
    )
}