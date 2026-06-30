import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { ArrowLeft, Sparkles, Zap, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {useDocumentTitle} from "@/hooks/useDocumentTitle.ts";

/* INTERFACES */
interface SubscriptionTier {
    id: string
    name: string
    monthlyPrice: number
}

/* COMPONENT */
export default function Subscriptions() {
    useDocumentTitle('Subscriptions');

    /* STATE */
    const [months, setMonths] = useState<number>(1)

    /* QUERIES */
    const { data: tiers, isLoading } = useQuery<SubscriptionTier[]>({
        queryKey: ['subscription-tiers'],
        queryFn: async () => (await api.get('/api/subscriptions/tiers')).data
    })

    const { data: mySubscription } = useQuery<any>({
        queryKey: ['my-subscription'],
        queryFn: async () => {
            try {
                return (await api.get('/api/subscriptions/my-subscription')).data
            } catch (error: any) {
                if (error.response?.status === 404) return null
                throw error
            }
        },
        retry: false
    })

    /* MUTATIONS */
    const purchaseMutation = useMutation({
        mutationFn: async (tierId: string) => {
            const response = await api.post(`/api/subscriptions/purchase/${tierId}`, { months })
            return response.data
        },
        onSuccess: (data) => {
            const redirectUrl = data.checkoutUrl || data.CheckoutUrl;

            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                toast.error("Critical Error", { description: "The server did not return a payment link." });
            }
        },
        onError: (error: any) => {
            console.error("Purchase Error:", error.response?.data || error.message)
            toast.error("Purchase Failed", { description: error.response?.data?.Message || "There was a problem connecting to Stripe." })
        }
    })

    const getPriceNumeric = (monthlyPrice: number, duration: number): number => {
        if (duration === 1) return monthlyPrice
        if (duration === 6) return monthlyPrice * 6 * 0.90
        if (duration === 12) return monthlyPrice * 12 * 0.81
        return monthlyPrice * duration
    }

    /* HELPERS */
    const calculatePrice = (monthlyPrice: number): string => {
        return getPriceNumeric(monthlyPrice, months).toFixed(2)
    }

    const currentTier = tiers?.find(t => t.name === mySubscription?.tierName)
    const currentBasePrice = currentTier ? currentTier.monthlyPrice : 0

    let currentMonths = 0
    if (mySubscription) {
        const start = new Date(mySubscription.startDate)
        const end = new Date(mySubscription.endDate)
        currentMonths = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
    }

    const currentTotalPaid = mySubscription ? getPriceNumeric(currentBasePrice, currentMonths) : 0

    /* RENDER */
    return (
        <div className="h-screen w-full bg-zinc-950 text-zinc-100 font-sans p-4 md:p-12 overflow-y-auto overflow-x-hidden select-none relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10 space-y-10 animate-in fade-in duration-500 pb-12">
                <div className="flex items-center justify-between border-b border-white/5 pb-6 pt-4 md:pt-0">
                    <div className="flex items-center gap-4">
                        <Link to="/">
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl border border-white/5 shrink-0">
                                <ArrowLeft size={20} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Gym Plans</h1>
                            <p className="text-xs md:text-sm text-zinc-400 font-medium mt-0.5">Upgrade your plan to unlock premium features and rooms</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center mb-12">
                    <div className="bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 inline-flex backdrop-blur-md relative z-20 shadow-lg w-full max-w-[360px] md:max-w-[420px]">
                        <div className="relative flex w-full">
                            {/* FLOATING BACKGROUND PILL*/}
                            <div className={`absolute top-0 bottom-0 left-0 w-1/3 bg-zinc-800 rounded-xl shadow-md border border-white/10 transition-transform duration-500 ease-out pointer-events-none
                                ${months === 1 ? 'translate-x-0' : ''}
                                ${months === 6 ? 'translate-x-full' : ''}
                                ${months === 12 ? 'translate-x-[200%]' : ''}
                            `} />

                            <button onClick={() => setMonths(1)} className={`relative z-10 flex-1 py-2.5 text-sm font-bold transition-colors duration-300 ${months === 1 ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                1 Month
                            </button>
                            <button onClick={() => setMonths(6)} className={`relative z-10 flex-1 py-2.5 text-sm font-bold transition-colors duration-300 ${months === 6 ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                6 Months
                            </button>
                            <button onClick={() => setMonths(12)} className={`relative z-10 flex-1 py-2.5 text-sm font-bold transition-colors duration-300 ${months === 12 ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                12 Months
                            </button>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 animate-pulse">
                        {[1, 2, 3].map((i) => <div key={i} className="h-[450px] bg-zinc-900 rounded-3xl" />)}
                    </div>
                ) : tiers && tiers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
                        {tiers.map((tier) => {
                            const newTotalPaid = getPriceNumeric(tier.monthlyPrice, months)
                            const isUpgrade = mySubscription && (newTotalPaid > currentTotalPaid)
                            const isSelect = !mySubscription
                            const isLowerOrActual = mySubscription && !isUpgrade

                            const isPremium = tier.name.toUpperCase() === "VIP"

                            return (
                                <div
                                    key={tier.id}
                                    className={`relative bg-zinc-900/40 border transition-all duration-500 rounded-3xl p-8 flex flex-col overflow-hidden group 
                                        ${isLowerOrActual ? 'opacity-50 border-white/5 grayscale' : isPremium ? 'border-orange-500/50 hover:border-orange-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(249,115,22,0.1)]' : 'border-white/5 hover:border-white/20 hover:-translate-y-2'}`}
                                >
                                    {isPremium && !isLowerOrActual && (
                                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 blur-[50px] rounded-full group-hover:bg-orange-500/30 transition-all duration-500" />
                                    )}

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="mb-8">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-2xl font-black text-white">{tier.name}</h3>
                                                {!isLowerOrActual && (
                                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1 ${isPremium ? 'bg-orange-500/10 border border-orange-500/20 text-orange-500' : 'bg-zinc-800/50 border border-zinc-700 text-zinc-400'}`}>
                                                        {isPremium && <Sparkles size={12} />} {tier.name}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-zinc-400 font-medium">
                                                {tier.name.toUpperCase() === "BASIC" && "Standard access to Main Gym, Functional Zone, and Yoga Studio."}
                                                {tier.name.toUpperCase() === "PRO" && "Includes Basic access + Cardio Zone, Crossfit Box and Group Classes."}
                                                {tier.name.toUpperCase() === "VIP" && "Includes Pro access + SPA & Sauna, Massage Room, and 1:1 Personal Training."}
                                            </p>
                                        </div>

                                        <div className="mb-8 flex-grow">
                                            <div className="flex items-end gap-2">
                                                <span className="text-5xl font-black text-white">{calculatePrice(tier.monthlyPrice)}</span>
                                                <span className="text-xl font-bold text-zinc-500 mb-1">PLN</span>
                                            </div>
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mt-2 block">
                                                {months === 1 ? "Billed Monthly" : `Billed every ${months} months`}
                                            </span>
                                        </div>

                                        <div className="space-y-3 mb-8">
                                            <div className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                                                <CheckCircle2 size={16} className={isPremium ? "text-orange-500" : "text-green-500"} /> Basic Rooms Access
                                            </div>

                                            <div className="flex items-center gap-3 text-sm font-medium">
                                                {tier.name.toUpperCase() === "PRO" || tier.name.toUpperCase() === "VIP" ? (
                                                    <><CheckCircle2 size={16} className={isPremium ? "text-orange-500" : "text-green-500"} /> <span className="text-zinc-300">Group Classes Booking</span></>
                                                ) : (
                                                    <><XCircle size={16} className="text-zinc-700" /> <span className="text-zinc-600 line-through">Group Classes Booking</span></>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 text-sm font-medium">
                                                {tier.name.toUpperCase() === "VIP" ? (
                                                    <><CheckCircle2 size={16} className="text-orange-500" /> <span className="text-zinc-300">1:1 Personal Training</span></>
                                                ) : (
                                                    <><XCircle size={16} className="text-zinc-700" /> <span className="text-zinc-600 line-through">1:1 Personal Training</span></>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => purchaseMutation.mutate(tier.id)}
                                            disabled={isLowerOrActual || purchaseMutation.isPending}
                                            className={`w-full h-12 font-bold text-base transition-all duration-500 ${
                                                isLowerOrActual ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" :
                                                    isPremium ? "border-none text-white shadow-[0_0_20px_rgba(249,115,22,0.2)] bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 bg-[length:200%_auto] hover:bg-[position:right_center]" :
                                                        "bg-zinc-100 text-zinc-900 hover:bg-white"
                                            }`}
                                        >
                                            {purchaseMutation.isPending ? "Processing..." :
                                                isSelect ? "Select Plan" :
                                                isUpgrade ? <><Zap size={16} className="mr-2" /> Upgrade Now</> : "Lower or Actual Plan"}
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-3xl max-w-2xl mx-auto">
                        <p className="text-zinc-500 font-medium">No subscription plans are currently available.</p>
                    </div>
                )}
            </div>
        </div>
    )
}