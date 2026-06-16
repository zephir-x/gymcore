import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Coach {
    id: string
    firstName: string
    lastName: string
}

interface TrainerSlot {
    id: string
    startTime: string
    endTime: string
}

export default function PersonalTraining() {
    const queryClient = useQueryClient()

    // We store the ID of the selected trainer
    const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null)

    // Downloading the trainer list
    const { data: coaches, isLoading: isLoadingCoaches } = useQuery<Coach[]>({
        queryKey: ['coaches'],
        queryFn: async () => {
            const response = await api.get('/api/bookings/coaches')
            return response.data
        }
    })

    // Fetching available hours of the selected coach (only runs if selectedCoachId is not null)
    const { data: slots, isLoading: isLoadingSlots } = useQuery<TrainerSlot[]>({
        queryKey: ['coach-slots', selectedCoachId],
        queryFn: async () => {
            const response = await api.get(`/api/bookings/coaches/${selectedCoachId}/slots`)
            return response.data
        },
        enabled: !!selectedCoachId
    })

    // Slot-reserving mutation
    const bookSlotMutation = useMutation({
        mutationFn: async (slotId: string) => {
            const response = await api.post(`/api/bookings/trainer-slots/${slotId}`)
            return response.data
        },
        onSuccess: async (data) => {
            toast.success("Training Booked!", {
                description: data.Message || "You have successfully booked a 1:1 session."
            })
            // We are refreshing the list of vacancies for this coach and our calendar
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['coach-slots', selectedCoachId] }),
                queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
            ])
        },
        onError: (error: any) => {
            console.error("Detailed booking error:", error.response?.data || error.message)
            toast.error("Booking Failed", {
                description: "Could not book this slot. Make sure you have an active subscription."
            })
        }
    })

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString([], {
            weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900">Personal Training</h1>
                        <p className="text-slate-600 mt-1">Achieve your goals faster with our expert coaches.</p>
                    </div>
                    <Link to="/">
                        <Button variant="outline">Home</Button>
                    </Link>
                </div>

                {/* Coach Selection */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-800">1. Choose your Trainer</h2>
                    {isLoadingCoaches ? (
                        <p className="animate-pulse">Loading coaches...</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {coaches?.map(coach => (
                                <Card
                                    key={coach.id}
                                    className={`cursor-pointer transition-all border-2 ${selectedCoachId === coach.id ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50'}`}
                                    onClick={() => setSelectedCoachId(coach.id)}
                                >
                                    <CardHeader>
                                        <CardTitle className="text-xl">{coach.firstName} {coach.lastName}</CardTitle>
                                        <CardDescription>Expert Coach</CardDescription>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available time slots */}
                {selectedCoachId && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-2xl font-bold text-slate-800">2. Select a Time Slot</h2>
                        <Card className="shadow-sm border-slate-200">
                            <CardContent className="pt-6">
                                {isLoadingSlots ? (
                                    <p className="animate-pulse">Checking availability...</p>
                                ) : slots && slots.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {slots.map(slot => (
                                            <div key={slot.id} className="flex justify-between items-center p-4 border rounded-lg bg-white shadow-sm hover:shadow transition-shadow">
                                                <span className="font-medium text-slate-700">{formatDateTime(slot.startTime)}</span>
                                                <Button
                                                    onClick={() => bookSlotMutation.mutate(slot.id)}
                                                    disabled={bookSlotMutation.isPending}
                                                >
                                                    Book Session
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500 font-medium">This coach currently has no available slots.</p>
                                        <p className="text-sm text-slate-400">Please choose another coach or check back later.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}