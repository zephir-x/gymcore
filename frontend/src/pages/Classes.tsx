import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { ArrowLeft, Clock, Users, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

/* INTERFACES */
interface GroupClass { id: string; name: string; coachName: string; startTime: string; endTime: string; maxAttendees: number; currentBookings: number; imageUrl?: string | null; }
interface Reservation { reservationId: string; targetId: string; type: string }
interface Subscription { subscriptionId: string; tierName: string; }

/* COMPONENT */
export default function Classes() {
    const queryClient = useQueryClient()
    const [searchParams] = useSearchParams();
    const dateParam = searchParams.get('date');
    const [selectedDate, setSelectedDate] = useState<Date>(dateParam ? new Date(dateParam) : new Date())

    useEffect(() => {
        if (dateParam) {
            setSelectedDate(new Date(dateParam));
        }
    }, [dateParam]);

    /* QUERIES */
    const { data: classes, isLoading } = useQuery<GroupClass[]>({
        queryKey: ['classes'],
        queryFn: async () => { const res = await api.get('/api/bookings/classes'); return res.data }
    })

    const { data: reservations } = useQuery<Reservation[]>({
        queryKey: ['my-reservations'],
        queryFn: async () => { const res = await api.get('/api/bookings/my-reservations'); return res.data }
    })

    const { data: subscription } = useQuery<Subscription | null>({
        queryKey: ['my-subscription'],
        queryFn: async () => {
            try { return (await api.get('/api/subscriptions/my-subscription')).data }
            catch { return null }
        },
        retry: false
    })

    const hasProOrVip = subscription?.tierName.toUpperCase() === "PRO" || subscription?.tierName.toUpperCase() === "VIP";

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
            console.error("Booking Error:", error)
            toast.error("Booking Failed", { description: "Could not book this class. Requires PRO or VIP plan." })
        }
    })

    /* HELPERS */
    const daysOfWeek = Array.from({ length: 14 }).map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d })

    const filteredClasses = classes?.filter((cls) => {
        return new Date(cls.startTime).toDateString() === selectedDate.toDateString()
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const formatDayName = (date: Date) => date.toLocaleDateString([], { weekday: 'short' })
    const formatDayNumber = (date: Date) => date.getDate()

    /* RENDER */
    return (
        <div className="h-screen w-full bg-zinc-950 text-zinc-100 font-sans p-4 md:p-12 overflow-y-auto overflow-x-hidden select-none relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-4xl mx-auto relative z-10 space-y-8 animate-in fade-in duration-500 pb-12">
                <div className="flex items-center justify-between border-b border-white/5 pb-6 pt-4 md:pt-0">
                    <div className="flex items-center gap-4">
                        <Link to="/">
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl border border-white/5 shrink-0">
                                <ArrowLeft size={20} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Class Schedule</h1>
                            <p className="text-xs md:text-sm text-zinc-400 font-medium mt-0.5">Plan your next 14 days</p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900/30 border border-white/5 p-3 pb-4 rounded-2xl flex justify-start gap-2 overflow-x-auto shrink-0 snap-x snap-mandatory [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700">
                    {daysOfWeek.map((day, idx) => {
                        const isSelected = day.toDateString() === selectedDate.toDateString()
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedDate(day)}
                                className={`flex flex-col items-center justify-center w-16 h-20 rounded-xl transition-all duration-300 shrink-0 snap-start ${
                                    isSelected
                                        ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20 font-bold scale-105"
                                        : "bg-zinc-950/40 border border-white/5 text-zinc-400 hover:text-white hover:border-white/10"
                                }`}
                            >
                                <span className="text-[10px] md:text-xs uppercase tracking-wider font-semibold opacity-70 mb-1">{formatDayName(day)}</span>
                                <span className="text-lg md:text-xl font-black">{formatDayNumber(day)}</span>
                            </button>
                        )
                    })}
                </div>

                <div key={selectedDate.toISOString()} className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-forwards">
                    {isLoading ? (
                        [1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4 md:gap-6 items-center animate-pulse">
                                <div className="w-12 md:w-16 h-6 bg-zinc-900 rounded-lg shrink-0" />
                                <div className="flex-1 h-24 bg-zinc-900 rounded-2xl" />
                            </div>
                        ))
                    ) : filteredClasses && filteredClasses.length > 0 ? (
                        filteredClasses.map((cls) => {
                            const isFull = cls.currentBookings >= cls.maxAttendees
                            const spotsLeft = cls.maxAttendees - cls.currentBookings
                            const isBooked = reservations?.some(r => r.targetId === cls.id && r.type === "Group")

                            return (
                                <div key={cls.id} className="flex gap-4 md:gap-6 items-start md:items-center group">
                                    <div className="w-12 md:w-16 pt-3 md:pt-0 shrink-0 flex flex-col text-center md:text-left">
                                        <span className="text-base md:text-lg font-black text-white group-hover:text-orange-500 transition-colors">{formatTime(cls.startTime)}</span>
                                        <span className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Start</span>
                                    </div>

                                    <div className={`flex-1 min-w-0 bg-zinc-900/40 border border-white/5 hover:border-white/10 hover:bg-zinc-900/60 rounded-2xl p-4 md:p-5 flex flex-col xl:flex-row justify-between xl:items-center gap-4 transition-all duration-300 relative overflow-hidden ${isFull && !isBooked ? "opacity-60" : ""}`}>
                                        {cls.imageUrl && (
                                            <>
                                                <img
                                                    src={cls.imageUrl}
                                                    alt="Background"
                                                    className="absolute inset-0 w-full h-full object-cover grayscale opacity-10 group-hover:grayscale-0 group-hover:opacity-40 transition-all duration-700 mix-blend-luminosity group-hover:mix-blend-normal pointer-events-none"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent pointer-events-none" />
                                            </>
                                        )}
                                        <div className="space-y-2 min-w-0 relative z-10">
                                            <h3 className="text-lg md:text-xl font-bold text-white truncate">{cls.name}</h3>
                                            <p className="text-zinc-400 text-sm font-medium">with {cls.coachName}</p>
                                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs font-semibold text-zinc-400">
                                                <div className="flex items-center bg-zinc-950 px-2 py-1.5 rounded-lg border border-white/5 shrink-0">
                                                    <Clock size={12} className="mr-1.5 text-orange-500" />
                                                    <span>{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                                                </div>
                                                <div className="flex items-center bg-zinc-950 px-2 py-1.5 rounded-lg border border-white/5 shrink-0">
                                                    <Users size={12} className="mr-1.5 text-orange-500" />
                                                    {isFull ? <span className="text-red-400 font-bold">Full ({cls.maxAttendees}/{cls.maxAttendees})</span> : <span>{spotsLeft} Spots Left</span>}
                                                </div>

                                                {!hasProOrVip && (
                                                    <div className="flex items-center bg-orange-500/10 px-2 py-1.5 rounded-lg border border-orange-500/20 text-orange-400 shrink-0 font-bold shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                                                        PRO Required
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="w-full xl:w-auto shrink-0 mt-2 xl:mt-0 relative z-10">
                                            <Button
                                                onClick={() => bookMutation.mutate(cls.id)}
                                                disabled={!subscription || !hasProOrVip || isFull || isBooked || bookMutation.isPending}
                                                className={`w-full xl:w-[140px] h-10 md:h-11 font-bold border-none transition-all duration-300 shadow-md ${
                                                    !subscription ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" :
                                                        !hasProOrVip ? "bg-zinc-800 text-orange-400 border border-orange-500/20 cursor-not-allowed" :
                                                            isBooked ? "bg-zinc-800 text-green-400 border border-green-500/20 cursor-not-allowed flex items-center justify-center gap-2" :
                                                                isFull ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" :
                                                                    "bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                                                }`}
                                            >
                                                {bookMutation.isPending ? "Processing..." :
                                                    !subscription ? "Requires Plan" :
                                                        !hasProOrVip ? "Upgrade to PRO" :
                                                            isBooked ? <><CheckCircle2 size={16} /> Booked</> :
                                                                isFull ? "Full" : "Book Class"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-12 md:py-16 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-2xl p-6 max-w-md mx-auto">
                            <div className="p-3 bg-zinc-900/50 rounded-full w-fit mx-auto mb-4 border border-white/5">
                                <CalendarIcon size={24} className="text-zinc-600" />
                            </div>
                            <h3 className="text-base md:text-lg font-bold text-zinc-300">No classes today</h3>
                            <p className="text-xs md:text-sm text-zinc-500 mt-1">There are no group sessions scheduled for this date. Try checking another day!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}