import * as React from "react"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { LogOut, CalendarPlus, Clock, Users, ShieldAlert, ArrowRight, UserCircle, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

// PRESET AVATARS FOR SYSTEM
const PRESET_AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=f97316",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=3b82f6",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=10b981",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=8b5cf6",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert&backgroundColor=f43f5e",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=d946ef"
]

interface AgendaClass { id: string; name: string; startTime: string; endTime: string; attendeesCount: number }
interface AgendaSlot { id: string; startTime: string; endTime: string; status: string }
interface CoachAgenda { assignedClasses: AgendaClass[]; trainerSlots: AgendaSlot[] }

interface MyProfile {
    id: string; email: string; firstName: string; lastName: string; avatarUrl: string | null; bio: string | null;
}

export default function TrainerDashboard() {
    const { user, logout } = useAuth()
    const queryClient = useQueryClient()

    const [startTime, setStartTime] = useState("")
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
    const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", bio: "", avatarUrl: "", email: "", currentPassword: "", newPassword: "" })

    const { data: agenda, isLoading } = useQuery<CoachAgenda>({
        queryKey: ['coach-agenda'],
        queryFn: async () => (await api.get('/api/coaches/agenda')).data
    })

    const { data: profile } = useQuery<MyProfile>({
        queryKey: ['my-profile'],
        queryFn: async () => (await api.get('/api/users/me/profile')).data
    })

    // SYNC PROFILE DATA INTO FORM STATE WHEN MODAL OPENS
    useEffect(() => {
        if (profile && isProfileModalOpen) {
            setProfileForm({
                firstName: profile.firstName || "",
                lastName: profile.lastName || "",
                bio: profile.bio || "",
                avatarUrl: profile.avatarUrl || "",
                email: profile.email || "",
                currentPassword: "",
                newPassword: ""
            })
        }
    }, [profile, isProfileModalOpen])

    const updateProfileMutation = useMutation({
        mutationFn: async (payload: typeof profileForm) => (await api.put('/api/users/me/profile', payload)).data,
        onSuccess: async () => {
            toast.success("Profile Updated", { description: "Your details have been saved successfully." })
            await queryClient.invalidateQueries({ queryKey: ['my-profile'] })
            setIsProfileModalOpen(false)
        },
        onError: () => toast.error("Update Failed", { description: "Could not update profile. Check your inputs." })
    })

    const handleAddSlot = (e: React.SyntheticEvent) => {
        e.preventDefault()
        if (!startTime) return
        const startObj = new Date(startTime)
        const endObj = new Date(startObj.getTime() + 60 * 60 * 1000)
        addSlotMutation.mutate({ startTime: startObj.toISOString(), endTime: endObj.toISOString() })
    }

    const addSlotMutation = useMutation({
        mutationFn: async (payload: { startTime: string, endTime: string }) => (await api.post('/api/coaches/slots', payload)).data,
        onSuccess: async () => {
            toast.success("Slot Added")
            setStartTime("")
            await queryClient.invalidateQueries({ queryKey: ['coach-agenda'] })
        }
    })

    const cancelSlotMutation = useMutation({
        mutationFn: async (slotId: string) => (await api.delete(`/api/coaches/slots/${slotId}`)).data,
        onSuccess: async () => {
            toast.success("Slot Cancelled")
            await queryClient.invalidateQueries({ queryKey: ['coach-agenda'] })
        }
    })

    const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

    return (
        <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 font-sans p-4 md:p-12 overflow-y-auto overflow-x-hidden select-none relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10 space-y-10 animate-in fade-in duration-500 pb-12">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 pt-2 gap-4 px-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-zinc-900/80 rounded-xl border border-white/5">
                            <ShieldAlert className="text-orange-500" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Trainer Portal</h1>
                            <p className="text-xs md:text-sm text-zinc-400 font-medium mt-0.5">Welcome to your workspace, <span className="text-orange-400">{profile?.firstName || user?.firstName}</span>!</p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={logout} className="text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors mr-2">
                        <LogOut size={18} className="mr-2" /> Log out
                    </Button>
                </div>

                {/* FLAT GRID FOR PERFECT ALIGNMENT */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ROW 1 */}
                    <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-md outline-none ring-0 shadow-xl overflow-hidden relative group lg:col-span-1 animate-in slide-in-from-left-4 duration-500 h-full flex flex-col min-h-[300px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-bl-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500" />
                        <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center flex-1">
                            <div className="w-24 h-24 rounded-full bg-zinc-950 border-2 border-orange-500/50 mb-4 flex items-center justify-center relative shadow-[0_0_20px_rgba(249,115,22,0.1)] group-hover:border-orange-500 transition-all overflow-hidden">
                                {profile?.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle size={48} className="text-zinc-600" />
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}</h3>
                            <p className="text-xs font-semibold uppercase tracking-wider text-orange-500 mb-2">Expert Trainer</p>
                            <p className="text-xs text-zinc-400 italic mb-6">"{profile?.bio || "Passionate about fitness and helping others achieve their goals."}"</p>

                            <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full mt-auto bg-zinc-950/50 border-white/10 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
                                        <Settings size={16} className="mr-2" /> Edit Profile
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                    <DialogHeader>
                                        <DialogTitle>Profile Settings</DialogTitle>
                                        <DialogDescription>Update your personal details and public bio.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        {/* AVATAR SELECTION */}
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
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2"><Label>First Name</Label><Input className="bg-zinc-900 border-white/10" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} /></div>
                                            <div className="space-y-2"><Label>Last Name</Label><Input className="bg-zinc-900 border-white/10" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} /></div>
                                        </div>
                                        <div className="space-y-2"><Label>Public Bio</Label>
                                            <textarea className="flex w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 min-h-[80px]" placeholder="Tell clients about your experience..." value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} />
                                        </div>
                                        
                                        <hr className="border-white/5 my-2" />
                                        <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Security Zone</p>
                                        <div className="space-y-2"><Label>Email Address</Label><Input className="bg-zinc-900 border-white/10" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} /></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2"><Label>Current Password</Label><Input type="password" placeholder="Required" className="bg-zinc-900 border-white/10" value={profileForm.currentPassword} onChange={e => setProfileForm({...profileForm, currentPassword: e.target.value})} /></div>
                                            <div className="space-y-2"><Label>New Password</Label><Input type="password" placeholder="Optional" className="bg-zinc-900 border-white/10" value={profileForm.newPassword} onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})} /></div>
                                        </div>
                                    </div>
                                    <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold" disabled={updateProfileMutation.isPending} onClick={() => updateProfileMutation.mutate(profileForm)}>
                                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                                    </Button>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-md outline-none ring-0 shadow-xl flex flex-col lg:col-span-2 animate-in slide-in-from-bottom-4 duration-500 h-full min-h-[300px]">
                        <CardHeader className="bg-zinc-900/50 p-6 pb-5 border-b border-white/5">
                            <CardTitle className="text-white text-xl flex items-center gap-2">
                                <Users size={20} className="text-blue-400" /> Assigned Group Classes
                            </CardTitle>
                            <CardDescription className="text-zinc-400 mt-1.5">Classes you are leading</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-hidden relative">
                            <div className="absolute inset-0 overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-12">
                                {isLoading ? (
                                    <div className="space-y-3 animate-pulse"><div className="h-20 bg-zinc-800/50 rounded-xl" /><div className="h-20 bg-zinc-800/50 rounded-xl" /></div>
                                ) : agenda?.assignedClasses.length ? (
                                    <div className="space-y-3">
                                        {agenda.assignedClasses.map(cls => (
                                            <div key={cls.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-zinc-950/50 border border-white/5 rounded-xl hover:border-blue-500/30 transition-colors gap-4 relative z-10">
                                                <div>
                                                    <p className="font-bold text-white text-base">{cls.name}</p>
                                                    <div className="flex items-center text-xs text-zinc-500 mt-1 font-medium bg-zinc-900 px-2 py-1 rounded w-fit">
                                                        <Clock size={12} className="mr-1.5 text-blue-400" />
                                                        {formatDateTime(cls.startTime)} <ArrowRight size={10} className="mx-1" /> {formatDateTime(cls.endTime).split(', ')[1]}
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                                                    {cls.attendeesCount} Enrolled
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex h-full items-center justify-center"><p className="text-zinc-500 font-medium">No upcoming classes assigned.</p></div>
                                )}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/0 pointer-events-none z-20" />
                        </CardContent>
                    </Card>

                    {/* ROW 2 */}
                    <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-md outline-none ring-0 shadow-xl lg:col-span-1 animate-in slide-in-from-left-4 duration-500 h-full flex flex-col">
                        <CardHeader className="bg-zinc-900/50 p-6 pb-5 border-b border-white/5">
                            <div className="flex items-center gap-2 mb-1">
                                <CalendarPlus size={18} className="text-orange-500" />
                                <CardTitle className="text-white text-xl">Add Availability</CardTitle>
                            </div>
                            <CardDescription className="text-zinc-400 mt-1.5 text-xs">Open a new 1-hour slot for personal training</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 flex-1">
                            <form onSubmit={handleAddSlot} className="space-y-4">
                                <div className="space-y-2 mt-4">
                                    <Label htmlFor="start" className="text-zinc-300">Start Time</Label>
                                    <Input
                                        id="start"
                                        type="datetime-local"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        required
                                        className="bg-zinc-900 border-white/10 text-white [color-scheme:dark] focus-visible:ring-orange-500"
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold border-none mt-2" disabled={addSlotMutation.isPending}>
                                    {addSlotMutation.isPending ? "Adding..." : "Add 1-Hour Slot"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-md outline-none ring-0 shadow-xl flex flex-col lg:col-span-2 animate-in slide-in-from-bottom-4 duration-500 h-[286px]">
                        <CardHeader className="bg-zinc-900/50 p-6 pb-5 border-b border-white/5">
                            <CardTitle className="text-white text-xl flex items-center gap-2">
                                <Clock size={20} className="text-orange-500" /> My 1:1 Slots
                            </CardTitle>
                            <CardDescription className="text-zinc-400 mt-1.5">Your personal training schedule</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-hidden relative">
                            <div className="absolute inset-0 overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-12">
                                {isLoading ? (
                                    <div className="space-y-3 animate-pulse"><div className="h-16 bg-zinc-800/50 rounded-xl" /><div className="h-16 bg-zinc-800/50 rounded-xl" /></div>
                                ) : agenda?.trainerSlots.length ? (
                                    <div className="space-y-3">
                                        {agenda.trainerSlots.map(slot => {
                                            const isAvailable = slot.status === "Available";
                                            const isBooked = slot.status === "Booked";

                                            return (
                                                <div key={slot.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-zinc-950/50 border-white/5 rounded-xl hover:border-orange-500/30 transition-colors gap-4 relative z-10">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                                                            <p className="font-bold text-white text-sm">1:1 Session</p>
                                                        </div>
                                                        <p className="text-xs text-zinc-500 font-medium ml-4">{formatDateTime(slot.startTime)} - {formatDateTime(slot.endTime).split(', ')[1]}</p>
                                                    </div>

                                                    <div className="flex items-center gap-3 shrink-0 ml-4 sm:ml-0">
                                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                                            isAvailable ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                                isBooked ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                                    "bg-zinc-800 text-zinc-400 border-white/5"
                                                        }`}>
                                                            {slot.status}
                                                        </span>

                                                        {slot.status !== "Cancelled" && slot.status !== "Completed" && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 text-xs">Cancel</Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="bg-zinc-950 border border-white/10 text-white">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Cancel Work Slot</AlertDialogTitle>
                                                                        <AlertDialogDescription className="text-zinc-400">Are you sure you want to cancel this availability? If a client has already booked it, their reservation will also be cancelled.</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel className="bg-zinc-900 text-white hover:bg-zinc-800 border-white/10">Keep it</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => cancelSlotMutation.mutate(slot.id)} className="bg-red-600 hover:bg-red-700 text-white border-none" disabled={cancelSlotMutation.isPending}>
                                                                            {cancelSlotMutation.isPending ? "Cancelling..." : "Yes, cancel slot"}
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex h-full items-center justify-center"><p className="text-zinc-500 font-medium">You haven't opened any slots yet.</p></div>
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