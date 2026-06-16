import { useAuth } from "@/context/AuthContext"
import MemberDashboard from "./MemberDashboard"
import TrainerDashboard from "./TrainerDashboard"

export default function Dashboard() {
    const { user } = useAuth()

    // Ensure the role claim matches exactly what you get from your JWT decoder
    if (user?.role === "Coach") {
        return <TrainerDashboard />
    }

    if (user?.role === "Admin") {
        return <div className="p-12 text-center text-2xl font-bold">Admin Portal (Coming Soon)</div>
    }

    // Default fallback for regular members
    return <MemberDashboard />
}