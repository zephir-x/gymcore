import { Link, Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import * as React from "react";

export default function Home() {
    const { user, logout } = useAuth()

    // Employees land at home
    if (user?.role === "Coach" || user?.role === "Admin") {
        return <Navigate to="/dashboard" replace />
    }

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault()
        logout()
    }

    const displayName = user?.firstName || "Stranger"

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col p-6 md:p-12">
            {/* Header */}
            <header className="w-full max-w-5xl mx-auto mb-12 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900">
                        GYM<span className="text-primary">CORE</span>
                    </h1>
                    <p className="text-slate-500 mt-1 text-lg font-medium">Welcome back, {displayName}!</p>
                </div>
            </header>

            {/* Tiled Hub */}
            <main className="flex-grow w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 content-start animate-in fade-in duration-500">

                {/* Dashboard */}
                <Link to="/dashboard" className="block group">
                    <Card className="h-full bg-white border-slate-200 hover:border-primary hover:shadow-md transition-all">
                        <CardHeader>
                            <CardTitle className="text-2xl text-slate-800 group-hover:text-primary transition-colors">My Profile</CardTitle>
                            <CardDescription className="text-slate-500">View your booked classes, personal training sessions and active plan.</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                {/* Group */}
                <Link to="/classes" className="block group">
                    <Card className="h-full bg-white border-slate-200 hover:border-primary hover:shadow-md transition-all">
                        <CardHeader>
                            <CardTitle className="text-2xl text-slate-800 group-hover:text-primary transition-colors">Group Classes</CardTitle>
                            <CardDescription className="text-slate-500">Browse the schedule and book a spot in upcoming workouts.</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                {/* Personal */}
                <Link to="/personal-training" className="block group">
                    <Card className="h-full bg-white border-slate-200 hover:border-primary hover:shadow-md transition-all">
                        <CardHeader>
                            <CardTitle className="text-2xl text-slate-800 group-hover:text-primary transition-colors">1:1 Training</CardTitle>
                            <CardDescription className="text-slate-500">Find an expert coach and reserve a dedicated 1:1 time slot.</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>

                {/* Logout */}
                <div className="sm:col-span-2 lg:col-span-3 mt-6">
                    <Button variant="outline" onClick={handleLogout} className="w-full text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 border-dashed">
                        Log Out
                    </Button>
                </div>
            </main>
        </div>
    )
}