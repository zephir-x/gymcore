import * as React from "react"
import { useState, useRef, useEffect } from "react"
import ReactMarkdown from 'react-markdown'
import QRCode from "react-qr-code"
import { Link, Navigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import { toast } from "sonner"
import {
    LogOut,
    Clock,
    ChevronRight,
    Users,
    Award,
    Activity,
    Calendar,
    XCircle,
    Dumbbell,
    MapPin,
    Navigation,
    Bell,
    CheckCircle2,
    Send,
    Bot,
    Sparkles,
    Loader2,
    QrCode,
    UserCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface GroupClass { id: string; name: string; coachName: string; startTime: string; endTime: string; maxAttendees: number; currentBookings: number; imageUrl?: string | null }
interface Reservation { reservationId: string; targetId: string | null; title: string; trainerName: string; startTime: string; endTime: string; status: string; type: string; }
interface Subscription { subscriptionId: string; tierName: string; startDate: string; endDate: string; status: string; }
interface Coach { id: string; firstName: string; lastName: string; avatarUrl?: string | null; bio?: string | null }
interface Room { id: string; name: string; maxCapacity: number; requiredTierId: string | null; requiredTierName: string | null; imageUrl?: string | null; description?: string | null }
interface NotificationItem { id: string; title: string; message: string; isRead: boolean; createdAt: string; }
interface ChatMessage { role: 'user' | 'assistant'; content: string; }

export default function Home() {
    const { user, logout } = useAuth()
    const queryClient = useQueryClient()

    const [selectedRoomDetails, setSelectedRoomDetails] = useState<Room | null>(null);
    const [selectedClassDetails, setSelectedClassDetails] = useState<GroupClass | null>(null);
    const [selectedCoachDetails, setSelectedCoachDetails] = useState<Coach | null>(null);
    
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: "Hi! I'm your GymCore AI. I can check class schedules, plans, and help you navigate the gym. What's on your mind?" }])
    const [currentInput, setCurrentInput] = useState("")
    const [isChatOpen, setIsChatOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [isQrModalOpen, setIsQrModalOpen] = useState(false)
    const [isQrFlipped, setIsQrFormFlipped] = useState(false)

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }
    useEffect(() => { if (isChatOpen) scrollToBottom() }, [chatMessages, isChatOpen])

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
        queryFn: async () => { const res = await api.get('/api/subscriptions/my-subscription'); return res.data }, retry: false
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

    const { data: myProfile } = useQuery({
        queryKey: ['my-profile'],
        queryFn: async () => { const res = await api.get('/api/users/me/profile'); return res.data }
    })

    const { data: notifications } = useQuery<NotificationItem[]>({
        queryKey: ['my-notifications'],
        queryFn: async () => { const res = await api.get('/api/notifications/my-notifications'); return res.data }
    })

    /* MUTATIONS */
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

    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => await api.patch(`/api/notifications/${id}/read`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-notifications'] })
    })

    const chatMutation = useMutation({
        mutationFn: async (messagesHistory: ChatMessage[]) => {
            const res = await api.post('/api/ai/chat', { messages: messagesHistory })
            return res.data
        },
        onSuccess: (data) => {
            setChatMessages(prev => [...prev, { role: 'assistant', content: data.Reply || data.reply }])
        },
        onError: () => {
            setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, my brain is a little disconnected right now. Try again in a minute!" }])
        }
    })

    const handleSendMessage = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!currentInput.trim()) return

        const newUserMessage: ChatMessage = { role: 'user', content: currentInput.trim() }
        const newHistory = [...chatMessages, newUserMessage]

        setChatMessages(newHistory)
        setCurrentInput("")

        chatMutation.mutate(newHistory)
    }

    if (user?.role === "Coach" || user?.role === "Admin") return <Navigate to="/dashboard" replace />

    const handleLogout = (e: React.MouseEvent) => { e.preventDefault(); logout() }

    const displayName = user?.firstName || "Stranger"

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

    const hasProOrVip = subscription?.tierName.toUpperCase() === "PRO" || subscription?.tierName.toUpperCase() === "VIP";

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
                    <Avatar className="h-16 w-16 border-2 border-orange-500 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                        {myProfile?.avatarUrl ? (
                            <AvatarImage src={myProfile.avatarUrl} className="object-cover" />
                        ) : (
                            <AvatarFallback className="bg-zinc-800 text-orange-500 font-bold text-2xl">
                                {displayName.charAt(0)}
                            </AvatarFallback>
                        )}
                    </Avatar>

                    <div className="flex flex-col items-center min-w-0 mt-1">
                        <h2 className="text-lg font-bold text-white leading-tight group-hover:text-orange-500 transition-colors">
                            <span className="block">{displayName}</span>
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

                {/* QR CODE */}
                <Button
                    onClick={() => setIsQrModalOpen(true)}
                    className="w-full mb-4 h-11 bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/80 hover:border-orange-500/30 text-zinc-300 hover:text-orange-500 transition-all duration-300 font-bold flex items-center justify-center shrink-0 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

                    <QrCode size={18} className="mr-2 group-hover:scale-110 transition-transform" />
                    Digital Access Pass
                </Button>
                
                {/* NOTIFICATIONS HUB */}
                <div className="flex-1 flex flex-col min-h-0 w-full mb-6 bg-zinc-900/20 border border-white/5 rounded-2xl p-4 overflow-hidden">
                    <div className="flex items-center justify-between mb-3 shrink-0">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Bell size={14} className={notifications?.some(n => !n.isRead) ? "text-orange-500" : "text-zinc-500"} />
                            Inbox
                        </h3>
                        {notifications?.some(n => !n.isRead) && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-orange-500/20 text-orange-500">NEW</span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative">
                        {notifications && notifications.length > 0 ? (
                            notifications.map(n => (
                                <div key={n.id} className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all relative group ${n.isRead ? 'bg-zinc-950/50 border-white/5' : 'bg-zinc-900/60 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)]'}`}>
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className={`text-xs font-bold ${n.isRead ? 'text-zinc-300' : 'text-orange-400'}`}>{n.title}</h4>
                                        {!n.isRead && (
                                            <button
                                                onClick={() => markAsReadMutation.mutate(n.id)}
                                                disabled={markAsReadMutation.isPending}
                                                className="text-zinc-500 hover:text-green-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Mark as read"
                                            >
                                                <CheckCircle2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <p className={`text-[11px] leading-relaxed ${n.isRead ? 'text-zinc-500' : 'text-zinc-300'}`}>{n.message}</p>
                                    <span className="text-[9px] font-bold text-zinc-600 mt-1">{formatDate(n.createdAt)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                <Bell size={24} className="text-zinc-600 mb-2" />
                                <p className="text-xs text-zinc-500 font-medium">You're all caught up!</p>
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#141417] to-transparent pointer-events-none" />
                    </div>
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
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Explore Facilities</h3>
                            <Link to="/rooms" className="text-sm font-semibold text-orange-500 hover:text-orange-400 transition-colors flex items-center">
                                Virtual Tour <ChevronRight size={16} className="ml-1" />
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
                                            <div
                                                key={room.id}
                                                onClick={() => setSelectedRoomDetails(room)}
                                                className="w-[240px] h-[140px] shrink-0 snap-start bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/60 hover:border-white/10 transition-all duration-300 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
                                            >

                                                {/* DYNAMIC BACKGROUND IMAGE */}
                                                {room.imageUrl ? (
                                                    <>
                                                        <img src={room.imageUrl} alt={room.name} className="absolute inset-0 w-full h-full object-cover grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-60 transition-all duration-700 mix-blend-luminosity group-hover:mix-blend-normal" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none" />
                                                    </>
                                                ) : (
                                                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500" />
                                                )}

                                                <div className="relative z-10">
                                                    <h4 className="text-white font-bold text-lg leading-tight mb-1">{room.name}</h4>
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

                                            return (
                                                <div 
                                                    key={cls.id} 
                                                    onClick={() => setSelectedClassDetails(cls)}
                                                    className={`w-[300px] shrink-0 snap-start bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/60 hover:border-white/10 transition-all duration-300 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group ${isFull ? "opacity-80" : ""} cursor-pointer`}
                                                >
                                                    {/* DYNAMIC BACKGROUND IMAGE FOR CLASSES */}
                                                    {cls.imageUrl && (
                                                        <>
                                                            <img src={cls.imageUrl} alt={cls.name} className="absolute inset-0 w-full h-full object-cover grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-40 transition-all duration-700 mix-blend-luminosity group-hover:mix-blend-normal" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent pointer-events-none" />
                                                        </>
                                                    )}

                                                    <div className="relative z-10 flex justify-between items-start mb-4">
                                                        <div>
                                                            <h4 className="text-white font-bold text-lg leading-tight">{cls.name}</h4>
                                                            <p className="text-orange-500 text-sm font-medium mt-0.5">{formatDate(cls.startTime)}</p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                            {isFull ? <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">Full</span>
                                                                : <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">{spotsLeft} left</span>}

                                                            {!hasProOrVip && (
                                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                                                                    PRO Required
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="relative z-10">
                                                        <Link to={`/classes?date=${cls.startTime.split('T')[0]}`}>
                                                            <Button
                                                                className="w-full font-bold h-10 border-none transition-all duration-300 shadow-md bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white"
                                                            >
                                                                View in Calendar
                                                            </Button>
                                                        </Link>
                                                    </div>
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
                            <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none z-10" />
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
                                            <div 
                                                key={coach.id} 
                                                onClick={() => setSelectedCoachDetails(coach)}
                                                className="w-[280px] shrink-0 snap-start bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/60 hover:border-white/10 transition-all duration-300 rounded-2xl p-5 flex flex-col justify-between cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="h-12 w-12 rounded-full border border-orange-500 shrink-0 overflow-hidden bg-zinc-800 flex items-center justify-center">
                                                        {coach.avatarUrl ? (
                                                            <img src={coach.avatarUrl} alt="Coach" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-orange-500 font-bold">{coach.firstName[0]}{coach.lastName[0]}</span>
                                                        )}
                                                    </div>
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
                                        const isWaitlisted = booking.status === "Waitlist"
                                        return (
                                            <div key={booking.reservationId} className="relative group/item animate-in fade-in slide-in-from-right-4 duration-300">
                                                {/* TIMELINE PIN POINT */}
                                                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-zinc-950 border-2 border-orange-500 group-hover/item:scale-125 group-hover/item:bg-orange-500 transition-all duration-300 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />

                                                {/* GLOSSY TIMELINE CARD */}
                                                <div className="bg-zinc-900/30 border border-white/5 hover:border-white/10 hover:bg-zinc-900/60 p-4 rounded-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${isWaitlisted ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : isGroup ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                                                {isWaitlisted ? 'WAITLIST (Pending)' : isGroup ? 'Group Class' : '1:1 Session'}
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

                {/* MODULE: GYM LOCATION & DIRECTIONS */}
                <div className="relative h-[160px] bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden mb-4 shrink-0 w-full group">
                    <iframe
                        title="GymCore Location"
                        src="https://maps.google.com/maps?q=Z%C5%82ote%20Tarasy,%20Warsaw&t=&z=14&ie=UTF8&iwloc=&output=embed"
                        className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity group-hover:opacity-100 group-hover:mix-blend-normal transition-all duration-700 pointer-events-none grayscale invert-[.9] contrast-[.8] group-hover:grayscale-0 group-hover:invert-0 group-hover:contrast-100"
                        loading="lazy"
                    />

                    {/* GRADIENT OVERLAY */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent pointer-events-none transition-opacity duration-700 group-hover:opacity-80" />

                    <div className="absolute inset-0 p-5 flex flex-col justify-end">
                        <div className="flex items-end justify-between gap-2">
                            <div className="relative z-10">
                                <h4 className="text-white font-bold text-xs flex items-center gap-1.5 drop-shadow-md whitespace-nowrap">
                                    <MapPin size={14} className="text-orange-500" />
                                    GymCore Fitness Club
                                </h4>
                                <p className="text-xs text-zinc-400 mt-0.5 ml-5 drop-shadow-md whitespace-nowrap">Złota 59, 00-120 Warsaw</p>
                            </div>

                            {/* DEEP LINKING DIRECTLY TO GOOGLE MAPS NAVIGATION ROUTING */}
                            <a
                                href="https://www.google.com/maps/dir/?api=1&destination=Złote+Tarasy,+Warsaw"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 relative z-10"
                            >
                                <Button size="sm" className="bg-white text-black hover:bg-gradient-to-r hover:from-orange-600 hover:via-amber-400 hover:to-orange-600 hover:bg-[length:200%_auto] hover:text-white font-bold h-8 text-xs rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all duration-500 border-none">
                                    <Navigation size={12} className="mr-1.5" />
                                    Directions
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>

                {/* AI ASSISTANT WIDGET */}
                <div className={`bg-zinc-900/40 border border-white/5 rounded-2xl flex flex-col shrink-0 w-full transition-all duration-500 overflow-hidden relative group ${isChatOpen ? "h-[400px] shadow-[0_0_30px_rgba(249,115,22,0.15)] border-orange-500/30" : "h-[70px] hover:bg-zinc-900/60 cursor-pointer"}`}>
                    {/* COLLAPSED HEADER / TOGGLE */}
                    <div
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className="h-[70px] w-full p-4 flex items-center justify-between shrink-0 z-10 relative cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-orange-500 rounded-full blur group-hover:blur-md transition-all opacity-50 animate-pulse" />
                                <div className="w-10 h-10 bg-zinc-950 rounded-full border border-orange-500/50 flex items-center justify-center relative z-10 text-orange-500">
                                    <Sparkles size={18} />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-sm tracking-tight flex items-center gap-1.5">GymCore AI <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-orange-500/20 text-orange-500 uppercase tracking-wider">Beta</span></h4>
                                <p className="text-[10px] text-zinc-400 font-medium">Ask me anything about schedules or plans.</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className={`text-zinc-500 transition-transform duration-300 ${isChatOpen ? "rotate-90" : ""}`} />
                    </div>

                    {/* EXPANDED CHAT AREA */}
                    <div className={`flex-1 flex flex-col min-h-0 bg-zinc-950/50 border-t border-white/5 transition-opacity duration-300 ${isChatOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                        {/* MESSAGES LIST */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {chatMessages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'user' ? "bg-zinc-800 border border-white/10" : "bg-orange-500/20 border border-orange-500/30 text-orange-500"}`}>
                                        {msg.role === 'user' ? <UserCircle size={12} /> : <Bot size={12} />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-xs leading-relaxed overflow-hidden ${msg.role === 'user' ? "bg-zinc-800 text-zinc-200 rounded-tr-sm" : "bg-orange-500/10 border border-orange-500/20 text-orange-100 rounded-tl-sm shadow-[0_0_15px_rgba(249,115,22,0.05)]"}`}>
                                        {msg.role === 'user' ? (
                                            msg.content
                                        ) : (
                                            <div className="[&>p]:mb-2 [&>p:last-child]:mb-0 [&_a]:text-amber-400 [&_a]:underline hover:[&_a]:text-amber-300 [&_strong]:text-white [&_strong]:font-black [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_li]:mb-1">
                                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* TYPING INDICATOR */}
                            {chatMutation.isPending && (
                                <div className="flex gap-3 max-w-[85%] mr-auto">
                                    <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                                        <Loader2 size={12} className="animate-spin" />
                                    </div>
                                    <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 rounded-tl-sm flex gap-1 items-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* INPUT AREA */}
                        <form onSubmit={handleSendMessage} className="p-3 bg-zinc-950 border-t border-white/5 flex gap-2 shrink-0">
                            <input
                                type="text"
                                value={currentInput}
                                onChange={e => setCurrentInput(e.target.value)}
                                placeholder="Type a message..."
                                disabled={chatMutation.isPending}
                                className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!currentInput.trim() || chatMutation.isPending}
                                className="h-9 w-9 shrink-0 bg-orange-600 hover:bg-orange-500 text-white rounded-xl border-none disabled:opacity-50"
                            >
                                <Send size={14} />
                            </Button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* ROOM DETAILS MODAL */}
            <Dialog open={!!selectedRoomDetails} onOpenChange={() => setSelectedRoomDetails(null)}>
                <DialogContent className="sm:max-w-[450px] p-0 bg-zinc-950 border border-white/10 overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="w-full h-[250px] relative">
                        {selectedRoomDetails?.imageUrl ? (
                            <img src={selectedRoomDetails.imageUrl} alt={selectedRoomDetails.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                <span className="text-zinc-600">No Image</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
                    </div>
                    <div className="px-6 pb-6 pt-2">
                        <h2 className="text-2xl font-black text-white mb-2">{selectedRoomDetails?.name}</h2>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="flex items-center text-zinc-400 text-xs font-medium bg-zinc-900 px-2 py-1 rounded-md border border-white/5"><Users size={14} className="mr-1.5 text-orange-500"/> Capacity: {selectedRoomDetails?.maxCapacity}</span>
                            <span className="flex items-center text-zinc-400 text-xs font-medium bg-zinc-900 px-2 py-1 rounded-md border border-white/5"><Award size={14} className="mr-1.5 text-amber-500"/> {selectedRoomDetails?.requiredTierName || "All Access"}</span>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            {selectedRoomDetails?.description || "Experience top-tier fitness in our expertly designed facility, crafted to help you push your limits and achieve your goals."}
                        </p>
                        <Button className="w-full mt-6 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/5" onClick={() => setSelectedRoomDetails(null)}>Close View</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* CLASS DETAILS MODAL */}
            <Dialog open={!!selectedClassDetails} onOpenChange={() => setSelectedClassDetails(null)}>
                <DialogContent className="sm:max-w-[450px] p-0 bg-zinc-950 border border-white/10 overflow-hidden">
                    <div className="w-full h-[250px] relative">
                        {selectedClassDetails?.imageUrl ? (
                            <img src={selectedClassDetails.imageUrl} alt={selectedClassDetails.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                <span className="text-zinc-600">No Image</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
                        <div className="absolute bottom-4 left-6">
                            <h2 className="text-2xl font-black text-white">{selectedClassDetails?.name}</h2>
                            <p className="text-orange-500 font-bold">{selectedClassDetails && formatDate(selectedClassDetails.startTime)} • {selectedClassDetails && formatTime(selectedClassDetails.startTime)}</p>
                        </div>
                    </div>
                    <div className="px-6 pb-6 pt-2">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase">Coach</span>
                                <p className="text-white font-bold text-sm">{selectedClassDetails?.coachName}</p>
                            </div>
                            <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase">Availability</span>
                                <p className="text-white font-bold text-sm">{selectedClassDetails && selectedClassDetails.maxAttendees - selectedClassDetails.currentBookings} spots left</p>
                            </div>
                        </div>
                        <Link to={`/classes?date=${selectedClassDetails?.startTime.split('T')[0]}`} onClick={() => setSelectedClassDetails(null)}>
                            <Button className="w-full font-bold h-10 border-none transition-all duration-300 shadow-md bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white">View in Calendar</Button>
                        </Link>
                    </div>
                </DialogContent>
            </Dialog>

            {/* COACH DETAILS MODAL */}
            <Dialog open={!!selectedCoachDetails} onOpenChange={() => setSelectedCoachDetails(null)}>
                <DialogContent className="sm:max-w-[450px] p-6 bg-zinc-950 border border-white/10 overflow-hidden">
                    <div className="flex flex-col items-center text-center">
                        <div className="h-24 w-24 rounded-full border-2 border-orange-500 overflow-hidden bg-zinc-800 mb-4 flex items-center justify-center">
                            {selectedCoachDetails?.avatarUrl ? (
                                <img src={selectedCoachDetails.avatarUrl} alt="Coach" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-orange-500 text-3xl font-bold">{selectedCoachDetails?.firstName[0]}{selectedCoachDetails?.lastName[0]}</span>
                            )}
                        </div>
                        <h2 className="text-2xl font-black text-white mb-1">{selectedCoachDetails?.firstName} {selectedCoachDetails?.lastName}</h2>
                        <p className="text-orange-500 font-medium mb-6">Expert Trainer</p>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-6">{selectedCoachDetails?.bio || "Highly experienced fitness professional dedicated to helping you achieve your full potential."}</p>
                        <Link to={`/personal-training?coachId=${selectedCoachDetails?.id}`} onClick={() => setSelectedCoachDetails(null)} className="w-full">
                            <Button className="w-full font-bold h-10 border-none transition-all duration-300 shadow-md bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white">View Schedule</Button>
                        </Link>
                    </div>
                </DialogContent>
            </Dialog>

            {/* DIGITAL ACCESS PASS MODAL (DOUBLE EASTER EGG) */}
            <Dialog open={isQrModalOpen} onOpenChange={(open) => {
                setIsQrModalOpen(open);
                if (!open) setIsQrFormFlipped(false);
            }}>
                <DialogContent className="sm:max-w-[350px] p-6 bg-zinc-950 border border-white/10 overflow-hidden flex flex-col items-center text-center">
                    <div className="absolute top-[-20%] left-[-20%] w-[250px] h-[250px] bg-orange-600/20 rounded-full blur-[80px] pointer-events-none" />

                    <div className="p-3 bg-orange-500/10 rounded-full mb-4 border border-orange-500/20">
                        <QrCode size={24} className="text-orange-500" />
                    </div>

                    <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                        {isQrFlipped ? "Portfolio Pass" : "Entry Pass"}
                    </h2>
                    <p className="text-xs text-zinc-400 font-medium mb-8">
                        {isQrFlipped ? "Scan to view developer's full portfolio." : "Scan this code at the reception turnstile."}
                    </p>

                    {/* PERSPECTIVE WRAPPER */}
                    <div
                        className="w-[212px] h-[212px] mb-6 [perspective:1000px] cursor-pointer"
                        onClick={() => setIsQrFormFlipped(!isQrFlipped)}
                    >
                        {/* CARD FLIP CONTAINER */}
                        <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isQrFlipped ? "[transform:rotateY(180deg)]" : ""}`}>
                            {/* A SITE: LINKEDIN QR */}
                            <div className="absolute inset-0 bg-white p-4 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.15)] [backface-visibility:hidden] overflow-hidden group">
                                <QRCode
                                    value="https://www.linkedin.com/in/kacper-gumulak-dev/"
                                    size={180}
                                    bgColor="#ffffff"
                                    fgColor="#09090b"
                                    level="Q"
                                />
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)] opacity-50 group-hover:opacity-100 animate-[scan_2s_ease-in-out_infinite]" style={{ animationName: 'scan' }} />
                            </div>

                            {/* B SITE: PORTFOLIO QR */}
                            <div className="absolute inset-0 bg-white p-4 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.15)] [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden group">
                                <QRCode
                                    value="https://kacpergumulak.pl"
                                    size={180}
                                    bgColor="#ffffff"
                                    fgColor="#09090b"
                                    level="Q"
                                />
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,1)] opacity-50 group-hover:opacity-100 animate-[scan_2s_ease-in-out_infinite]" style={{ animationName: 'scan' }} />
                            </div>
                        </div>
                    </div>

                    {/* DYNAMIC DESCRIPTION BELOW */}
                    <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-lg p-3 w-full group transition-colors hover:border-orange-500/30">
                        <p className="text-[10px] text-zinc-500 font-medium select-text">
                            <span className="text-orange-500 font-bold block mb-1">
                                {isQrFlipped ? "Tip: Click the code again to flip back!" : "Psst... Easter Egg!"}
                            </span>
                            {isQrFlipped ? (
                                <>You are looking at the <strong>Portfolio Pass</strong>! Scan this with your phone to discover other applications built by me ;)</>
                            ) : (
                                <>Take your phone out and scan this code to <strong>connect with the me on LinkedIn</strong>! Or click it to flip the card.</>
                            )}
                        </p>
                    </div>
                    
                    <style>{`
                        @keyframes scan {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(212px); }
                        }
                    `}</style>
                </DialogContent>
            </Dialog>
        </div>
    )
}