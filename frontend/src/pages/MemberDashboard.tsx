import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { ArrowLeft, LogOut, Settings, Award, ShieldAlert, Zap, UserCircle, Activity, Calendar, TrendingUp, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const PRESET_AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=f97316",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=3b82f6",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=10b981",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=8b5cf6",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert&backgroundColor=f43f5e",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=d946ef"
]

interface Subscription { id: string; tierName: string; endDate: string }
interface Reservation { trainerName: string; reservationId: string; title: string; startTime: string; endTime: string; status: string; type: string; }
interface MyProfile { id: string; email: string; firstName: string; lastName: string; avatarUrl: string | null; bio: string | null; weight: number | null; height: number | null; }

export default function MemberDashboard() {
    const { user, logout } = useAuth()
    const queryClient = useQueryClient()
    const [isManaging, setIsManaging] = useState(false)
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
    const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false)

    const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", avatarUrl: "" })
    const [securityForm, setSecurityForm] = useState({ email: "", currentPassword: "", newPassword: "" })
    const [metricsForm, setMetricsForm] = useState<{weight: string, height: string}>({ weight: "", height: "" })

    const { data: subscription, isLoading: isSubLoading } = useQuery<Subscription | null>({
        queryKey: ['my-subscription'], queryFn: async () => { try { return (await api.get('/api/subscriptions/my-subscription')).data } catch (error: any) { if (error.response?.status === 404) return null; throw error } }, retry: false
    })

    const { data: profile } = useQuery<MyProfile>({ queryKey: ['my-profile'], queryFn: async () => (await api.get('/api/users/me/profile')).data })
    const { data: reservations } = useQuery<Reservation[]>({ queryKey: ['my-reservations'], queryFn: async () => (await api.get('/api/bookings/my-reservations')).data })

    // SYNC DATA TO FORMS
    useEffect(() => {
        if (profile) {
            if (isProfileModalOpen) {
                setProfileForm({ firstName: profile.firstName || "", lastName: profile.lastName || "", avatarUrl: profile.avatarUrl || "" })
                setSecurityForm({ email: profile.email || "", currentPassword: "", newPassword: "" })
            }
            if (isMetricsModalOpen) setMetricsForm({ weight: profile.weight?.toString() || "", height: profile.height?.toString() || "" })
        }
    }, [profile, isProfileModalOpen, isMetricsModalOpen])

    const updateProfileMutation = useMutation({
        mutationFn: async (payload: typeof profileForm) => (await api.put('/api/users/me/profile', payload)).data,
        onSuccess: async () => { toast.success("Profile Updated"); await queryClient.invalidateQueries({ queryKey: ['my-profile'] }); setIsProfileModalOpen(false) }
    })

    const updateSecurityMutation = useMutation({
        mutationFn: async (payload: typeof securityForm) => (await api.put('/api/users/me/security', payload)).data,
        onSuccess: async () => { toast.success("Security Updated", { description: "Email or password changed." }); await queryClient.invalidateQueries({ queryKey: ['my-profile'] }); setIsProfileModalOpen(false) },
        onError: (err: any) => toast.error("Update Failed", { description: err.response?.data?.Message || "Invalid current password." })
    })

    const updateMetricsMutation = useMutation({
        mutationFn: async (payload: any) => (await api.put('/api/users/me/metrics', { weight: payload.weight ? Number(payload.weight) : null, height: payload.height ? Number(payload.height) : null })).data,
        onSuccess: async () => { toast.success("Metrics Saved"); await queryClient.invalidateQueries({ queryKey: ['my-profile'] }); setIsMetricsModalOpen(false) }
    })

    const cancelSubscriptionMutation = useMutation({
        mutationFn: async () => (await api.post('/api/subscriptions/cancel')).data,
        onSuccess: (data: any) => {
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                toast.success("Subscription Cancelled");
                queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
                setIsManaging(false);
            }
        },
    })

    // DYNAMIC METRICS CALCULATION (BMI & BODY FAT EST)
    const heightInM = profile?.height ? profile.height / 100 : 0;
    const bmi = (profile?.weight && heightInM) ? (profile.weight / Math.pow(heightInM, 2)).toFixed(1) : null;
    const bodyFat = bmi ? Math.max(5, (1.2 * Number(bmi) - 5.4)).toFixed(1) : null;

    const getBmiStatus = (val: number) => {
        if (val < 18.5) return { label: "Underweight", color: "text-blue-400" }
        if (val < 25) return { label: "Normal", color: "text-green-400" }
        if (val < 30) return { label: "Overweight", color: "text-amber-400" }
        return { label: "Obese", color: "text-red-400" }
    }
    const bmiStatus = bmi ? getBmiStatus(Number(bmi)) : null;

    const pastWorkouts = reservations?.filter(r => new Date(r.endTime).getTime() < new Date().getTime() && r.status !== "Class Cancelled by Gym").slice(0, 5) || []

    return (
        <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 font-sans p-4 md:p-12 overflow-y-auto overflow-x-hidden select-none relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10 space-y-10 animate-in fade-in duration-500 pb-12">
                <div className="flex flex-row items-center justify-between border-b border-white/5 pb-6 pt-2 gap-2 md:gap-4 px-1 md:px-2">
                    <div className="flex items-center gap-3 md:gap-4">
                        <Link to="/"><Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl border border-white/5 shrink-0 w-9 h-9 md:w-10 md:h-10"><ArrowLeft size={18} /></Button></Link>
                        <div>
                            <h1 className="text-xl md:text-3xl font-bold tracking-tight text-white">Member Portal</h1>
                            <p className="text-[10px] md:text-sm text-zinc-400 font-medium mt-0.5">Manage your account</p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={logout} className="text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors shrink-0 px-2 md:px-4 h-9 md:h-10">
                        <LogOut size={18} className="md:mr-2" />
                        <span className="hidden md:block font-bold">Log out</span>
                    </Button>
                </div>

                {/* FLAT GRID FOR PERFECT ROWS ALIGNMENT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ROW 1 */}
                    <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-md outline-none ring-0 shadow-xl overflow-hidden relative group lg:col-span-1 animate-in slide-in-from-left-4 duration-500 h-full flex flex-col min-h-[300px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-bl-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500" />
                        <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center flex-1">
                            <div className="w-24 h-24 rounded-full bg-zinc-950 border-2 border-orange-500/50 mb-4 flex items-center justify-center relative shadow-[0_0_20px_rgba(249,115,22,0.1)] group-hover:border-orange-500 transition-all overflow-hidden">
                                {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <UserCircle size={48} className="text-zinc-600" />}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</h3>
                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-6">{profile?.email || user?.email}</p>

                            <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full mt-auto bg-zinc-950/50 border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
                                        <Settings size={16} className="mr-2" /> Edit Profile
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    <DialogHeader>
                                        <DialogTitle>Profile Settings</DialogTitle>
                                        <DialogDescription>Update your personal details.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-2">
                                        <div className="space-y-3">
                                            <Label className="text-zinc-400">Choose Avatar</Label>
                                            <div className="flex flex-wrap gap-3">
                                                {PRESET_AVATARS.map((url, idx) => (
                                                    <div key={idx} onClick={() => setProfileForm({...profileForm, avatarUrl: url})} className={`w-12 h-12 rounded-full cursor-pointer overflow-hidden border-2 transition-all ${profileForm.avatarUrl === url ? 'border-orange-500 scale-110 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'border-transparent hover:border-zinc-500'}`}>
                                                        <img src={url} alt={`preset-${idx}`} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mb-2">
                                            <div className="space-y-2"><Label>First Name</Label><Input className="bg-zinc-900 border-white/10" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} /></div>
                                            <div className="space-y-2"><Label>Last Name</Label><Input className="bg-zinc-900 border-white/10" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} /></div>
                                        </div>
                                        <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold" disabled={updateProfileMutation.isPending} onClick={() => updateProfileMutation.mutate(profileForm)}>
                                            {updateProfileMutation.isPending ? "Saving..." : "Save Basic Info"}
                                        </Button>

                                        <hr className="border-white/5 my-4" />
                                        <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Security Zone</p>
                                        <div className="space-y-2"><Label>Email Address</Label><Input className="bg-zinc-900 border-white/10" value={securityForm.email} onChange={e => setSecurityForm({...securityForm, email: e.target.value})} /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2"><Label>Current Password</Label><Input type="password" placeholder="Required to save" className="bg-zinc-900 border-white/10" value={securityForm.currentPassword} onChange={e => setSecurityForm({...securityForm, currentPassword: e.target.value})} /></div>
                                            <div className="space-y-2"><Label>New Password</Label><Input type="password" placeholder="Optional" className="bg-zinc-900 border-white/10" value={securityForm.newPassword} onChange={e => setSecurityForm({...securityForm, newPassword: e.target.value})} /></div>
                                        </div>
                                        <Button variant="outline" className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20 font-bold mt-2" disabled={updateSecurityMutation.isPending} onClick={() => updateSecurityMutation.mutate(securityForm)}>
                                            {updateSecurityMutation.isPending ? "Updating..." : "Update Security Credentials"}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-md outline-none ring-0 shadow-xl flex flex-col lg:col-span-2 animate-in slide-in-from-bottom-4 duration-500 h-full min-h-[300px]">
                        <CardHeader className="bg-zinc-900/50 p-6 pb-5 border-b border-white/5">
                            <CardTitle className="text-white text-xl flex items-center gap-2">
                                <Award size={20} className="text-orange-500" /> Membership Status
                            </CardTitle>
                            <CardDescription className="text-zinc-400 mt-1.5">Manage your gym access and plans</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col justify-center relative">
                            {isSubLoading ? (
                                <div className="space-y-4 animate-pulse"><div className="h-24 bg-zinc-800/50 rounded-xl" /><div className="h-12 bg-zinc-800/50 rounded-xl" /></div>
                            ) : subscription ? (
                                <div className="space-y-6 max-w-md mx-auto w-full">
                                    <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 p-5 rounded-2xl relative overflow-hidden group text-center">
                                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-500/20 rounded-full blur-2xl group-hover:bg-green-500/30 transition-all duration-500" />
                                        <p className="text-sm font-bold text-green-400 uppercase tracking-wider mb-1">Active Plan</p>
                                        <h3 className="text-4xl font-black text-white mb-2">{subscription.tierName}</h3>
                                        <p className="text-xs text-zinc-400 font-medium">Valid until: <span className="text-zinc-300">{new Date(subscription.endDate).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span></p>
                                    </div>

                                    <div className="relative overflow-hidden transition-all duration-500 ease-out" style={{ maxHeight: isManaging ? '300px' : '48px' }}>
                                        {/* MAIN BUTTON */}
                                        <div className={`absolute top-0 left-0 w-full transition-all duration-500 ease-in-out ${isManaging ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                                            <Button variant="outline" className="w-full h-12 bg-zinc-900/50 border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all duration-300 font-bold outline-none ring-0 focus-visible:ring-0" onClick={() => setIsManaging(true)}>
                                                <Settings size={18} className="mr-2" /> Manage Subscription
                                            </Button>
                                        </div>

                                        {/* SLIDING ACTION PANEL */}
                                        <div className={`flex flex-col gap-3 p-5 bg-zinc-950/50 rounded-2xl border border-white/5 transition-all duration-500 ease-in-out w-full ${isManaging ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
                                            <p className="text-sm font-bold text-zinc-400 text-center mb-1">Available Actions</p>
                                            <Link to="/subscriptions" className="w-full block outline-none">
                                                <Button className="w-full h-11 bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white border-none shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all font-bold">
                                                    <Zap size={16} className="mr-2" /> Upgrade Plan
                                                </Button>
                                            </Link>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" className="w-full h-11 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 border-red-500/20 font-bold transition-all duration-300">
                                                        <ShieldAlert size={16} className="mr-2" /> Cancel Subscription
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="bg-zinc-950 border border-white/10 text-white">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-zinc-400">This action will revoke your gym benefits immediately and cancel any recurring payments.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel className="bg-zinc-900 text-white hover:bg-zinc-800 border-white/10">Keep it</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => cancelSubscriptionMutation.mutate()} className="bg-red-600 hover:bg-red-500 text-white border-none font-bold">Yes, cancel it</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                            <Button type="button" className="w-full mt-2 bg-transparent text-zinc-500 hover:bg-zinc-800 hover:text-white transition-all duration-300 border-none shadow-none" onClick={() => setIsManaging(false)}>Close Panel</Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 max-w-md mx-auto w-full text-center">
                                    <div className="bg-zinc-900/50 p-6 rounded-2xl border border-dashed border-white/10 flex flex-col items-center">
                                        <div className="p-3 bg-zinc-950 rounded-full mb-3 border border-white/5"><Award size={24} className="text-zinc-600" /></div>
                                        <p className="text-lg font-bold text-white mb-1">No active subscription</p>
                                        <p className="text-sm text-zinc-500">Purchase a plan to unlock gym access and book your favorite workouts.</p>
                                    </div>
                                    <Link to="/subscriptions" className="w-full block">
                                        <Button className="w-full h-12 bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white border-none shadow-[0_0_15px_rgba(249,115,22,0.15)] font-bold text-base">Browse Plans</Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ROW 2 */}
                    <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-md outline-none ring-0 shadow-xl lg:col-span-1 animate-in slide-in-from-left-4 duration-500 h-full flex flex-col min-h-[300px]">
                        <CardHeader className="bg-zinc-900/50 p-6 pb-5 border-b border-white/5">
                            <div className="flex items-center gap-2 mb-1">
                                <Activity size={18} className="text-orange-500" />
                                <CardTitle className="text-white text-xl">Body Metrics</CardTitle>
                            </div>
                            <CardDescription className="text-zinc-400 mt-1.5 text-xs">Track your fitness journey progress</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col">
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <div className="bg-zinc-950 rounded-xl p-3 text-center border border-white/5">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Weight</p>
                                    <p className="text-lg font-black text-white">{profile?.weight ? `${profile.weight}kg` : '--'}</p>
                                </div>
                                <div className="bg-zinc-950 rounded-xl p-3 text-center border border-white/5">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Height</p>
                                    <p className="text-lg font-black text-white">{profile?.height ? `${profile.height}cm` : '--'}</p>
                                </div>
                                <div className="bg-zinc-950 rounded-xl p-3 text-center border border-white/5 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1 relative z-10">Est. Fat</p>
                                    <p className="text-lg font-black text-white relative z-10">{bodyFat ? `${bodyFat}%` : '--'}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-dashed border-zinc-800 mb-6 mt-auto">
                                <div>
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Calculated BMI</p>
                                    {bmi ? (
                                        <p className="text-2xl font-black text-white">{bmi} <span className={`text-sm ml-1 ${bmiStatus?.color}`}>{bmiStatus?.label}</span></p>
                                    ) : (
                                        <p className="text-sm font-medium text-zinc-600 mt-1">Need weight & height</p>
                                    )}
                                </div>
                                <TrendingUp size={24} className="text-zinc-700" />
                            </div>

                            <Dialog open={isMetricsModalOpen} onOpenChange={setIsMetricsModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full mt-auto bg-zinc-950/50 border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
                                        Update Stats
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[350px]">
                                    <DialogHeader>
                                        <DialogTitle>Update Metrics</DialogTitle>
                                        <DialogDescription>Log your current weight and height.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" step="0.1" className="bg-zinc-900 border-white/10" value={metricsForm.weight} onChange={e => setMetricsForm({...metricsForm, weight: e.target.value})} /></div>
                                        <div className="space-y-2"><Label>Height (cm)</Label><Input type="number" step="0.1" className="bg-zinc-900 border-white/10" value={metricsForm.height} onChange={e => setMetricsForm({...metricsForm, height: e.target.value})} /></div>
                                    </div>
                                    <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold" disabled={updateMetricsMutation.isPending} onClick={() => updateMetricsMutation.mutate(metricsForm)}>
                                        {updateMetricsMutation.isPending ? "Saving..." : "Save Metrics"}
                                    </Button>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-md outline-none ring-0 shadow-xl flex flex-col lg:col-span-2 animate-in slide-in-from-bottom-4 duration-500 h-full min-h-[300px]">
                        <CardHeader className="bg-zinc-900/50 p-6 pb-5 border-b border-white/5">
                            <CardTitle className="text-white text-xl flex items-center gap-2">
                                <Calendar size={20} className="text-blue-400" /> Activity History
                            </CardTitle>
                            <CardDescription className="text-zinc-400 mt-1.5">Your recently completed workouts</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-hidden relative">
                            <div className="absolute inset-0 overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-12">
                                {pastWorkouts.length > 0 ? (
                                    <div className="space-y-3">
                                        {pastWorkouts.map((workout) => (
                                            <div key={workout.reservationId} className="flex justify-between items-center p-4 bg-zinc-950/50 border border-white/5 rounded-xl relative z-10 hover:border-blue-500/30 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
                                                        <CheckCircle2 size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{workout.title}</p>
                                                        <p className="text-xs text-zinc-500 mt-0.5">{new Date(workout.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} with {workout.trainerName}</p>
                                                    </div>
                                                </div>
                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-white/5 shrink-0">
                                                    {workout.type}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex h-full items-center justify-center flex-col gap-2">
                                        <div className="p-3 bg-zinc-900/50 rounded-full border border-white/5"><Activity size={20} className="text-zinc-600" /></div>
                                        <p className="text-zinc-500 font-medium text-sm">No recent workouts to display.</p>
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/0 pointer-events-none z-20" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}