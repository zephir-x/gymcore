import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useSearchParams } from "react-router-dom"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { ArrowLeft, Clock, Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

/* INTERFACES */
interface Coach { id: string; firstName: string; lastName: string; avatarUrl?: string | null }
interface TrainerSlot { id: string; startTime: string; endTime: string }
interface Subscription { subscriptionId: string; tierName: string; }

/* COMPONENT */
export default function PersonalTraining() {
    const queryClient = useQueryClient()

    /* STATE & HOOKS */
    const [searchParams] = useSearchParams()
    const urlCoachId = searchParams.get("coachId")
    const [selectedCoachId, setSelectedCoachId] = useState<string | null>(urlCoachId)

    useEffect(() => { if (urlCoachId) setSelectedCoachId(urlCoachId) }, [urlCoachId])

    /* QUERIES  */
    const { data: coaches, isLoading: isLoadingCoaches } = useQuery<Coach[]>({
        queryKey: ['coaches'],
        queryFn: async () => { const res = await api.get('/api/bookings/coaches'); return res.data }
    })

    const { data: slots, isLoading: isLoadingSlots } = useQuery<TrainerSlot[]>({
        queryKey: ['coach-slots', selectedCoachId],
        queryFn: async () => { const res = await api.get(`/api/bookings/coaches/${selectedCoachId}/slots`); return res.data },
        enabled: !!selectedCoachId
    })

    const { data: subscription } = useQuery<Subscription | null>({
        queryKey: ['my-subscription'],
        queryFn: async () => {
            try { return (await api.get('/api/subscriptions/my-subscription')).data }
            catch { return null }
        },
        retry: false
    })

    const discountBadge = subscription?.tierName === "VIP" ? "-25%" :
        (subscription?.tierName === "Pro" || subscription?.tierName === "PRO") ? "-10%" : null;

    /* MUTATIONS */
    const bookSlotMutation = useMutation({
        mutationFn: async (slotId: string) => { const res = await api.post(`/api/bookings/trainer-slots/${slotId}`); return res.data },
        onSuccess: async (data) => {
            toast.success("Training Booked!", { description: data.Message || "You have successfully booked a 1:1 session." })
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['coach-slots', selectedCoachId] }),
                queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
            ])
        },
        onError: (error: any) => {
            console.error("Booking Error:", error)
            toast.error("Booking Failed", { description: "Could not book this slot. Make sure you have an active subscription." })
        }
    })

    /* HELPERS */
    const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })

    const groupedSlots = slots?.reduce((acc, slot) => {
        const dateKey = formatDate(slot.startTime)
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(slot)
        return acc
    }, {} as Record<string, TrainerSlot[]>)

    /* RENDER */
    return (
        <div className="h-screen w-full bg-zinc-950 text-zinc-100 font-sans p-4 md:p-12 overflow-y-auto overflow-x-hidden select-none relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* AMBIENT GLOW EFFECTS */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10 space-y-10 animate-in fade-in duration-500 pb-12">
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-white/5 pb-6 pt-4 md:pt-0">
                    <div className="flex items-center gap-4">
                        <Link to="/">
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl border border-white/5 shrink-0">
                                <ArrowLeft size={20} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Personal Training</h1>
                            <p className="text-xs md:text-sm text-zinc-400 font-medium mt-0.5">Select a coach and book your 1:1 session</p>
                        </div>
                    </div>
                </div>

                {/* COACH SELECTION */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-white mb-4">1. Choose your Trainer</h2>
                    {isLoadingCoaches ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-2xl" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[340px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700">
                            {coaches?.map(coach => {
                                const isSelected = selectedCoachId === coach.id
                                return (
                                    <button
                                        key={coach.id}
                                        onClick={() => setSelectedCoachId(coach.id)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left ${
                                            isSelected
                                                ? "bg-gradient-to-br from-orange-500/20 to-amber-500/10 border-2 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)]"
                                                : "bg-zinc-900/40 border-2 border-transparent hover:border-white/10 hover:bg-zinc-900/60"
                                        }`}
                                    >
                                        <Avatar className={`h-12 w-12 border ${isSelected ? 'border-orange-500' : 'border-zinc-700'}`}>
                                            {coach.avatarUrl ? (
                                                <AvatarImage src={coach.avatarUrl} className="object-cover" />
                                            ) : (
                                                <AvatarFallback className={`font-bold ${isSelected ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                                    {coach.firstName[0]}{coach.lastName[0]}
                                                </AvatarFallback>
                                            )}
                                        </Avatar>
                                        <div className="min-w-0 text-left">
                                            <h4 className={`font-bold leading-tight ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                                <span className="block">{coach.firstName}</span>
                                                <span className="block">{coach.lastName}</span>
                                            </h4>
                                            <p className={`text-xs mt-1 ${isSelected ? 'text-orange-400' : 'text-zinc-500'}`}>Expert Coach</p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* AVAILABLE SLOTS TIMELINE */}
                {selectedCoachId && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500 fill-mode-forwards pt-6 border-t border-white/5">
                        <h2 className="text-lg font-bold text-white mb-4">2. Select a Time Slot</h2>

                        {isLoadingSlots ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-pulse">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-zinc-900 rounded-xl" />)}
                            </div>
                        ) : slots && slots.length > 0 ? (
                            <div className="space-y-8">
                                {groupedSlots && Object.entries(groupedSlots).map(([dateLabel, dailySlots]) => (
                                    <div key={dateLabel} className="space-y-3 relative">
                                        <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10 py-3 border-b border-white/5 -mx-4 px-4 sm:mx-0 sm:px-0 mb-4">
                                            <div className="flex items-center gap-2 text-orange-500 font-bold text-sm uppercase tracking-wider">
                                                <CalendarIcon size={16} />
                                                {dateLabel}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:pr-4">
                                            {dailySlots.map(slot => (
                                                <div key={slot.id} className="relative overflow-hidden flex justify-between items-center p-4 rounded-xl bg-zinc-900/40 border border-white/5 hover:bg-zinc-900/80 transition-colors group">
                                                    <div className="flex items-center gap-3 relative z-10">
                                                        <div className="p-2 bg-zinc-950 rounded-lg border border-white/5 group-hover:border-orange-500/30 transition-colors shrink-0">
                                                            <Clock size={16} className="text-zinc-400 group-hover:text-orange-500 transition-colors" />
                                                        </div>
                                                        <span className="font-bold text-white whitespace-nowrap">
                                                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                                        </span>

                                                        {discountBadge && (
                                                            <span className="ml-1 px-2 py-0.5 rounded text-[10px] font-black bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                                                                {discountBadge} OFF
                                                            </span>
                                                        )}
                                                    </div>

                                                    <Button
                                                        onClick={() => bookSlotMutation.mutate(slot.id)}
                                                        disabled={!subscription || bookSlotMutation.isPending}
                                                        className={`font-bold h-9 relative z-10 transition-colors shrink-0 ml-2 ${
                                                            !subscription
                                                                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                                                : "bg-zinc-800 text-zinc-300 hover:bg-orange-500 hover:text-white"
                                                        }`}
                                                    >
                                                        {bookSlotMutation.isPending ? "..." : !subscription ? "Requires Plan" : "Book"}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
                                <p className="text-zinc-400 font-medium">This coach currently has no available slots.</p>
                                <p className="text-sm text-zinc-600 mt-1">Please choose another coach or check back later.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}