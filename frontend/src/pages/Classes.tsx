import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface GroupClass {
    id: string
    name: string
    startTime: string
    endTime: string
    maxAttendees: number
    currentBookings: number
}

interface Reservation {
    reservationId: string
    targetId: string 
    type: string
}

export default function Classes() {
    const queryClient = useQueryClient()

    // Fetch available classes
    const { data: classes, isLoading } = useQuery<GroupClass[]>({
        queryKey: ['classes'],
        queryFn: async () => {
            const response = await api.get('/api/bookings/classes')
            return response.data
        }
    })
    
    // Fetch user reservations to check if already booked
    const { data: reservations } = useQuery<Reservation[]>({
        queryKey: ['my-reservations'],
        queryFn: async () => {
            const response = await api.get('/api/bookings/my-reservations')
            return response.data
        }
    })

    // Book a class mutation
    const bookMutation = useMutation({
        mutationFn: async (classId: string) => {
            const response = await api.post(`/api/bookings/classes/${classId}`)
            return response.data
        },
        onSuccess: async (data) => {
            toast.success("Success!", {
                description: data.Message || "You have successfully booked the class."
            })
            // Update the classes list (to refresh seat count) and user reservations
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['classes'] }),
                queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
            ])
        },
        onError: (error: any) => {
            // We dump the whole thing into the console for us
            console.error("Booking error:", error.response?.data || error.message)

            // Short information for the customer
            toast.error("Booking Failed", {
                description: "Could not book this class. Make sure you have an active subscription."
            })
        }
    })

    // Helper functions for date formatting
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900">Class Schedule</h1>
                        <p className="text-slate-600 mt-1">Book your spot for upcoming group workouts.</p>
                    </div>
                    <Link to="/">
                        <Button variant="outline">Home</Button>
                    </Link>
                </div>

                {/* Classes Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-[200px] bg-slate-200 rounded-xl"></div>
                        ))}
                    </div>
                ) : classes && classes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {classes.map((cls) => {
                            const isFull = cls.currentBookings >= cls.maxAttendees
                            const spotsLeft = cls.maxAttendees - cls.currentBookings

                            // We check the targetId and make sure it's a "Group" booking
                            const isBooked = reservations?.some(r => r.targetId === cls.id && r.type === "Group")
                            
                            return (
                                <Card key={cls.id} className={`flex flex-col shadow-sm border-slate-200 ${isFull ? 'opacity-75' : ''}`}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-xl font-bold text-slate-800">{cls.name}</CardTitle>
                                                <CardDescription className="capitalize text-primary font-medium mt-1">
                                                    {formatDate(cls.startTime)}
                                                </CardDescription>
                                            </div>
                                            {isFull ? (
                                                <Badge variant="destructive">Fully Booked</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                                    {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                                                </Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <div className="flex items-center text-slate-600 bg-slate-100 p-3 rounded-md w-fit">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                            <span className="font-semibold">{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full"
                                            onClick={() => bookMutation.mutate(cls.id)}
                                            disabled={isFull || isBooked || bookMutation.isPending}
                                            variant={isBooked ? "secondary" : (isFull ? "outline" : "default")}
                                        >
                                            {bookMutation.isPending
                                                ? "Processing..."
                                                : isBooked
                                                    ? "Already Booked"
                                                    : isFull
                                                        ? "Waitlist (Coming Soon)"
                                                        : "Book Class"}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
                        <h3 className="text-xl font-bold text-slate-700">No upcoming classes</h3>
                        <p className="text-slate-500 mt-2">Our coaches are preparing the schedule. Check back later!</p>
                    </div>
                )}
            </div>
        </div>
    )
}