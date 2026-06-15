import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

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

    // Fetch subscription data
    const { data: subscription, isLoading: isSubLoading } = useQuery<Subscription | null>({
        queryKey: ['my-subscription'],
        queryFn: async () => {
            try {
                const response = await api.get('/api/subscriptions/my-subscription')
                return response.data
            } catch (error: any) {
                // If the backend returns 404 (no active subscription), we don't treat it as an error
                // that breaks the page - we simply return null to display the correct UI state
                if (error.response?.status === 404) return null
                throw error
            }
        },
        retry: false // Do not retry if it's a 404
    })

    // Fetch user reservations
    const { data: reservations, isLoading: isResLoading } = useQuery<Reservation[]>({
        queryKey: ['my-reservations'],
        queryFn: async () => {
            const response = await api.get('/api/bookings/my-reservations')
            return response.data
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
                                    <Button variant="outline" className="w-full">Manage subscription</Button>
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