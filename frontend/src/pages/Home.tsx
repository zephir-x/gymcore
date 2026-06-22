import * as React from "react"
import { Link, Navigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { LogOut, Clock, ChevronRight, CheckCircle2, Users, Award, Activity, Calendar, XCircle, Dumbbell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface GroupClass { id: string; name: string; startTime: string; endTime: string; maxAttendees: number; currentBookings: number }
interface Reservation { reservationId: string; targetId: string | null; title: string; trainerName: string; startTime: string; endTime: string; status: string; type: string; }
interface Subscription { subscriptionId: string; tierName: string; startDate: string; endDate: string; status: string; }
interface Coach { id: string; firstName: string; lastName: string }
interface Room { id: string; name: string; maxCapacity: number; requiredTierId: string | null; requiredTierName: string | null; }

export default function Home() {
    const { user, logout } = useAuth()
    const queryClient = useQueryClient()

    /* QUERIES */
    const { data: classes, isLoading: isClassesLoading } = useQuery<GroupClass[]>({
        queryKey: ['classes'],
        queryFn: async () => { const res = await api.get('/api/bookings/classes'); return res.data }
    })

    const { data: reservations } = useQuery<Reservation[]>({
        queryKey: ['my-reservations'],
        queryFn: async () => { const res = await api.get('/api/bookings/my-reservations'); return res.data }
    })

    const { data: subscription, isLoading: isSubscriptionLoading } = useQuery<Subscription | null>({
        queryKey: ['my-subscription'],
        queryFn: async () => { const res = await api.get('/api/subscriptions/my'); return res.data }, retry: false
    })

    const { data: coaches, isLoading: isCoachesLoading } = useQuery<Coach[]>({
        queryKey: ['coaches'],
        queryFn: async () => { const res = await api.get('/api/bookings/coaches'); return res.data }
    })

    const { data: rooms, isLoading: isRoomsLoading } = useQuery<Room[]>({
        queryKey: ['rooms'],
        queryFn: async () => {
            const res = await api.get('/api/bookings/rooms');
            return res.data;
        }
    })
    
    /* MUTATIONS */
    const bookMutation = useMutation({
        mutationFn: async (classId: string) => { const res = await api.post(`/api/bookings/classes/${classId}`); return res.data },
        onSuccess: async (data) => {
            toast.success("Spot Secured!", { description: data.Message || "You have successfully booked the class." })
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['classes'] }),
                queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
            ])
        },
        onError: (error: any) => {
            console.error("Booking error:", error)
            toast.error("Booking Failed", { description: "Could not book this class. Make sure you have an active subscription." })
        }
    })
    
    const cancelReservationMutation = useMutation({
        mutationFn: async (reservationId: string) => {
            const res = await api.delete(`/api/bookings/reservations/${reservationId}`)
            return res.data
        },
        onSuccess: async (data) => {
            toast.success("Reservation Cancelled", { description: data.Message || "Your spot has been freed successfully." })
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['classes'] }),
                queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
            ])
        },
        onError: (error: any) => {
            console.error("Cancellation Error:", error)
            toast.error("Action Failed", { description: "Could not cancel this reservation. Please try again later." })
        }
    })

    if (user?.role === "Coach" || user?.role === "Admin") return <Navigate to="/dashboard" replace />

    const handleLogout = (e: React.MouseEvent) => { e.preventDefault(); logout() }

    const displayName = user?.firstName || "Stranger"
    const displayLastName = (user as any)?.lastName || ""

    const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
    const formatSubDate = (dateString: string) => new Date(dateString).toLocaleDateString([], { month: 'short', year: 'numeric' })
    
    const nowTime = new Date().getTime()
    
    const pastWorkoutsCount = reservations?.filter(r =>
        new Date(r.endTime).getTime() < nowTime && r.status !== "Class Cancelled by Gym"
    ).length || 0
    
    const upcomingBookings = reservations?.filter(r =>
        new Date(r.endTime).getTime() >= nowTime
    ) || []
    
    return (
        <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden select-none">
            {/* LEFT COLUMN: PROFILE & NAV */}
            <aside className="hidden lg:flex w-[320px] flex-col border-r border-white/10 bg-zinc-950 p-6 overflow-hidden h-full shrink-0">
                {/* LOGO */}
                <div className="mb-10 shrink-0 flex justify-center w-full">
                    <h1 className="text-3xl font-black italic tracking-tighter bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
                        GYMCORE
                    </h1>
                </div>

                {/* PROFILE CARD */}
                <Link to="/dashboard" className="flex flex-col items-center justify-center text-center gap-2 mb-6 p-4 rounded-2xl border border-transparent hover:border-white/5 hover:bg-zinc-900/40 transition-all duration-300 group shrink-0 w-full">
                    <Avatar className="h-16 w-16 border-2 border-orange-500 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-zinc-800 text-orange-500 font-bold text-2xl">
                            {displayName.charAt(0)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col items-center min-w-0 mt-1">
                        <h2 className="text-lg font-bold text-white leading-tight group-hover:text-orange-500 transition-colors">
                            <span className="block">{displayName}</span>
                            <span className="block">{displayLastName}</span>
                        </h2>

                        <p className="text-xs text-zinc-400 font-medium mt-1 mb-2">{user?.role}</p>
                        
                        {/* DYNAMIC MEMBERSHIP BADGE */}
                        <div className="px-3 py-1 bg-zinc-950 border border-dashed border-zinc-800 rounded-md text-[10px] text-zinc-500 whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1.5">
                            <Award size={12} className={subscription ? "text-orange-500" : "text-zinc-600"} />
                            {subscription ? `Active since ${formatSubDate(subscription.startDate)}` : "No Active Membership"}
                        </div>
                    </div>
                </Link>

                {/* DYNAMIC STATS (CURRENT PLAN & WORKOUTS) */}
                <div className="grid grid-cols-2 gap-4 mb-4 shrink-0 w-full">
                    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center h-24 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 z-10">Current Plan</span>
                        {isSubscriptionLoading ? (
                            <div className="h-5 w-16 bg-zinc-800 animate-pulse rounded z-10" />
                        ) : (
                            <span className={`text-sm font-black z-10 ${subscription ? 'text-orange-400' : 'text-zinc-500'}`}>
                                {subscription ? subscription.tierName : "FREE"}
                            </span>
                        )}
                    </div>

                    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center h-24 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 z-10">Workouts</span>
                        <div className="flex items-center justify-center gap-1.5 z-10">
                            <Activity size={14} className="text-zinc-600" />
                            <span className="text-xl font-black text-white">{pastWorkoutsCount}</span>
                        </div>
                    </div>
                </div>

                {/* MESSAGES */}
                <div className="flex-1 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl mb-6 flex flex-col items-center justify-center p-4 text-center min-h-0 w-full">
                    <p className="text-sm text-zinc-500 font-medium">PLACEHOLDER:<br/>Messages List</p>
                </div>

                {/* LOGOUT */}
                <Button variant="ghost" onClick={handleLogout} className="w-full justify-center text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors shrink-0">
                    <LogOut size={20} className="mr-3" /> Log Out
                </Button>
            </aside>

            {/* CENTRAL AREA: MAIN DASHBOARD */}
            <main className="flex-1 flex flex-col overflow-y-auto p-8 lg:p-12 bg-zinc-950 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {/* GREETING HEADER */}
                <header className="mb-10 shrink-0">
                    <h2 className="text-4xl font-bold text-white mb-1">Welcome back, {displayName}!</h2>
                    <p className="text-lg text-zinc-400 font-medium">What are we doing today?</p>
                </header>

                <div className="space-y-12 pb-12">
                    {/* MODULE: EXPLORE ROOMS */}
                    <section>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-xl font-bold text-white">Explore Rooms</h3>
                            <Link to="/rooms" className="text-sm font-semibold text-orange-500 hover:text-orange-400 transition-colors flex items-center">
                                All rooms <ChevronRight size={16} className="ml-1" />
                            </Link>
                        </div>

                        <div className="relative">
                            <div className="flex overflow-x-auto gap-4 pb-4 pr-16 snap-x snap-mandatory [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700">
                                {isRoomsLoading ? (
                                    [1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-[240px] h-[140px] shrink-0 snap-start animate-pulse bg-zinc-900/50 border border-white/5 rounded-2xl" />
                                    ))
                                ) : rooms && rooms.length > 0 ? (
                                    <>
                                        {/* LIMIT TO MAX 5 ROOMS */}
                                        {rooms.slice(0, 5).map((room) => (
                                            <div key={room.id} className="w-[240px] h-[140px] shrink-0 snap-start bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/60 hover:border-white/10 transition-all duration-300 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group cursor-pointer">
                                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500" />

                                                <div className="relative z-10">
                                                    <h4 className="text-white font-bold text-lg leading-tight mb-1 truncate">{room.name}</h4>
                                                    <div className="flex items-center text-zinc-500 text-xs font-medium">
                                                        <Users size={12} className="mr-1.5" /> Max Capacity: {room.maxCapacity}
                                                    </div>
                                                </div>

                                                <div className="relative z-10">
                                                    {room.requiredTierName ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                                                            Requires {room.requiredTierName}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                                                            Open Access
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {/* PERMANENT VIEW ALL CARD AT THE END */}
                                        <Link to="/rooms" className="w-[140px] shrink-0 snap-start bg-zinc-900/20 border border-dashed border-zinc-800 hover:border-orange-500/30 rounded-2xl flex flex-col items-center justify-center p-5 group transition-all duration-300">
                                            <div className="bg-zinc-950 p-3 rounded-full mb-3 group-hover:scale-110 group-hover:bg-orange-500/10 transition-all duration-300">
                                                <ChevronRight size={24} className="text-zinc-500 group-hover:text-orange-500" />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-500 group-hover:text-orange-500">View All</span>
                                        </Link>
                                    </>
                                ) : (
                                    <div className="w-full h-36 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl flex items-center justify-center shrink-0">
                                        <p className="text-zinc-500 font-medium">No rooms available right now.</p>
                                    </div>
                                )}
                            </div>
                            <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />
                        </div>
                    </section>

                    {/* MODULE: GROUP CLASSES */}
                    <section>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-xl font-bold text-white">Upcoming Group Classes</h3>
                            <Link to="/classes" className="text-sm font-semibold text-orange-500 hover:text-orange-400 transition-colors flex items-center">
                                Full schedule <ChevronRight size={16} className="ml-1" />
                            </Link>
                        </div>

                        <div className="relative">
                            <div className="flex overflow-x-auto gap-4 pb-4 pr-16 snap-x snap-mandatory [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700">
                                {isClassesLoading ? (
                                    [1, 2, 3].map((i) => <div key={i} className="w-[300px] h-[190px] shrink-0 snap-start animate-pulse bg-zinc-900/50 border border-white/5 rounded-2xl p-5" />)
                                ) : classes && classes.length > 0 ? (
                                    <>
                                        {classes.slice(0, 5).map((cls) => {
                                            const isFull = cls.currentBookings >= cls.maxAttendees
                                            const spotsLeft = cls.maxAttendees - cls.currentBookings
                                            const isBooked = reservations?.some(r => r.targetId === cls.id && r.type === "Group")

                                            return (
                                                <div key={cls.id} className={`w-[300px] shrink-0 snap-start bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/60 hover:border-white/10 transition-all duration-300 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden ${isFull ? "opacity-80" : ""}`}>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h4 className="text-white font-bold text-lg leading-tight truncate max-w-[150px]">{cls.name}</h4>
                                                            <p className="text-orange-500 text-sm font-medium mt-0.5">{formatDate(cls.startTime)}</p>
                                                        </div>
                                                        {isFull ? <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">Full</span>
                                                            : <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">{spotsLeft} left</span>}
                                                    </div>
                                                    <div className="flex items-center text-zinc-400 text-xs font-semibold bg-zinc-950 border border-white/5 px-3 py-2 rounded-lg mb-5 w-fit">
                                                        <Clock size={14} className="mr-2 text-orange-500" />
                                                        {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                                                    </div>
                                                    <Button
                                                        className={`w-full font-bold h-10 border-none transition-all duration-300 shadow-md ${
                                                            isBooked ? "bg-zinc-800 text-green-400 border border-green-500/20 cursor-not-allowed flex items-center justify-center gap-2" :
                                                                isFull ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" :
                                                                    "bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                                                        }`}
                                                        onClick={() => bookMutation.mutate(cls.id)}
                                                        disabled={isFull || isBooked || bookMutation.isPending}
                                                    >
                                                        {bookMutation.isPending ? "Processing..." : isBooked ? <><CheckCircle2 size={16} /> Booked</> : isFull ? "Waitlist (Soon)" : "Book Spot"}
                                                    </Button>
                                                </div>
                                            )
                                        })}

                                        <Link to="/classes" className="w-[140px] shrink-0 snap-start bg-zinc-900/20 border border-dashed border-zinc-800 hover:border-orange-500/30 rounded-2xl flex flex-col items-center justify-center p-5 group transition-all duration-300">
                                            <div className="bg-zinc-950 p-3 rounded-full mb-3 group-hover:scale-110 group-hover:bg-orange-500/10 transition-all duration-300">
                                                <ChevronRight size={24} className="text-zinc-500 group-hover:text-orange-500" />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-500 group-hover:text-orange-500">View All</span>
                                        </Link>
                                    </>
                                ) : (
                                    <div className="w-full h-40 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl flex items-center justify-center shrink-0">
                                        <p className="text-zinc-500 font-medium">No upcoming classes available right now.</p>
                                    </div>
                                )}
                            </div>
                            <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />
                        </div>
                    </section>

                    {/* MODULE: PERSONAL TRAINERS */}
                    <section>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-xl font-bold text-white">Personal Trainers</h3>
                            <Link to="/personal-training" className="text-sm font-semibold text-orange-500 hover:text-orange-400 transition-colors flex items-center">
                                All trainers <ChevronRight size={16} className="ml-1" />
                            </Link>
                        </div>

                        <div className="relative">
                            <div className="flex overflow-x-auto gap-4 pb-4 pr-16 snap-x snap-mandatory [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700">
                                {isCoachesLoading ? (
                                    [1, 2, 3].map((i) => <div key={i} className="w-[280px] h-[160px] shrink-0 snap-start animate-pulse bg-zinc-900/50 border border-white/5 rounded-2xl p-5" />)
                                ) : coaches && coaches.length > 0 ? (
                                    <>
                                        {coaches.slice(0, 5).map((coach) => (
                                            <div key={coach.id} className="w-[280px] shrink-0 snap-start bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/60 hover:border-white/10 transition-all duration-300 rounded-2xl p-5 flex flex-col justify-between">

                                                <div className="flex items-center gap-4 mb-4">
                                                    <Avatar className="h-12 w-12 border border-orange-500 shrink-0">
                                                        <AvatarFallback className="bg-zinc-800 text-orange-500 font-bold">
                                                            {coach.firstName[0]}{coach.lastName[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h4 className="text-white font-bold text-lg leading-tight">
                                                            <span className="block">{coach.firstName}</span>
                                                            <span className="block">{coach.lastName}</span>
                                                        </h4>
                                                        <p className="text-zinc-500 text-xs font-medium mt-1">Expert Coach</p>
                                                    </div>
                                                </div>

                                                <Link to={`/personal-training?coachId=${coach.id}`}>
                                                    <Button className="w-full font-bold h-10 border-none transition-all duration-300 shadow-md bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white">
                                                        View Schedule
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))}

                                        <Link to="/personal-training" className="w-[140px] shrink-0 snap-start bg-zinc-900/20 border border-dashed border-zinc-800 hover:border-orange-500/30 rounded-2xl flex flex-col items-center justify-center p-5 group transition-all duration-300">
                                            <div className="bg-zinc-950 p-3 rounded-full mb-3 group-hover:scale-110 group-hover:bg-orange-500/10 transition-all duration-300">
                                                <ChevronRight size={24} className="text-zinc-500 group-hover:text-orange-500" />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-500 group-hover:text-orange-500">View All</span>
                                        </Link>
                                    </>
                                ) : (
                                    <div className="w-full h-40 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl flex items-center justify-center shrink-0">
                                        <p className="text-zinc-500 font-medium">No trainers available right now.</p>
                                    </div>
                                )}
                            </div>
                            <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />
                        </div>
                    </section>
                </div>
            </main>

            {/* RIGHT COLUMN: WIDGETS */}
            <aside className="hidden xl:flex w-[350px] flex-col border-l border-white/10 bg-zinc-950 p-6 overflow-hidden h-full justify-between shrink-0">
                {/* MODULE: MY UPCOMING BOOKINGS */}
                <div className="flex-1 flex flex-col min-h-0 w-full mb-6">
                    <div className="flex items-center gap-2 mb-6 shrink-0">
                        <Calendar size={18} className="text-orange-500" />
                        <h3 className="text-lg font-bold text-white tracking-tight">Upcoming Schedule</h3>
                        <span className="ml-auto px-2 py-0.5 bg-zinc-900 border border-white/10 rounded-full text-[10px] font-black text-orange-400">
                            {upcomingBookings.length}
                        </span>
                    </div>
                    
                    <div className="relative flex-1 min-h-0">
                        <div className="h-full overflow-y-auto pr-1 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {upcomingBookings.length > 0 ? (
                                <div className="relative border-l-2 border-zinc-900 ml-3.5 pl-6 space-y-6">
                                    {upcomingBookings.map((booking) => {
                                        const isGroup = booking.type === "Group"
                                        return (
                                            <div key={booking.reservationId} className="relative group/item animate-in fade-in slide-in-from-right-4 duration-300">
                                                {/* TIMELINE PIN POINT */}
                                                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-zinc-950 border-2 border-orange-500 group-hover/item:scale-125 group-hover/item:bg-orange-500 transition-all duration-300 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />

                                                {/* GLOSSY TIMELINE CARD */}
                                                <div className="bg-zinc-900/30 border border-white/5 hover:border-white/10 hover:bg-zinc-900/60 p-4 rounded-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${isGroup ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                                {isGroup ? 'Group Class' : '1:1 Session'}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-zinc-500">
                                                                {formatDate(booking.startTime)}
                                                            </span>
                                                        </div>

                                                        <h4 className="text-white font-bold text-sm truncate leading-snug">
                                                            {booking.title}
                                                        </h4>
                                                    </div>

                                                    <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-0.5">
                                                        <div className="flex items-center text-zinc-400 text-xs font-semibold">
                                                            <Clock size={13} className="mr-1.5 text-orange-500" />
                                                            <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                                                        </div>

                                                        {/* INTERACTIVE CANCEL BUTTON ON HOVER */}
                                                        <button
                                                            disabled={cancelReservationMutation.isPending}
                                                            onClick={() => cancelReservationMutation.mutate(booking.reservationId)}
                                                            className="text-zinc-500 hover:text-red-400 flex items-center gap-1 text-[11px] font-bold opacity-0 group-hover/item:opacity-100 transition-all duration-300"
                                                        >
                                                            <XCircle size={13} /> Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                /* EMPTY TIMELINE STATE */
                                <div className="h-full border border-dashed border-zinc-900 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-zinc-600 space-y-3">
                                    <div className="p-3 bg-zinc-900/50 rounded-full border border-white/5">
                                        <Dumbbell size={20} className="text-zinc-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-400">No upcoming workouts</p>
                                        <p className="text-xs text-zinc-600 mt-1">Book a class or 1:1 session to fill your schedule.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
                    </div>
                </div>

                <div className="h-[140px] bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl flex items-center justify-center p-6 text-center mb-4 shrink-0 w-full">
                    <p className="text-sm text-zinc-500 font-medium">PLACEHOLDER:<br/>Google Maps Directions</p>
                </div>

                <div className="h-[120px] bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl flex items-center justify-center p-6 text-center shrink-0 w-full">
                    <p className="text-sm text-zinc-500 font-medium">PLACEHOLDER:<br/>AI Assistant Widget</p>
                </div>
            </aside>
        </div>
    )
}