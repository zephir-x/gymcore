import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
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

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Define the shape of data expected from the C# backend
interface Subscription {
    id: string
    tierName: string
    endDate: string
}

interface Reservation {
    reservationId: string
    className?: string
    startTime: string
}

export default function Dashboard() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    // UI State for expanding the manage subscription options
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

    // Fetch user reservations
    const { data: reservations, isLoading: isResLoading } = useQuery<Reservation[]>({
        queryKey: ['my-reservations'],
        queryFn: async () => {
            const response = await api.get('/api/bookings/my-reservations')
            return response.data
        }
    })

    // Handle cancelling the subscription
    const cancelMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/api/subscriptions/cancel')
            return response.data
        },
        onSuccess: async () => {
            toast.success("Subscription Cancelled", {
                description: "Your active subscription has been cancelled."
            })
            // Force Dashboard to refresh the subscription data immediately
            await queryClient.invalidateQueries({ queryKey: ['my-subscription'] })
            setIsManaging(false) // Close the manage menu after success
        },
        onError: (error: any) => {
            toast.error("Action Failed", {
                description: error.response?.data?.Message || "Could not cancel the subscription."
            })
        }
    })

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900">My Profile</h1>
                        <p className="text-slate-600 mt-1">Welcome back, {user?.email}!</p>
                    </div>
                    <Link to="/">
                        <Button variant="outline">Back to Menu</Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Subscription Section */}
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

                                    {/* Manage Subscription UI */}
                                    {!isManaging ? (
                                        <Button variant="outline" className="w-full" onClick={() => setIsManaging(true)}>
                                            Manage subscription
                                        </Button>
                                    ) : (
                                        <div className="flex flex-col gap-2 p-4 bg-slate-100 rounded-lg border border-slate-200">
                                            <p className="text-sm font-semibold mb-2">Options</p>
                                            <Button variant="outline" className="w-full">
                                                Upgrade Plan
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="destructive"
                                                        className="w-full"
                                                        disabled={cancelMutation.isPending}
                                                    >
                                                        {cancelMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. Your subscription will be cancelled, and you will lose access to premium benefits immediately.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Keep it</AlertDialogCancel>
                                                        { /* The mutation will only be triggered after clicking the red confirmation button */ }
                                                        <AlertDialogAction
                                                            onClick={() => cancelMutation.mutate()}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Yes, cancel it
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                            <Button variant="ghost" className="w-full text-slate-500" onClick={() => setIsManaging(false)}>
                                                Close
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-slate-100 text-slate-600 p-4 rounded-lg border border-slate-200 text-center">
                                        <p className="font-semibold">No active subscription</p>
                                        <p className="text-sm">Purchase a plan to get access to the gym.</p>
                                    </div>
                                    <Link to="/subscriptions" className="w-full">
                                        <Button className="w-full">Browse Offers</Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Upcoming Classes Section */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-2xl text-primary">My Reservations</CardTitle>
                            <CardDescription>Your upcoming workouts and booked classes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isResLoading ? (
                                <p className="text-slate-500 animate-pulse">Loading reservations...</p>
                            ) : reservations && reservations.length > 0 ? (
                                <ul className="space-y-3">
                                    {reservations.map((res) => (
                                        <li key={res.reservationId} className="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
                                            <div>
                                                <p className="font-bold">{res.className || "Personal Training"}</p>
                                                <p className="text-sm text-slate-500">
                                                    {new Date(res.startTime).toLocaleString()}
                                                </p>
                                            </div>
                                            <Button variant="destructive" size="sm">Cancel</Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-500 text-center py-6">You have no scheduled workouts.</p>
                            )}

                            <div className="mt-6">
                                {/* We will route this to /classes later */}
                                <Button variant="secondary" className="w-full">Book a class</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}