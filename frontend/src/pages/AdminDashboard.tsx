import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

interface Room {
    id: string
    name: string
    maxCapacity: number
    requiredTierId?: string | null
    requiredTierName?: string | null
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

export default function AdminDashboard() {
    const { logout } = useAuth()
    const queryClient = useQueryClient()

    // Room states
    const [isRoomModalOpen, setIsRoomModalOpen] = React.useState(false)
    const [editingRoomId, setEditingRoomId] = React.useState<string | null>(null)
    const [roomName, setRoomName] = React.useState("")
    const [roomCapacity, setRoomCapacity] = React.useState("")
    const [requiredTierId, setRequiredTierId] = React.useState<string>("none")

    // Create coach states
    const [isCoachModalOpen, setIsCoachModalOpen] = React.useState(false)
    const [coachEmail, setCoachEmail] = React.useState("")
    const [coachFirstName, setCoachFirstName] = React.useState("")
    const [coachLastName, setCoachLastName] = React.useState("")
    const [coachPassword, setCoachPassword] = React.useState("")

    // Edit user states
    const [isEditUserModalOpen, setIsEditUserModalOpen] = React.useState(false)
    const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null)
    const [editFirstName, setEditFirstName] = React.useState("")
    const [editLastName, setEditLastName] = React.useState("")
    const [editEmail, setEditEmail] = React.useState("")
    const [editPassword, setEditPassword] = React.useState("")

    // Queries
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

    // Room mutations
    const saveRoomMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                name: roomName,
                maxCapacity: parseInt(roomCapacity),
                requiredTierId: requiredTierId === "none" ? null : requiredTierId
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

    // User mutations
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
                newPassword: editPassword || null // Send null if empty
            })
        },
        onSuccess: async () => {
            toast.success("User Profile Updated", { description: "Changes and credentials updated successfully." })
            setIsEditUserModalOpen(false)
            setEditPassword("") // Clear password field
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

    // Handlers
    const handleOpenCreateModal = () => {
        resetRoomForm()
        setIsRoomModalOpen(true)
    }

    const handleOpenEditModal = (room: Room) => {
        setEditingRoomId(room.id)
        setRoomName(room.name)
        setRoomCapacity(room.maxCapacity ? room.maxCapacity.toString() : "")
        setRequiredTierId(room.requiredTierId || "none")
        setIsRoomModalOpen(true)
    }

    const resetRoomForm = () => {
        setEditingRoomId(null)
        setRoomName("")
        setRoomCapacity("")
        setRequiredTierId("none")
    }

    const handleSaveRoom = (e: React.SyntheticEvent) => {
        e.preventDefault()
        saveRoomMutation.mutate()
    }

    const handleCreateCoach = (e: React.SyntheticEvent) => {
        e.preventDefault()
        createCoachMutation.mutate()
    }

    // Unified handler for opening the Edit User modal
    const handleOpenEditUser = (user: SystemUser) => {
        setSelectedUserId(user.id)
        setEditFirstName(user.firstName)
        setEditLastName(user.lastName)
        setEditEmail(user.email)
        setEditPassword("") // Ensure password field is reset when opening
        setIsEditUserModalOpen(true)
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 w-full">
            <div className="max-w-6xl mx-auto space-y-8 w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900">Admin Command Center</h1>
                        <p className="text-slate-600 mt-1">Manage infrastructure, schedule, and users.</p>
                    </div>
                    <Button variant="outline" onClick={logout} className="border-slate-300 text-slate-700">Log out</Button>
                </div>

                <Tabs defaultValue="rooms" className="w-full flex flex-col gap-6">
                    <TabsList className="flex flex-col sm:flex-row w-full h-auto bg-slate-200/60 rounded-xl p-1 gap-1">
                        <TabsTrigger value="statistics" className="flex-1 text-base font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-3">Statistics</TabsTrigger>
                        <TabsTrigger value="users" className="flex-1 text-base font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-3">Users</TabsTrigger>
                        <TabsTrigger value="rooms" className="flex-1 text-base font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-3">Rooms</TabsTrigger>
                        <TabsTrigger value="schedule" className="flex-1 text-base font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm py-3">Schedule</TabsTrigger>
                    </TabsList>

                    {/* Statistics */}
                    <TabsContent value="statistics" className="w-full focus:outline-none">
                        <Card className="w-full"><CardHeader><CardTitle>Statistics</CardTitle></CardHeader><CardContent>Coming soon...</CardContent></Card>
                    </TabsContent>

                    {/* Users */}
                    <TabsContent value="users" className="w-full focus:outline-none space-y-8">
                        {/* Tab 1: Coaches */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Gym Trainers</h2>
                                </div>
                                <Button onClick={() => setIsCoachModalOpen(true)} className="bg-primary text-white">
                                    + Add Employee
                                </Button>
                            </div>
                            <Card className="shadow-sm border-slate-200 w-full overflow-hidden">
                                <CardContent className="p-0 w-full overflow-x-auto">
                                    {isCoachesLoading ? (
                                        <div className="p-8 text-center text-slate-500 animate-pulse">Loading staff...</div>
                                    ) : systemCoaches && systemCoaches.length > 0 ? (
                                        <Table className="w-full">
                                            <TableHeader className="bg-slate-100">
                                                <TableRow>
                                                    <TableHead className="font-semibold text-slate-700">Name</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Email</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {systemCoaches.map((coach) => (
                                                    <TableRow key={coach.id} className={!coach.isActive ? "bg-slate-50 opacity-60" : ""}>
                                                        <TableCell className="font-medium text-slate-900">{coach.firstName} {coach.lastName}</TableCell>
                                                        <TableCell className="text-slate-500">{coach.email}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={coach.isActive ? "outline" : "destructive"} className={coach.isActive ? "text-green-600 border-green-200" : ""}>
                                                                {coach.isActive ? "Active" : "Disabled"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            {/* Unified Edit Button */}
                                                            <Button variant="outline" size="sm" onClick={() => handleOpenEditUser(coach)}>Edit</Button>
                                                            <Button variant={coach.isActive ? "destructive" : "default"} size="sm" onClick={() => toggleStatusMutation.mutate(coach.id)}>
                                                                {coach.isActive ? "Disable" : "Enable"}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : <div className="p-8 text-center text-slate-500">No trainers registered.</div>}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tab 2: Clients */}
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Members</h2>
                                </div>
                            </div>
                            <Card className="shadow-sm border-slate-200 w-full overflow-hidden">
                                <CardContent className="p-0 w-full overflow-x-auto">
                                    {isMembersLoading ? (
                                        <div className="p-8 text-center text-slate-500 animate-pulse">Loading members...</div>
                                    ) : members && members.length > 0 ? (
                                        <Table className="w-full">
                                            <TableHeader className="bg-slate-100">
                                                <TableRow>
                                                    <TableHead className="font-semibold text-slate-700">Name</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Email</TableHead>
                                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {members.map((member) => (
                                                    <TableRow key={member.id} className={!member.isActive ? "bg-slate-50 opacity-60" : ""}>
                                                        <TableCell className="font-medium text-slate-900">{member.firstName} {member.lastName}</TableCell>
                                                        <TableCell className="text-slate-500">{member.email}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={member.isActive ? "outline" : "destructive"} className={member.isActive ? "text-green-600 border-green-200" : ""}>
                                                                {member.isActive ? "Active" : "Banned"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            {/* Unified Edit Button */}
                                                            <Button variant="outline" size="sm" onClick={() => handleOpenEditUser(member)}>Edit</Button>
                                                            <Button variant={member.isActive ? "destructive" : "default"} size="sm" onClick={() => toggleStatusMutation.mutate(member.id)}>
                                                                {member.isActive ? "Ban" : "Unban"}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : <div className="p-8 text-center text-slate-500">No members registered yet.</div>}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Rooms */}
                    <TabsContent value="rooms" className="w-full focus:outline-none space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">Facility Rooms</h2>
                                <p className="text-sm text-slate-500">Manage the physical locations inside your gym.</p>
                            </div>
                            <Button onClick={handleOpenCreateModal} className="bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto">
                                + Add New Room
                            </Button>
                        </div>

                        <Card className="shadow-sm border-slate-200 w-full overflow-hidden">
                            <CardContent className="p-0 w-full overflow-x-auto">
                                {isRoomsLoading ? (
                                    <div className="p-8 text-center text-slate-500 animate-pulse">Loading rooms...</div>
                                ) : rooms && rooms.length > 0 ? (
                                    <Table className="w-full">
                                        <TableHeader className="bg-slate-100">
                                            <TableRow>
                                                <TableHead className="font-semibold text-slate-700">Room Name</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Capacity</TableHead>
                                                <TableHead className="font-semibold text-slate-700">Access Level</TableHead>
                                                <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rooms.map((room) => (
                                                <TableRow key={room.id}>
                                                    <TableCell className="font-medium text-slate-900">{room.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{room.maxCapacity} people</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {room.requiredTierName ? (
                                                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none">{room.requiredTierName} Only</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-slate-500">All Members</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right space-x-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(room)}>Edit</Button>

                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="destructive" size="sm">Delete</Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Facility Room</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete <strong>{room.name}</strong>? This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => deleteRoomMutation.mutate(room.id)}
                                                                        className="bg-destructive hover:bg-destructive/90"
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
                                    <div className="p-8 text-center text-slate-500">No rooms configured yet. Add your first room!</div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Schedule */}
                    <TabsContent value="schedule" className="w-full focus:outline-none">
                        <Card className="w-full"><CardHeader><CardTitle>Schedule</CardTitle></CardHeader><CardContent>Coming soon...</CardContent></Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Room Modal */}
            <Dialog open={isRoomModalOpen} onOpenChange={setIsRoomModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingRoomId ? "Edit Room" : "Create New Room"}</DialogTitle>
                        <DialogDescription>Define the physical space, capacity, and access restrictions.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveRoom} className="space-y-5 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Room Name</Label>
                            <Input id="name" value={roomName} onChange={(e) => setRoomName(e.target.value)} required placeholder="e.g. Crossfit Arena" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="capacity">Max Capacity</Label>
                            <Input id="capacity" type="number" min="1" max="500" value={roomCapacity} onChange={(e) => setRoomCapacity(e.target.value)} required />
                        </div>

                        <div className="space-y-2 flex flex-col">
                            <Label htmlFor="tier">Access Restriction (Tier)</Label>
                            <select
                                id="tier"
                                value={requiredTierId}
                                onChange={(e) => setRequiredTierId(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                            >
                                <option value="none">No Restriction (All Members)</option>
                                {tiers?.map(tier => (
                                    <option key={tier.id} value={tier.id}>Requires {tier.name} Tier or higher</option>
                                ))}
                            </select>
                            <p className="text-xs text-slate-500">Only members with this tier will be able to book classes here.</p>
                        </div>

                        <Button type="submit" className="w-full" disabled={saveRoomMutation.isPending}>
                            {saveRoomMutation.isPending ? "Saving..." : "Save Facility"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Coach Modal */}
            <Dialog open={isCoachModalOpen} onOpenChange={setIsCoachModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add Employee</DialogTitle>
                        <DialogDescription>Register a new trainer. They will use this email and password to log in.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateCoach} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" value={coachFirstName} onChange={(e) => setCoachFirstName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" value={coachLastName} onChange={(e) => setCoachLastName(e.target.value)} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={coachEmail} onChange={(e) => setCoachEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Temporary Password</Label>
                            <Input id="password" type="password" value={coachPassword} onChange={(e) => setCoachPassword(e.target.value)} required />
                        </div>

                        <Button type="submit" className="w-full" disabled={createCoachMutation.isPending}>
                            {createCoachMutation.isPending ? "Creating..." : "Create Trainer Profile"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Unified Edit User Modal (Coaches & Members) */}
            <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit User Profile & Credentials</DialogTitle>
                        <DialogDescription>Update profile details. Fill out the password field only if you want to force a password reset.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); updateUserMutation.mutate(); }} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input value={editFirstName} onChange={e => setEditFirstName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input value={editLastName} onChange={e => setEditLastName(e.target.value)} required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
                        </div>

                        <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <Label className="text-slate-700 font-semibold">Force Password Reset (Optional)</Label>
                            <Input
                                type="text"
                                placeholder="Enter new password to overwrite..."
                                value={editPassword}
                                onChange={e => setEditPassword(e.target.value)}
                                className="bg-white mt-1"
                            />
                            <p className="text-[11px] text-slate-500 mt-1">Leave blank to keep the user's current password unchanged.</p>
                        </div>

                        <Button type="submit" className="w-full mt-2" disabled={updateUserMutation.isPending}>
                            {updateUserMutation.isPending ? "Saving..." : "Save Profile Changes"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}