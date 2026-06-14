import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"

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
        path: "/dashboard",
        element: <Dashboard />,
    },
    {
        // The asterisk catches anything that doesn't match the paths above (Error 404)
        path: "*",
        element: <div className="p-10 text-2xl font-bold text-destructive">404 - Nie znaleziono strony</div>,
    }
])

export default function App() {
    return <RouterProvider router={router} />
}