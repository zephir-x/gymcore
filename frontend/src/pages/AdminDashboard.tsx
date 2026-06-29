import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, DollarSign, Dumbbell, LogOut, ShieldAlert, ImageIcon, Megaphone } from 'lucide-react'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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

// PREDEFINED PREMIUM IMAGES FOR ROOMS AND CLASSES
const PRESET_FACILITY_IMAGES = [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1470&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1570829460005-c840387bb1ca?q=80&w=1632&auto=format&fit=crop"
];

// INTERFACES
interface Room {
    id: string
    name: string
    maxCapacity: number
    requiredTierId?: string | null
    requiredTierName?: string | null
    imageUrl?: string | null
    description?: string | null
}

interface SubscriptionTier {
    id: string
    name: string
}

interface SystemUser {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    isActive: boolean
    createdAt: string
}

interface AdminClass {
    id: string
    name: string
    coachName: string
    roomName: string
    startTime: string
    endTime: string
    maxAttendees: number
    currentBookings: number
    waitlistCount: number
    isCancelled: boolean
    imageUrl?: string | null
}

interface SubscriptionDistribution {
    tierName: string;
    count: number;
}

interface DashboardStats {
    totalMembers: number;
    totalStaff: number;
    monthlyRevenue: number;
    distribution: SubscriptionDistribution[];
}

export default function AdminDashboard() {
    const { logout } = useAuth()
    const queryClient = useQueryClient()

    // TABS STATE
    const [activeTab, setActiveTab] = React.useState("statistics")

    // ROOM STATES
    const [isRoomModalOpen, setIsRoomModalOpen] = React.useState(false)
    const [editingRoomId, setEditingRoomId] = React.useState<string | null>(null)
    const [roomName, setRoomName] = React.useState("")
    const [roomCapacity, setRoomCapacity] = React.useState("")
    const [requiredTierId, setRequiredTierId] = React.useState<string>("none")
    const [roomImageUrl, setRoomImageUrl] = React.useState<string>("")
    const [roomDescription, setRoomDescription] = React.useState<string>("")

    // COACH STATES
    const [isCoachModalOpen, setIsCoachModalOpen] = React.useState(false)
    const [coachEmail, setCoachEmail] = React.useState("")
    const [coachFirstName, setCoachFirstName] = React.useState("")
    const [coachLastName, setCoachLastName] = React.useState("")
    const [coachPassword, setCoachPassword] = React.useState("")

    // USER STATES
    const [isEditUserModalOpen, setIsEditUserModalOpen] = React.useState(false)
    const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null)
    const [editFirstName, setEditFirstName] = React.useState("")
    const [editLastName, setEditLastName] = React.useState("")
    const [editEmail, setEditEmail] = React.useState("")
    const [editPassword, setEditPassword] = React.useState("")

    // SCHEDULE STATES
    const [isClassModalOpen, setIsClassModalOpen] = React.useState(false)
    const [className, setClassName] = React.useState("")
    const [classCoachId, setClassCoachId] = React.useState("")
    const [classRoomId, setClassRoomId] = React.useState("")
    const [classStartTime, setClassStartTime] = React.useState("")
    const [classEndTime, setClassEndTime] = React.useState("")
    const [classMaxAttendees, setClassMaxAttendees] = React.useState("")

    // BROADCAST STATES
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = React.useState(false)
    const [broadcastTitle, setBroadcastTitle] = React.useState("")
    const [broadcastMessage, setBroadcastMessage] = React.useState("")
    
    // QUERIES
    const { data: rooms, isLoading: isRoomsLoading } = useQuery<Room[]>({
        queryKey: ['admin-rooms'],
        queryFn: async () => (await api.get('/api/admin/rooms')).data
    })

    const { data: tiers } = useQuery<SubscriptionTier[]>({
        queryKey: ['subscription-tiers'],
        queryFn: async () => (await api.get('/api/subscriptions/tiers')).data
    })

    const { data: members, isLoading: isMembersLoading } = useQuery<SystemUser[]>({
        queryKey: ['admin-users', 'Member'],
        queryFn: async () => (await api.get('/api/admin/users?role=Member')).data
    })

    const { data: systemCoaches, isLoading: isCoachesLoading } = useQuery<SystemUser[]>({
        queryKey: ['admin-users', 'Coach'],
        queryFn: async () => (await api.get('/api/admin/users?role=Coach')).data
    })

    const { data: adminClasses, isLoading: isClassesLoading } = useQuery<AdminClass[]>({
        queryKey: ['admin-classes'],
        queryFn: async () => (await api.get('/api/admin/classes')).data
    })

    const { data: stats, isLoading: isStatsLoading } = useQuery<DashboardStats>({
        queryKey: ['admin-stats'],
        queryFn: async () => (await api.get('/api/admin/statistics')).data
    })

    const pieColors = ['#f97316', '#8b5cf6', '#3b82f6', '#10b981', '#fbbf24', '#ef4444'];

    // ROOM MUTATIONS
    const saveRoomMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                name: roomName,
                maxCapacity: parseInt(roomCapacity),
                requiredTierId: requiredTierId === "none" ? null : requiredTierId,
                imageUrl: roomImageUrl || null,
                description: roomDescription || null
            }

            if (editingRoomId) {
                return await api.put(`/api/admin/rooms/${editingRoomId}`, { roomId: editingRoomId, ...payload })
            } else {
                return await api.post('/api/admin/rooms', payload)
            }
        },
        onSuccess: async () => {
            toast.success(editingRoomId ? "Room Updated" : "Room Created", { description: "The facility has been successfully updated." })
            setIsRoomModalOpen(false)
            resetRoomForm()
            await queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
        },
        onError: (error: any) => {
            console.error(error)
            toast.error("Action Failed", { description: "An error occurred while saving the room." })
        }
    })

    const deleteRoomMutation = useMutation({
        mutationFn: async (id: string) => {
            return await api.delete(`/api/admin/rooms/${id}`)
        },
        onSuccess: async () => {
            toast.success("Room Deleted", { description: "The room has been removed from the system." })
            await queryClient.invalidateQueries({ queryKey: ['admin-rooms'] })
        },
        onError: (error: any) => {
            console.error(error)
            toast.error("Deletion Blocked", { description: "Could not delete this room due to existing dependencies." })
        }
    })

    // USER MUTATIONS
    const createCoachMutation = useMutation({
        mutationFn: async () => {
            return await api.post('/api/admin/coaches', {
                email: coachEmail,
                firstName: coachFirstName,
                lastName: coachLastName,
                password: coachPassword
            })
        },
        onSuccess: async () => {
            toast.success("Trainer Created", { description: "The new trainer can now log in." })
            setIsCoachModalOpen(false)
            setCoachEmail(""); setCoachFirstName(""); setCoachLastName(""); setCoachPassword("");
            await queryClient.invalidateQueries({ queryKey: ['admin-users', 'Coach'] })
        },
        onError: (error: any) => {
            console.error(error)
            toast.error("Action Failed", { description: "An error occurred." })
        }
    })

    const updateUserMutation = useMutation({
        mutationFn: async () => {
            return await api.put(`/api/admin/users/${selectedUserId}`, {
                userId: selectedUserId,
                firstName: editFirstName,
                lastName: editLastName,
                email: editEmail,
                newPassword: editPassword || null
            })
        },
        onSuccess: async () => {
            toast.success("User Profile Updated", { description: "Changes and credentials updated successfully." })
            setIsEditUserModalOpen(false)
            setEditPassword("")
            await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
        onError: (error: any) => {
            console.error(error)
            toast.error("Action Failed", { description: "Failed to update user." })
        }
    })

    const toggleStatusMutation = useMutation({
        mutationFn: async (userId: string) => await api.patch(`/api/admin/users/${userId}/toggle-status`),
        onSuccess: async () => {
            toast.success("Status Changed")
            await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        },
        onError: (error: any) => {
            console.error(error)
            toast.error("Error", { description: "Failed to change status." })
        }
    })

    // SCHEDULE MUTATIONS
    const createClassMutation = useMutation({
        mutationFn: async () => {
            const selectedRoomObj = rooms?.find(r => r.id === classRoomId);
            const imageToSave = selectedRoomObj?.imageUrl || null;

            return await api.post('/api/admin/classes', {
                name: className,
                coachId: classCoachId,
                roomId: classRoomId,
                startTime: new Date(classStartTime).toISOString(),
                endTime: new Date(classEndTime).toISOString(),
                maxAttendees: parseInt(classMaxAttendees),
                imageUrl: imageToSave
            })
        },
        onSuccess: async () => {
            toast.success("Class Scheduled", { description: "The group class has been added to the calendar." })
            setIsClassModalOpen(false)
            setClassName(""); setClassCoachId(""); setClassRoomId(""); setClassStartTime(""); setClassEndTime(""); setClassMaxAttendees("");
            await queryClient.invalidateQueries({ queryKey: ['admin-classes'] })
        },
        onError: (error: any) => {
            console.error(error)
            toast.error("Error", { description: "Scheduling failed." })
        }
    })

    const deleteClassMutation = useMutation({
        mutationFn: async (classId: string) => await api.delete(`/api/admin/classes/${classId}`),
        onSuccess: async () => {
            toast.success("Class Removed")
            await queryClient.invalidateQueries({ queryKey: ['admin-classes'] })
        },
        onError: (error: any) => {
            console.error(error)
            toast.error("Action Blocked", { description: "Failed to delete class." })
        }
    })

    // NOTIFICATION MUTATIONS
    const broadcastMutation = useMutation({
        mutationFn: async () => {
            return await api.post('/api/admin/notifications/broadcast', {
                title: broadcastTitle,
                message: broadcastMessage
            })
        },
        onSuccess: async () => {
            toast.success("Broadcast Sent", { description: "The message has been sent to all active users." })
            setIsBroadcastModalOpen(false)
            setBroadcastTitle("")
            setBroadcastMessage("")
        },
        onError: (error: any) => {
            console.error(error)
            toast.error("Broadcast Failed", { description: "Could not send the message. Please check the inputs." })
        }
    })

    const handleSendBroadcast = (e: React.SyntheticEvent) => {
        e.preventDefault()
        broadcastMutation.mutate()
    }

    // HANDLERS
    const handleOpenCreateModal = () => {
        resetRoomForm()
        setIsRoomModalOpen(true)
    }

    const handleOpenEditModal = (room: Room) => {
        setEditingRoomId(room.id)
        setRoomName(room.name)
        setRoomCapacity(room.maxCapacity ? room.maxCapacity.toString() : "")
        setRequiredTierId(room.requiredTierId || "none")
        setRoomImageUrl(room.imageUrl || "")
        setRoomDescription(room.description || "")
        setIsRoomModalOpen(true)
    }

    const resetRoomForm = () => {
        setEditingRoomId(null)
        setRoomName("")
        setRoomCapacity("")
        setRequiredTierId("none")
        setRoomImageUrl("")
        setRoomDescription("")
    }

    const handleSaveRoom = (e: React.SyntheticEvent) => {
        e.preventDefault()
        saveRoomMutation.mutate()
    }

    const handleCreateCoach = (e: React.SyntheticEvent) => {
        e.preventDefault()
        createCoachMutation.mutate()
    }

    const handleOpenEditUser = (user: SystemUser) => {
        setSelectedUserId(user.id)
        setEditFirstName(user.firstName)
        setEditLastName(user.lastName)
        setEditEmail(user.email)
        setEditPassword("")
        setIsEditUserModalOpen(true)
    }

    return (
        <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 font-sans p-4 md:p-12 overflow-y-auto overflow-x-hidden select-none relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* AMBIENT GLOW EFFECTS */}
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10 space-y-10 animate-in fade-in duration-500 pb-12">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 pt-4 md:pt-0 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-zinc-900/80 rounded-xl border border-white/5">
                            <ShieldAlert className="text-orange-500" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Admin Command Center</h1>
                            <p className="text-xs md:text-sm text-zinc-400 font-medium mt-0.5">Manage infrastructure, schedule, and system users</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsBroadcastModalOpen(true)}
                            className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 hover:text-amber-400 font-bold transition-all shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                        >
                            <Megaphone size={16} className="mr-2" /> Broadcast
                        </Button>
                        <Button variant="ghost" onClick={logout} className="text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors">
                            <LogOut size={18} className="mr-2" /> Log out
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col gap-8">
                    <TabsList className="relative flex flex-col sm:flex-row w-full h-auto bg-zinc-900/40 border border-white/5 rounded-2xl p-1.5 gap-1 backdrop-blur-md">
                        {/* FLOATING BACKGROUND (SLIDER) */}
                        <div className="absolute inset-1.5 pointer-events-none">
                            <div className={`w-full sm:w-[calc((100%-0.75rem)/4)] h-[calc((100%-0.75rem)/4)] sm:h-full bg-zinc-800 rounded-xl shadow-md transition-all duration-500 ease-out
                                ${activeTab === "statistics" ? "translate-y-0 sm:translate-y-0 sm:translate-x-0" : ""}
                                ${activeTab === "users" ? "translate-y-[calc(100%+0.25rem)] sm:translate-y-0 sm:translate-x-[calc(100%+0.25rem)]" : ""}
                                ${activeTab === "rooms" ? "translate-y-[calc(200%+0.5rem)] sm:translate-y-0 sm:translate-x-[calc(200%+0.5rem)]" : ""}
                                ${activeTab === "schedule" ? "translate-y-[calc(300%+0.75rem)] sm:translate-y-0 sm:translate-x-[calc(300%+0.75rem)]" : ""}
                            `} />
                        </div>

                        {/* TABS */}
                        <TabsTrigger value="statistics" className="relative z-10 flex-1 text-sm font-bold rounded-xl data-[state=active]:text-white text-zinc-500 hover:text-zinc-300 py-3 transition-colors duration-300">Statistics</TabsTrigger>
                        <TabsTrigger value="users" className="relative z-10 flex-1 text-sm font-bold rounded-xl data-[state=active]:text-white text-zinc-500 hover:text-zinc-300 py-3 transition-colors duration-300">Users</TabsTrigger>
                        <TabsTrigger value="rooms" className="relative z-10 flex-1 text-sm font-bold rounded-xl data-[state=active]:text-white text-zinc-500 hover:text-zinc-300 py-3 transition-colors duration-300">Rooms</TabsTrigger>
                        <TabsTrigger value="schedule" className="relative z-10 flex-1 text-sm font-bold rounded-xl data-[state=active]:text-white text-zinc-500 hover:text-zinc-300 py-3 transition-colors duration-300">Schedule</TabsTrigger>
                    </TabsList>

                    {/* STATISTICS TAB */}
                    <TabsContent value="statistics" className="w-full outline-none ring-0 focus-visible:ring-0 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {isStatsLoading || !stats ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
                                <div className="lg:col-span-2 h-80 bg-zinc-900/50 rounded-3xl border border-white/5" />
                                <div className="space-y-4">
                                    <div className="h-24 bg-zinc-900/50 rounded-2xl border border-white/5" />
                                    <div className="h-24 bg-zinc-900/50 rounded-2xl border border-white/5" />
                                    <div className="h-24 bg-zinc-900/50 rounded-2xl border border-white/5" />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
                                {/* PIE CHART */}
                                <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-md lg:col-span-2 h-full flex flex-col justify-between shadow-xl outline-none ring-0">
                                    <CardHeader className="p-6 pb-2">
                                        <CardTitle className="text-white">Subscription Distribution</CardTitle>
                                        <CardDescription className="text-zinc-400">Visual breakdown of active member plans and churn.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-80 p-6 pt-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stats.distribution.map((entry, index) => ({
                                                        ...entry,
                                                        fill: entry.tierName === "Without Sub"
                                                            ? "#3f3f46"
                                                            : pieColors[index % pieColors.length]
                                                    }))}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={110}
                                                    paddingAngle={5}
                                                    dataKey="count"
                                                    nameKey="tierName"
                                                    stroke="none"
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#a1a1aa', fontSize: '12px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* KPI TILES */}
                                <div className="lg:col-span-1 flex flex-col gap-4 h-full justify-between">
                                    <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-md flex-1 flex items-center group hover:bg-zinc-900/50 transition-colors outline-none ring-0">
                                        <CardContent className="p-6 flex items-center gap-5 w-full">
                                            <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 group-hover:border-blue-500/30 transition-colors text-blue-500 shrink-0">
                                                <Users size={24} />
                                            </div>
                                            <div className="flex flex-col justify-center mt-1">
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Active Members</p>
                                                <h3 className="text-3xl font-black text-white leading-none">{stats.totalMembers}</h3>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-md flex-1 flex items-center group hover:bg-zinc-900/50 transition-colors outline-none ring-0">
                                        <CardContent className="p-6 flex items-center gap-5 w-full">
                                            <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 group-hover:border-green-500/30 transition-colors text-green-500 shrink-0">
                                                <DollarSign size={24} />
                                            </div>
                                            <div className="flex flex-col justify-center mt-1">
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Monthly Revenue</p>
                                                <h3 className="text-3xl font-black text-white leading-none">{stats.monthlyRevenue.toFixed(2)} <span className="text-sm text-zinc-500">PLN</span></h3>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-zinc-900/30 border-white/5 backdrop-blur-md flex-1 flex items-center group hover:bg-zinc-900/50 transition-colors outline-none ring-0">
                                        <CardContent className="p-6 flex items-center gap-5 w-full">
                                            <div className="p-3.5 bg-zinc-950 rounded-xl border border-white/5 group-hover:border-purple-500/30 transition-colors text-purple-500 shrink-0">
                                                <Dumbbell size={24} />
                                            </div>
                                            <div className="flex flex-col justify-center mt-1">
                                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Active Staff</p>
                                                <h3 className="text-3xl font-black text-white leading-none">{stats.totalStaff}</h3>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* USERS TAB */}
                    <TabsContent value="users" className="w-full focus:outline-none space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                        {/* TRAINERS */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h2 className="text-xl font-bold text-white">Gym Trainers</h2>
                                <Button
                                    onClick={() => setIsCoachModalOpen(true)}
                                    className="bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white border-none shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all font-bold"
                                >
                                    + Add Employee
                                </Button>
                            </div>
                            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
                                <div className="w-full overflow-x-auto">
                                    {isCoachesLoading ? (
                                        <div className="p-8 text-center text-zinc-500 animate-pulse">Loading staff...</div>
                                    ) : systemCoaches && systemCoaches.length > 0 ? (
                                        <Table className="w-full border-collapse">
                                            <TableHeader className="bg-zinc-900/60 border-b border-white/5">
                                                <TableRow className="border-none hover:bg-transparent">
                                                    <TableHead className="w-[30%] font-bold text-zinc-400">Name</TableHead>
                                                    <TableHead className="w-[35%] font-bold text-zinc-400">Email</TableHead>
                                                    <TableHead className="w-[15%] font-bold text-zinc-400">Status</TableHead>
                                                    <TableHead className="w-[20%] text-right font-bold text-zinc-400">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {systemCoaches.map((coach) => (
                                                    <TableRow key={coach.id} className={`border-b border-white/5 transition-colors ${!coach.isActive ? "bg-zinc-950/50 opacity-60" : "hover:bg-zinc-900/60"}`}>
                                                        <TableCell className="font-semibold text-white">{coach.firstName} {coach.lastName}</TableCell>
                                                        <TableCell className="text-zinc-400 text-sm">{coach.email}</TableCell>
                                                        <TableCell>
                                                            {coach.isActive ? (
                                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                                                            ) : (
                                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">Disabled</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <Button variant="ghost" size="sm" onClick={() => handleOpenEditUser(coach)} className="text-zinc-300 hover:text-white hover:bg-zinc-800">Edit</Button>
                                                            <Button variant="ghost" size="sm" onClick={() => toggleStatusMutation.mutate(coach.id)} className={coach.isActive ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-green-400 hover:text-green-300 hover:bg-green-500/10"}>
                                                                {coach.isActive ? "Disable" : "Enable"}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : <div className="p-8 text-center text-zinc-500 font-medium">No trainers registered.</div>}
                                </div>
                            </div>
                        </div>

                        {/* MEMBERS */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-white">Members Directory</h2>
                            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
                                <div className="w-full overflow-x-auto">
                                    {isMembersLoading ? (
                                        <div className="p-8 text-center text-zinc-500 animate-pulse">Loading members...</div>
                                    ) : members && members.length > 0 ? (
                                        <Table className="w-full border-collapse">
                                            <TableHeader className="bg-zinc-900/60 border-b border-white/5">
                                                <TableRow className="border-none hover:bg-transparent">
                                                    <TableHead className="w-[30%] font-bold text-zinc-400">Name</TableHead>
                                                    <TableHead className="w-[35%] font-bold text-zinc-400">Email</TableHead>
                                                    <TableHead className="w-[15%] font-bold text-zinc-400">Status</TableHead>
                                                    <TableHead className="w-[20%] text-right font-bold text-zinc-400">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {members.map((member) => (
                                                    <TableRow key={member.id} className={`border-b border-white/5 transition-colors ${!member.isActive ? "bg-zinc-950/50 opacity-60" : "hover:bg-zinc-900/60"}`}>
                                                        <TableCell className="font-semibold text-white">{member.firstName} {member.lastName}</TableCell>
                                                        <TableCell className="text-zinc-400 text-sm">{member.email}</TableCell>
                                                        <TableCell>
                                                            {member.isActive ? (
                                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                                                            ) : (
                                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">Banned</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <Button variant="ghost" size="sm" onClick={() => handleOpenEditUser(member)} className="text-zinc-300 hover:text-white hover:bg-zinc-800">Edit</Button>
                                                            <Button variant="ghost" size="sm" onClick={() => toggleStatusMutation.mutate(member.id)} className={member.isActive ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-green-400 hover:text-green-300 hover:bg-green-500/10"}>
                                                                {member.isActive ? "Ban" : "Unban"}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : <div className="p-8 text-center text-zinc-500 font-medium">No members registered yet.</div>}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ROOMS TAB */}
                    <TabsContent value="rooms" className="w-full focus:outline-none space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Facility Rooms</h2>
                                <p className="text-sm text-zinc-400 mt-1">Manage the physical locations inside your gym.</p>
                            </div>
                            <Button
                                onClick={handleOpenCreateModal}
                                className="bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white border-none shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all font-bold w-full sm:w-auto"
                            >
                                + Add New Room
                            </Button>
                        </div>

                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
                            <div className="w-full overflow-x-auto">
                                {isRoomsLoading ? (
                                    <div className="p-8 text-center text-zinc-500 animate-pulse">Loading rooms...</div>
                                ) : rooms && rooms.length > 0 ? (
                                    <Table className="w-full border-collapse">
                                        <TableHeader className="bg-zinc-900/60 border-b border-white/5">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="font-bold text-zinc-400">Room Name</TableHead>
                                                <TableHead className="font-bold text-zinc-400">Capacity</TableHead>
                                                <TableHead className="font-bold text-zinc-400">Access Level</TableHead>
                                                <TableHead className="text-right font-bold text-zinc-400">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rooms.map((room) => (
                                                <TableRow key={room.id} className="border-b border-white/5 hover:bg-zinc-900/60 transition-colors">
                                                    <TableCell className="font-semibold text-white flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-md overflow-hidden bg-zinc-800 shrink-0 border border-white/5">
                                                            {room.imageUrl ? <img src={room.imageUrl} alt="room" className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-2 text-zinc-600" />}
                                                        </div>
                                                        {room.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-800 text-zinc-300 border border-white/5">{room.maxCapacity} people</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {room.requiredTierName ? (
                                                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">{room.requiredTierName} Only</span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-white/5">All Members</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-2">
                                                        <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(room)} className="text-zinc-300 hover:text-white hover:bg-zinc-800">Edit</Button>

                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">Delete</Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="bg-zinc-950 border border-white/10 text-white">
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Facility Room</AlertDialogTitle>
                                                                    <AlertDialogDescription className="text-zinc-400">
                                                                        Are you sure you want to delete <strong className="text-white">{room.name}</strong>? This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel className="bg-zinc-900 text-white hover:bg-zinc-800 border-white/10">Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => deleteRoomMutation.mutate(room.id)}
                                                                        className="bg-red-600 hover:bg-red-700 text-white border-none"
                                                                    >
                                                                        Yes, delete room
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="p-8 text-center text-zinc-500 font-medium">No rooms configured yet. Add your first room!</div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* SCHEDULE TAB */}
                    <TabsContent value="schedule" className="w-full focus:outline-none space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Group Classes Schedule</h2>
                                <p className="text-sm text-zinc-400 mt-1">Organize sessions, assign coaches and manage capacity.</p>
                            </div>
                            <Button
                                onClick={() => setIsClassModalOpen(true)}
                                className="bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 bg-[length:200%_auto] hover:bg-[position:right_center] text-white border-none shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all font-bold w-full sm:w-auto"
                            >
                                + Schedule Class
                            </Button>
                        </div>

                        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
                            <div className="w-full overflow-x-auto">
                                {isClassesLoading ? (
                                    <div className="p-8 text-center text-zinc-500 animate-pulse">Loading schedule...</div>
                                ) : adminClasses && adminClasses.length > 0 ? (
                                    <Table className="w-full border-collapse">
                                        <TableHeader className="bg-zinc-900/60 border-b border-white/5">
                                            <TableRow className="border-none hover:bg-transparent">
                                                <TableHead className="font-bold text-zinc-400">Class Name</TableHead>
                                                <TableHead className="font-bold text-zinc-400">Time</TableHead>
                                                <TableHead className="font-bold text-zinc-400">Coach & Room</TableHead>
                                                <TableHead className="font-bold text-zinc-400 text-center">Enrollment</TableHead>
                                                <TableHead className="text-right font-bold text-zinc-400">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {adminClasses.map((cls) => {
                                                const room = rooms?.find(r => r.name === cls.roomName);
                                                const imageUrl = cls.imageUrl || room?.imageUrl;
                                                return (
                                                    <TableRow key={cls.id} className={`border-b border-white/5 transition-colors ${cls.isCancelled ? "bg-zinc-950/50 opacity-50" : "hover:bg-zinc-900/60"}`}>
                                                        <TableCell className="font-semibold text-white flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-md overflow-hidden bg-zinc-800 shrink-0 border border-white/5">
                                                                {imageUrl ? <img src={imageUrl} alt="class" className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-2 text-zinc-600" />}
                                                            </div>
                                                            {cls.name} {cls.isCancelled && <span className="text-red-500 text-[10px] ml-2 font-black tracking-wider uppercase">Cancelled</span>}
                                                        </TableCell>
                                                        <TableCell className="text-zinc-400 text-xs font-medium">
                                                            {new Date(cls.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} -
                                                            {new Date(cls.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-white/5">{cls.coachName} • {cls.roomName}</span>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="inline-flex items-center justify-center gap-2">
                                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                                    {cls.currentBookings} / {cls.maxAttendees}
                                                                </span>
                                                                {cls.waitlistCount > 0 && (
                                                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)] whitespace-nowrap">
                                                                        + {cls.waitlistCount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {!cls.isCancelled && (
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">Cancel</Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent className="bg-zinc-950 border border-white/10 text-white">
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Cancel Class</AlertDialogTitle>
                                                                            <AlertDialogDescription className="text-zinc-400">
                                                                                Are you sure you want to cancel this session? Enrolled members will silently lose it from their schedule.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel className="bg-zinc-900 text-white hover:bg-zinc-800 border-white/10">Keep it</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => deleteClassMutation.mutate(cls.id)} className="bg-red-600 hover:bg-red-700 text-white border-none">
                                                                                Yes, cancel class
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="p-8 text-center text-zinc-500 font-medium">No classes scheduled yet. Create your first session!</div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
            
            {/* ROOM MODAL */}
            <Dialog open={isRoomModalOpen} onOpenChange={setIsRoomModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-zinc-950 border border-white/10 text-zinc-100 max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <DialogHeader>
                        <DialogTitle className="text-white">{editingRoomId ? "Edit Room" : "Create New Room"}</DialogTitle>
                        <DialogDescription className="text-zinc-400">Define the physical space, capacity, and set a visual background.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveRoom} className="space-y-4 mt-4">
                        <div className="space-y-3">
                            <Label className="text-zinc-300">Select Room Background Image</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {PRESET_FACILITY_IMAGES.map((url, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setRoomImageUrl(url)}
                                        className={`h-16 rounded-md cursor-pointer overflow-hidden border-2 transition-all ${roomImageUrl === url ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                    >
                                        <img src={url} alt={`preset-${idx}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2"><Label className="text-zinc-300">Room Name</Label><Input value={roomName} onChange={(e) => setRoomName(e.target.value)} required className="bg-zinc-900 border-white/10 text-white" /></div>

                        <div className="space-y-2">
                            <Label className="text-zinc-300">Room Description</Label>
                            <textarea className="flex w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 min-h-[80px]" placeholder="Short description of the facility..." value={roomDescription} onChange={(e) => setRoomDescription(e.target.value)} />
                        </div>

                        <div className="space-y-2"><Label className="text-zinc-300">Max Capacity</Label><Input type="number" min="1" max="500" value={roomCapacity} onChange={(e) => setRoomCapacity(e.target.value)} required className="bg-zinc-900 border-white/10 text-white" /></div>
                        <div className="space-y-2 flex flex-col">
                            <Label className="text-zinc-300">Access Restriction (Tier)</Label>
                            <select value={requiredTierId} onChange={(e) => setRequiredTierId(e.target.value)} className="flex h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                                <option value="none">No Restriction (All Members)</option>
                                {tiers?.map(tier => <option key={tier.id} value={tier.id}>Requires {tier.name} Tier or higher</option>)}
                            </select>
                        </div>
                        <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold border-none" disabled={saveRoomMutation.isPending}>
                            {saveRoomMutation.isPending ? "Saving..." : "Save Facility"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* COACH MODAL */}
            <Dialog open={isCoachModalOpen} onOpenChange={setIsCoachModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-zinc-950 border border-white/10 text-zinc-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <DialogHeader>
                        <DialogTitle className="text-white">Add Employee</DialogTitle>
                        <DialogDescription className="text-zinc-400">Register a new trainer. They will use this email and password to log in.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateCoach} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-zinc-300">First Name</Label>
                                <Input id="firstName" value={coachFirstName} onChange={(e) => setCoachFirstName(e.target.value)} required className="bg-zinc-900 border-white/10 text-white focus-visible:ring-orange-500" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-zinc-300">Last Name</Label>
                                <Input id="lastName" value={coachLastName} onChange={(e) => setCoachLastName(e.target.value)} required className="bg-zinc-900 border-white/10 text-white focus-visible:ring-orange-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
                            <Input id="email" type="email" value={coachEmail} onChange={(e) => setCoachEmail(e.target.value)} required className="bg-zinc-900 border-white/10 text-white focus-visible:ring-orange-500" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-zinc-300">Temporary Password</Label>
                            <Input id="password" type="password" value={coachPassword} onChange={(e) => setCoachPassword(e.target.value)} required className="bg-zinc-900 border-white/10 text-white focus-visible:ring-orange-500" />
                        </div>

                        <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold border-none mt-2" disabled={createCoachMutation.isPending}>
                            {createCoachMutation.isPending ? "Creating..." : "Create Trainer Profile"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* EDIT USER MODAL */}
            <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
                <DialogContent className="sm:max-w-[425px] bg-zinc-950 border border-white/10 text-zinc-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <DialogHeader>
                        <DialogTitle className="text-white">Edit User Profile</DialogTitle>
                        <DialogDescription className="text-zinc-400">Update profile details. Fill out the password field only if you want to force a reset.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); updateUserMutation.mutate(); }} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300">First Name</Label>
                                <Input value={editFirstName} onChange={e => setEditFirstName(e.target.value)} required className="bg-zinc-900 border-white/10 text-white focus-visible:ring-orange-500" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300">Last Name</Label>
                                <Input value={editLastName} onChange={e => setEditLastName(e.target.value)} required className="bg-zinc-900 border-white/10 text-white focus-visible:ring-orange-500" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-300">Email Address</Label>
                            <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required className="bg-zinc-900 border-white/10 text-white focus-visible:ring-orange-500" />
                        </div>

                        <div className="space-y-2 bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                            <Label className="text-zinc-300 font-semibold">Force Password Reset (Optional)</Label>
                            <Input
                                type="password"
                                placeholder="Enter new password..."
                                value={editPassword}
                                onChange={e => setEditPassword(e.target.value)}
                                className="bg-zinc-950 border-white/10 text-white placeholder:text-zinc-600 mt-2 focus-visible:ring-orange-500"
                            />
                            <p className="text-[10px] text-zinc-500 mt-2 leading-tight">Leave blank to keep the user's current password unchanged.</p>
                        </div>

                        <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold border-none mt-2" disabled={updateUserMutation.isPending}>
                            {updateUserMutation.isPending ? "Saving..." : "Save Profile Changes"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* CLASS MODAL */}
            <Dialog open={isClassModalOpen} onOpenChange={setIsClassModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-zinc-950 border border-white/10 text-zinc-100 max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <DialogHeader>
                        <DialogTitle className="text-white">Schedule Group Class</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Assign a coach and a room.<br />
                            <strong className="text-orange-400">The cover image will be automatically inherited from the room.</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        createClassMutation.mutate();
                    }} className="space-y-4 mt-4">
                        <div className="space-y-2"><Label className="text-zinc-300">Class Title</Label><Input value={className} onChange={e => setClassName(e.target.value)} required placeholder="e.g. Yoga Flow" className="bg-zinc-900 border-white/10 text-white" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 flex flex-col"><Label className="text-zinc-300">Coach</Label>
                                <select required value={classCoachId} onChange={e => setClassCoachId(e.target.value)} className="flex h-10 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white">
                                    <option value="" disabled>Select Coach</option>{systemCoaches?.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2 flex flex-col"><Label className="text-zinc-300">Room</Label>
                                <select required value={classRoomId} onChange={e => setClassRoomId(e.target.value)} className="flex h-10 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white">
                                    <option value="" disabled>Select Room</option>{rooms?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="text-zinc-300">Start Time</Label><Input type="datetime-local" value={classStartTime} onChange={e => setClassStartTime(e.target.value)} required className="bg-zinc-900 border-white/10 text-white [color-scheme:dark]" /></div>
                            <div className="space-y-2"><Label className="text-zinc-300">End Time</Label><Input type="datetime-local" value={classEndTime} onChange={e => setClassEndTime(e.target.value)} required className="bg-zinc-900 border-white/10 text-white [color-scheme:dark]" /></div>
                        </div>
                        <div className="space-y-2"><Label className="text-zinc-300">Attendees Limit</Label><Input type="number" min="1" value={classMaxAttendees} onChange={e => setClassMaxAttendees(e.target.value)} required className="bg-zinc-900 border-white/10 text-white" /></div>

                        <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold border-none mt-2" disabled={createClassMutation.isPending}>
                            {createClassMutation.isPending ? "Scheduling..." : "Add to Calendar"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* BROADCAST MODAL */}
            <Dialog open={isBroadcastModalOpen} onOpenChange={setIsBroadcastModalOpen}>
                <DialogContent className="sm:max-w-[500px] bg-zinc-950 border border-amber-500/20 text-zinc-100 shadow-[0_0_50px_rgba(245,158,11,0.1)]">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Megaphone className="text-amber-500" size={20} />
                            Send Global Announcement
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            This message will be pushed to the personal inbox of <strong className="text-amber-500">all active Members and Trainers</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSendBroadcast} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="broadcastTitle" className="text-zinc-300">Message Title</Label>
                            <Input
                                id="broadcastTitle"
                                value={broadcastTitle}
                                onChange={(e) => setBroadcastTitle(e.target.value)}
                                required
                                maxLength={100}
                                placeholder="e.g. Holiday Opening Hours"
                                className="bg-zinc-900 border-white/10 text-white focus-visible:ring-amber-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="broadcastMessage" className="text-zinc-300">Message Content</Label>
                            <textarea
                                id="broadcastMessage"
                                className="flex w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 min-h-[120px]"
                                placeholder="Write your announcement here..."
                                value={broadcastMessage}
                                onChange={(e) => setBroadcastMessage(e.target.value)}
                                required
                                maxLength={1000}
                            />
                            <div className="text-right text-[10px] text-zinc-500">
                                {broadcastMessage.length} / 1000 characters
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold border-none mt-2"
                            disabled={broadcastMutation.isPending}
                        >
                            {broadcastMutation.isPending ? "Sending..." : "Send Announcement"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}