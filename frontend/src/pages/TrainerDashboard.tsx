import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import * as React from "react";

// Represents a group class assigned to the coach
interface AgendaClass {
    id: string
    name: string
    startTime: string
    endTime: string
    attendeesCount: number
}

// Represents a 1:1 training slot created by the coach
interface AgendaSlot {
    id: string
    startTime: string
    endTime: string
    status: string
}

// The unified DTO received from the backend containing both classes and 1:1 slots
interface CoachAgenda {
    assignedClasses: AgendaClass[]
    trainerSlots: AgendaSlot[]
}

export default function TrainerDashboard() {
    const { user, logout } = useAuth()
    const queryClient = useQueryClient()

    // We only need to track the start time, as slots are fixed at 1-hour duration
    const [startTime, setStartTime] = useState("")

    // Fetch the complete agenda (both assigned classes and personal slots) for the logged-in coach
    const { data: agenda, isLoading } = useQuery<CoachAgenda>({
        queryKey: ['coach-agenda'],
        queryFn: async () => {
            const response = await api.get('/api/coaches/agenda')
            return response.data
        }
    })

    // Mutation to add a new 1:1 availability slot
    const addSlotMutation = useMutation({
        mutationFn: async (payload: { startTime: string, endTime: string }) => {
            const response = await api.post('/api/coaches/slots', payload)
            return response.data
        },
        onSuccess: async () => {
            toast.success("Slot added", { description: "Your availability has been updated." })
            setStartTime("")
            // Automatically refresh the agenda data to show the new slot without a page reload
            await queryClient.invalidateQueries({ queryKey: ['coach-agenda'] })
        },
        onError: (error: any) => {
            console.error(error)
            toast.error("Failed to add slot", {
                description: "This time slot is already taken or invalid. Please check your agenda."
            })
        }
    })

    // Handles the form submission to create a new slot
    const handleAddSlot = (e: React.SyntheticEvent) => {
        e.preventDefault()
        if (!startTime) return

        // Convert the input string to a Date object for manipulation
        const startObj = new Date(startTime)

        // Calculate the end time by adding exactly 1 hour (in milliseconds)
        const endObj = new Date(startObj.getTime() + 60 * 60 * 1000)

        // Convert back to ISO string to ensure compatibility with PostgreSQL's strict timestamp requirements
        addSlotMutation.mutate({
            startTime: startObj.toISOString(),
            endTime: endObj.toISOString()
        })
    }

    // Mutation to cancel an existing 1:1 availability slot
    const cancelSlotMutation = useMutation({
        mutationFn: async (slotId: string) => {
            const response = await api.delete(`/api/coaches/slots/${slotId}`)
            return response.data
        },
        onSuccess: async () => {
            toast.success("Slot Cancelled", { description: "You have cancelled this time slot." })
            // Refresh the agenda data to reflect the cancellation
            await queryClient.invalidateQueries({ queryKey: ['coach-agenda'] })
        },
        onError: (error: any) => {
            console.error(error)
            toast.error("Failed to cancel slot", { description: "Could not cancel this slot." })
        }
    })

    // Utility function for consistent date formatting across the dashboard
    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString([], {
            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900">Trainer Portal</h1>
                        <p className="text-slate-600 mt-1">Welcome to your workspace, {user?.firstName}!</p>
                    </div>
                    <Button variant="outline" onClick={logout}>Log out</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Create Slot Form */}
                    <Card className="md:col-span-1 shadow-sm h-fit">
                        <CardHeader>
                            <CardTitle>Add Availability</CardTitle>
                            <CardDescription>Open a slot for 1:1 training</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddSlot} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start">Start Time (1-hour slot)</Label>
                                    <Input
                                        id="start"
                                        type="datetime-local"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={addSlotMutation.isPending}>
                                    {addSlotMutation.isPending ? "Adding..." : "Add 1-Hour Slot"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Agenda Lists */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Group Classes (Read Only) */}
                        <Card className="shadow-sm border-blue-100">
                            <CardHeader className="bg-blue-50/50 pb-4">
                                <CardTitle className="text-blue-900">Assigned Group Classes</CardTitle>
                                <CardDescription>Classes you are leading</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {isLoading ? <p>Loading agenda...</p> : agenda?.assignedClasses.length ? (
                                    <ul className="space-y-3">
                                        {agenda.assignedClasses.map(cls => (
                                            <li key={cls.id} className="flex justify-between items-center p-3 bg-white border rounded-lg">
                                                <div>
                                                    <p className="font-bold">{cls.name}</p>
                                                    <p className="text-sm text-slate-500">{formatDateTime(cls.startTime)} - {formatDateTime(cls.endTime)}</p>
                                                </div>
                                                <Badge variant="secondary">{cls.attendeesCount} enrolled</Badge>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-slate-500 text-sm">No upcoming classes assigned.</p>}
                            </CardContent>
                        </Card>

                        {/* 1:1 Trainer Slots */}
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle>My 1:1 Slots</CardTitle>
                                <CardDescription>Your personal training schedule</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? <p>Loading slots...</p> : agenda?.trainerSlots.length ? (
                                    <ul className="space-y-3">
                                        {agenda.trainerSlots.map(slot => (
                                            <li key={slot.id} className="flex justify-between items-center p-3 bg-white border rounded-lg">
                                                <div>
                                                    <p className="font-semibold text-slate-700">1:1 Session</p>
                                                    <p className="text-sm text-slate-500">{formatDateTime(slot.startTime)} - {formatDateTime(slot.endTime)}</p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <Badge variant={slot.status === "Available" ? "outline" : "default"} className={slot.status === "Available" ? "text-green-600 border-green-200" : ""}>
                                                        {slot.status}
                                                    </Badge>

                                                    {/* Cancel button for Trainer (Only shown if the slot is still active) */}
                                                    {slot.status !== "Cancelled" && slot.status !== "Completed" && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">Cancel</Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Cancel Work Slot</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to cancel this availability? If a client has already booked it, their reservation will also be cancelled.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Keep it</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => cancelSlotMutation.mutate(slot.id)}
                                                                        className="bg-destructive"
                                                                        disabled={cancelSlotMutation.isPending}
                                                                    >
                                                                        {cancelSlotMutation.isPending ? "Cancelling..." : "Yes, cancel slot"}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-slate-500 text-sm">You haven't opened any slots yet.</p>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}