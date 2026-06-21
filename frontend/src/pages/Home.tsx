import * as React from "react"
import { Link, Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Home() {
    const { user, logout } = useAuth()

    // Employees land at their dashboard
    if (user?.role === "Coach" || user?.role === "Admin") {
        return <Navigate to="/dashboard" replace />
    }

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault()
        logout()
    }

    const displayName = user?.firstName || "Stranger"
    const displayLastName = (user as any)?.lastName || ""

    return (
        <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden select-none">
            {/* Left Column */}
            <aside className="hidden lg:flex w-[320px] flex-col border-r border-white/10 bg-zinc-950 p-6 overflow-hidden h-full shrink-0">
                <div className="mb-10 shrink-0">
                    <h1 className="text-3xl font-black italic tracking-tighter bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
                        GYMCORE
                    </h1>
                </div>

                {/* Profile Info */}
                <Link
                    to="/dashboard"
                    className="flex items-center gap-4 mb-8 p-3 -mx-3 rounded-2xl border border-transparent hover:border-white/5 hover:bg-zinc-900/40 transition-all duration-300 group shrink-0"
                >
                    <Avatar className="h-14 w-14 border-2 border-orange-500 group-hover:scale-105 transition-transform duration-300">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-zinc-800 text-orange-500 font-bold text-xl">
                            {displayName.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                        <h2 className="text-lg font-bold text-white leading-tight truncate group-hover:text-orange-500 transition-colors">
                            {displayName} {displayLastName}
                        </h2>
                        <p className="text-sm text-zinc-400 font-medium mb-1">{user?.role}</p>

                        <div className="px-2 py-0.5 bg-zinc-950 border border-dashed border-zinc-800 rounded text-[10px] text-zinc-500 whitespace-nowrap overflow-hidden text-ellipsis">
                            PLACEHOLDER: Member for 5 months
                        </div>
                    </div>
                </Link>

                {/* Small Stat Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
                    <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center h-24">
                        <span className="text-xs text-zinc-500 mb-1">Current Plan</span>
                        <span className="text-sm font-bold text-zinc-400">PLACEHOLDER</span>
                    </div>
                    <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center h-24">
                        <span className="text-xs text-zinc-500 mb-1">Workouts</span>
                        <span className="text-sm font-bold text-zinc-400">PLACEHOLDER</span>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl mb-6 flex items-center justify-center p-4 text-center min-h-0">
                    <p className="text-sm text-zinc-500 font-medium">PLACEHOLDER:<br/>Messages List</p>
                </div>

                {/* Logout Button */}
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors shrink-0">
                    <LogOut size={20} className="mr-3" /> Log Out
                </Button>
            </aside>


            {/* Central Area */}
            <main className="flex-1 flex flex-col overflow-y-auto p-8 lg:p-12 bg-zinc-950 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <header className="mb-10 shrink-0">
                    <h2 className="text-4xl font-bold text-white mb-1">Welcome back, {displayName}!</h2>
                    <p className="text-lg text-zinc-400 font-medium">What are we doing today?</p>
                </header>

                <div className="space-y-12 pb-12">
                    {/* Horizontal List: Explore Rooms */}
                    <section>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-xl font-bold text-white">Explore Rooms</h3>
                        </div>
                        {/* Flex z możliwością przewijania w bok (overflow-x-auto) */}
                        <div className="w-full h-44 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl flex items-center justify-center shrink-0">
                            <p className="text-zinc-500 font-medium">PLACEHOLDER: Horizontal Scroll (All Facility Rooms)</p>
                        </div>
                    </section>

                    {/* Horizontal List: Group Classes */}
                    <section>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-xl font-bold text-white">Upcoming Group Classes</h3>
                        </div>
                        <div className="w-full h-60 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl flex items-center justify-center shrink-0">
                            <p className="text-zinc-500 font-medium">PLACEHOLDER: Horizontal Scroll (Group Classes)</p>
                        </div>
                    </section>

                    {/* Horizontal List: Personal Trainers */}
                    <section>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-xl font-bold text-white">Personal Trainers</h3>
                        </div>
                        <div className="w-full h-60 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl flex items-center justify-center shrink-0">
                            <p className="text-zinc-500 font-medium">PLACEHOLDER: Horizontal Scroll (Trainers)</p>
                        </div>
                    </section>
                </div>
            </main>
            
            {/* Right Column */}
            <aside className="hidden xl:flex w-[350px] flex-col border-l border-white/10 bg-zinc-950 p-6 overflow-hidden h-full justify-between shrink-0">

                {/* Upcoming Events */}
                <div className="flex-1 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl flex items-center justify-center p-6 text-center mb-4 min-h-0">
                    <p className="text-sm text-zinc-500 font-medium">PLACEHOLDER:<br/>My Upcoming Bookings List</p>
                </div>

                {/* Google Maps Directions */}
                <div className="h-[140px] bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl flex items-center justify-center p-6 text-center mb-4 shrink-0">
                    <p className="text-sm text-zinc-500 font-medium">PLACEHOLDER:<br/>Google Maps Directions</p>
                </div>

                {/* AI Assistant Widget */}
                <div className="h-[120px] bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl flex items-center justify-center p-6 text-center shrink-0">
                    <p className="text-sm text-zinc-500 font-medium">PLACEHOLDER:<br/>AI Assistant Widget</p>
                </div>
            </aside>
        </div>
    )
}