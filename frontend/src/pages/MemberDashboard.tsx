import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { ArrowLeft, LogOut, Settings, Award, ShieldAlert, Zap, UserCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// INTERFACES
interface Subscription {
    id: string
    tierName: string
    endDate: string
}

export default function MemberDashboard() {
    const { user, logout } = useAuth()
    const queryClient = useQueryClient()
    const [isManaging, setIsManaging] = useState(false)

    const { data: subscription, isLoading: isSubLoading } = useQuery<Subscription | null>({
        queryKey: ['my-subscription'],
        queryFn: async () => {
            try {
                const response = await api.get('/api/subscriptions/my-subscription')
                return response.data
            } catch (error: any) {
                if (error.response?.status === 404) return null
                throw error
            }
        },
        retry: false
    })

    const cancelSubscriptionMutation = useMutation({
        mutationFn: async () => {
            return (await api.post('/api/subscriptions/cancel')).data
        },
        onSuccess: async () => {
            toast.success("Subscription Cancelled", { description: "Your active subscription has been cancelled." })
            await queryClient.invalidateQueries({ queryKey: ['my-subscription'] })
            setIsManaging(false)
        },
        onError: (error: any) => {
            console.error(error)
            toast.error("Action Failed", { description: "Could not cancel the subscription." })
        }
    })

    return (
        <div className="h-screen w-full bg-zinc-950 text-zinc-100 font-sans p-4 md:p-12 overflow-y-auto overflow-x-hidden select-none relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* AMBIENT GLOW EFFECTS */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10 space-y-10 animate-in fade-in duration-500 pb-12">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 pt-4 md:pt-0 gap-4">
                    <div className="flex items-center gap-4">
                        <Link to="/">
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl border border-white/5 shrink-0">
                                <ArrowLeft size={20} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">My Profile</h1>
                            <p className="text-xs md:text-sm text-zinc-400 font-medium mt-0.5">Manage your account and subscription</p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={logout} className="text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                        <LogOut size={18} className="mr-2" /> Log out
                    </Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: PROFILE INFO */}
                    <div className="lg:col-span-1 space-y-8 animate-in slide-in-from-left-4 duration-500">
                        <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-md outline-none ring-0 shadow-xl overflow-hidden relative group h-full">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-bl-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500" />
                            <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                                <div className="w-24 h-24 rounded-full bg-zinc-950 border-2 border-orange-500/50 mb-4 flex items-center justify-center relative shadow-[0_0_20px_rgba(249,115,22,0.1)] group-hover:border-orange-500 transition-colors">
                                    <UserCircle size={48} className="text-zinc-600" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{user?.firstName} {user?.lastName}</h3>
                                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-6">{user?.email}</p>

                                <div className="w-full mt-auto bg-zinc-950/50 border border-white/5 rounded-lg flex items-center justify-center text-zinc-500 text-xs font-medium border-dashed cursor-not-allowed py-3">
                                    PLACEHOLDER: Profile Settings
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: SUB MANAGEMENT */}
                    <div className="lg:col-span-2 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-md outline-none ring-0 shadow-xl flex flex-col h-full">
                            <CardHeader className="bg-zinc-900/50 p-6 pb-5 border-b border-white/5">
                                <CardTitle className="text-white text-xl flex items-center gap-2">
                                    <Award size={20} className="text-orange-500" /> Membership Status
                                </CardTitle>
                                <CardDescription className="text-zinc-400 mt-1.5">Manage your gym access and plans</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 flex-1 flex flex-col justify-center relative">
                                {isSubLoading ? (
                                    <div className="space-y-4 animate-pulse">
                                        <div className="h-24 bg-zinc-800/50 rounded-xl" />
                                        <div className="h-12 bg-zinc-800/50 rounded-xl" />
                                    </div>
                                ) : subscription ? (
                                    <div className="space-y-6 max-w-md mx-auto w-full">
                                        {/* active sub banner */}
                                        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 p-5 rounded-2xl relative overflow-hidden group text-center">
                                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-500/20 rounded-full blur-2xl group-hover:bg-green-500/30 transition-all duration-500" />
                                            <p className="text-sm font-bold text-green-400 uppercase tracking-wider mb-1">Active Plan</p>
                                            <h3 className="text-4xl font-black text-white mb-2">{subscription.tierName}</h3>
                                            <p className="text-xs text-zinc-400 font-medium">Valid until: <span className="text-zinc-300">{new Date(subscription.endDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span></p>
                                        </div>

                                        {!isManaging ? (
                                            <Button
                                                variant="outline"
                                                className="w-full h-12 bg-zinc-900/50 border-white/10 text-white hover:bg-white hover:text-black transition-colors font-bold outline-none ring-0 focus-visible:ring-0 focus-visible:outline-none"
                                                onClick={() => setIsManaging(true)}
                                            >
                                                <Settings size={18} className="mr-2" /> Manage Subscription
                                            </Button>
                                        ) : (
                                            <div className="flex flex-col gap-3 p-5 bg-zinc-950/50 rounded-2xl border border-white/5 animate-in slide-in-from-top-4 fade-in duration-400 ease-out">
                                                <p className="text-sm font-bold text-zinc-400 text-center mb-1">Available Actions</p>

                                                <Link to="/subscriptions" className="w-full block outline-none">
                                                    <Button className="w-full h-11 bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white border-none shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all font-bold outline-none ring-0 focus-visible:ring-0">
                                                        <Zap size={16} className="mr-2" /> Upgrade Plan
                                                    </Button>
                                                </Link>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="outline" className="w-full h-11 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 border-red-500/20 transition-colors font-bold outline-none ring-0 focus-visible:ring-0 focus-visible:outline-none">
                                                            <ShieldAlert size={16} className="mr-2" /> Cancel Subscription
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="bg-zinc-950 border border-white/10 text-white shadow-2xl sm:rounded-2xl outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:outline-none">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="text-xl font-bold text-white">Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-zinc-400">
                                                                This action will revoke your gym benefits immediately and cancel any recurring payments.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="mt-4">
                                                            <AlertDialogCancel className="bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white border-white/10 outline-none ring-0 focus-visible:ring-0 focus-visible:outline-none transition-colors">
                                                                Keep it
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => cancelSubscriptionMutation.mutate()}
                                                                className="bg-red-600 hover:bg-red-500 text-white border-none font-bold outline-none ring-0 focus-visible:ring-0 focus-visible:outline-none shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-colors"
                                                            >
                                                                Yes, cancel it
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>

                                                <Button
                                                    type="button"
                                                    className="w-full mt-2 bg-transparent text-zinc-500 hover:bg-zinc-800 hover:text-white border-none shadow-none outline-none ring-0 focus-visible:ring-0 focus-visible:outline-none transition-colors"
                                                    onClick={() => setIsManaging(false)}
                                                >
                                                    Close Panel
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6 max-w-md mx-auto w-full text-center">
                                        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-dashed border-white/10 flex flex-col items-center">
                                            <div className="p-3 bg-zinc-950 rounded-full mb-3 border border-white/5">
                                                <Award size={24} className="text-zinc-600" />
                                            </div>
                                            <p className="text-lg font-bold text-white mb-1">No active subscription</p>
                                            <p className="text-sm text-zinc-500">Purchase a plan to unlock gym access and book your favorite workouts.</p>
                                        </div>
                                        <Link to="/subscriptions" className="w-full block">
                                            <Button className="w-full h-12 bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white border-none shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all font-bold text-base">
                                                Browse Plans
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}