import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

interface Subscription {
    id: string
    tierName: string
    endDate: string
}

interface Reservation {
    reservationId: string
    targetId: string
    title: string
    trainerName: string
    startTime: string
    endTime: string
    status: string
    type: "Group" | "Personal"
}

export default function MemberDashboard() {
    const { user, logout } = useAuth()
    const queryClient = useQueryClient()
    const [isManaging, setIsManaging] = useState(false)

    // Fetch subscription data
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

    // Fetch unified user reservations (Group + Personal)
    const { data: reservations, isLoading: isResLoading } = useQuery<Reservation[]>({
        queryKey: ['my-reservations'],
        queryFn: async () => {
            const response = await api.get('/api/bookings/my-reservations')
            return response.data
        }
    })

    // Handle subscription cancellation
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

    // Handle cancelling a class OR personal training slot
    const cancelReservationMutation = useMutation({
        mutationFn: async (res: Reservation) => {
            if (res.type === "Group") {
                // If it's a group activity, we'll shoot for the current endpoint
                return (await api.delete(`/api/bookings/reservations/${res.reservationId}`)).data
            } else {
                // If it's an individual training session, we release the trainer slot
                return (await api.delete(`/api/bookings/reservations/${res.reservationId}`)).data
            }
        },
        onSuccess: async () => {
            toast.success("Reservation Cancelled", { description: "Your workout has been cancelled." })
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['my-reservations'] }),
                queryClient.invalidateQueries({ queryKey: ['classes'] }),
                queryClient.invalidateQueries({ queryKey: ['coach-slots'] })
            ])
        },
        onError: (error: any) => {
            console.error(error)
            toast.error("Action Failed", { description: "Could not cancel the reservation." })
        }
    })

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900">My Profile</h1>
                        <p className="text-slate-600 mt-1">Welcome back, {user?.firstName}!</p>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/">
                            <Button variant="outline">Home</Button>
                        </Link>
                        <Button variant="ghost" onClick={() => {
                            logout()
                        }}>
                            Log out
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Subscription Card */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-2xl text-primary">My Subscription</CardTitle>
                            <CardDescription>Manage your gym access and plans</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isSubLoading ? (
                                <p className="text-slate-500 animate-pulse">Loading subscription data...</p>
                            ) : subscription ? (
                                <div className="space-y-4">
                                    <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
                                        <p className="font-bold text-lg">Active: {subscription.tierName}</p>
                                        <p className="text-sm">Valid until: {new Date(subscription.endDate).toLocaleDateString()}</p>
                                    </div>

                                    {!isManaging ? (
                                        <Button variant="outline" className="w-full" onClick={() => setIsManaging(true)}>
                                            Manage subscription
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col gap-2 p-4 bg-slate-100 rounded-lg border border-slate-200">
                                            <p className="text-sm font-semibold mb-2">Options</p>
                                            
                                            <Link to="/subscriptions" className="w-full">
                                                <Button variant="outline" className="w-full">Upgrade Plan</Button>
                                            </Link>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" className="w-full">Cancel Subscription</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This action will revoke your gym benefits immediately.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Keep it</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => cancelSubscriptionMutation.mutate()} className="bg-destructive hover:bg-destructive/90">
                                                            Yes, cancel it
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>

                                            <Button variant="ghost" className="w-full text-slate-500" onClick={() => setIsManaging(false)}>Close</Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-slate-100 text-slate-600 p-4 rounded-lg border border-slate-200 text-center">
                                        <p className="font-semibold">No active subscription</p>
                                        <p className="text-sm">Purchase a plan to get access to the gym.</p>
                                    </div>
                                    <Link to="/subscriptions" className="w-full block">
                                        <Button className="w-full">Browse Offers</Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Unified Reservations Card */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-2xl text-primary">My Reservations</CardTitle>
                            <CardDescription>Your upcoming group classes and 1:1 sessions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isResLoading ? (
                                <p className="text-slate-500 animate-pulse">Loading reservations...</p>
                            ) : reservations && reservations.length > 0 ? (
                                <ul className="space-y-3">
                                    {reservations.map((res) => (
                                        <li key={res.reservationId} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-800">{res.title}</p>
                                                    <Badge variant={res.type === "Group" ? "secondary" : "default"}>
                                                        {res.type === "Group" ? "Group" : "1:1 Personal"}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium">Coach: {res.trainerName}</p>
                                                <p className="text-sm text-slate-600 font-semibold">
                                                    {new Date(res.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                </p>
                                            </div>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm">Cancel</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Cancel Workout</AlertDialogTitle>
                                                        <AlertDialogDescription>Are you sure you want to drop your spot?</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Keep it</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => cancelReservationMutation.mutate(res)} className="bg-destructive hover:bg-destructive/90">
                                                            Yes, cancel it
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-500 text-center py-6">You have no scheduled workouts.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}