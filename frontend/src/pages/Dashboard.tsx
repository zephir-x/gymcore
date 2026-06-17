import { useAuth } from "@/context/AuthContext"
import MemberDashboard from "./MemberDashboard"
import TrainerDashboard from "./TrainerDashboard"
import AdminDashboard from "./AdminDashboard"

export default function Dashboard() {
    const { user } = useAuth()

    // Ensure the role claim matches exactly what you get from your JWT decoder
    if (user?.role === "Coach") {
        return <TrainerDashboard />
    }

    if (user?.role === "Admin") {
        return <AdminDashboard />
    }

    // Default fallback for regular members
    return <MemberDashboard />
}