import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, Link } from "react-router-dom"
import { api } from "@/lib/api"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

// Define the shape of data expected from the C# backend
interface SubscriptionTier {
    id: string
    name: string
    monthlyPrice: number
    discountPercentage: number
}

export default function Subscriptions() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    // State to track the selected billing cycle
    const [months, setMonths] = useState<number>(1)

    // Fetch available subscription tiers
    const { data: tiers, isLoading } = useQuery<SubscriptionTier[]>({
        queryKey: ['subscription-tiers'],
        queryFn: async () => {
            const response = await api.get('/api/subscriptions/tiers')
            return response.data
        }
    })

    // Handle purchasing a subscription
    const purchaseMutation = useMutation({
        // We pass the tierId, and we take 'months' from the state
        mutationFn: async (tierId: string) => {
            const response = await api.post(`/api/subscriptions/purchase/${tierId}`, { months })
            return response.data
        },
        onSuccess: async () => {
            toast.success("Success!", {
                description: "Your subscription has been activated successfully."
            })

            await queryClient.invalidateQueries({ queryKey: ['my-subscription'] })
            navigate('/dashboard')
        },
        onError: (error: any) => {
            console.error("Purchase error:", error.response?.data || error.message)
            toast.error("Purchase Failed", {
                description: error.response?.data?.Message || "An error occurred during the transaction."
            })
        }
    })

    // Helper function to calculate the dynamic price
    const calculatePrice = (monthlyPrice: number): string => {
        if (months === 1) return monthlyPrice.toFixed(2)
        if (months === 6) return (monthlyPrice * 6 * 0.90).toFixed(2) // 10% off
        if (months === 12) return (monthlyPrice * 12 * 0.81).toFixed(2) // 10% off from 6-month price
        return (monthlyPrice * months).toFixed(2)
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900">Gym Plans</h1>
                        <p className="text-slate-600 mt-1">Choose the subscription that fits your goals.</p>
                    </div>
                    <Link to="/dashboard">
                        <Button variant="outline">Cancel & Return</Button>
                    </Link>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="flex justify-center my-8">
                    <div className="bg-white p-1 rounded-xl shadow-sm border inline-flex">
                        <Button
                            variant={months === 1 ? "default" : "ghost"}
                            onClick={() => setMonths(1)}
                            className="rounded-lg px-6"
                        >
                            1 Month
                        </Button>
                        <Button
                            variant={months === 6 ? "default" : "ghost"}
                            onClick={() => setMonths(6)}
                            className="rounded-lg px-6"
                        >
                            6 Months (-10%)
                        </Button>
                        <Button
                            variant={months === 12 ? "default" : "ghost"}
                            onClick={() => setMonths(12)}
                            className="rounded-lg px-6"
                        >
                            12 Months (-19%)
                        </Button>
                    </div>
                </div>

                {/* Pricing Cards Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-[300px] bg-slate-200 rounded-xl"></div>
                        ))}
                    </div>
                ) : tiers && tiers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tiers.map((tier) => (
                            <Card key={tier.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow border-slate-200">
                                <CardHeader className="text-center pb-2">
                                    <CardTitle className="text-2xl font-bold text-slate-800">{tier.name}</CardTitle>
                                    <CardDescription>
                                        {tier.discountPercentage > 0
                                            ? `Includes a ${tier.discountPercentage * 100}% discount on premium services!`
                                            : "Standard gym access"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-center flex-grow py-6">
                                    <span className="text-5xl font-extrabold text-primary">{calculatePrice(tier.monthlyPrice)} PLN</span>
                                    <span className="text-slate-500 font-medium block mt-2">
                                        {months === 1 ? "per month" : `for ${months} months`}
                                    </span>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full text-lg h-12"
                                        onClick={() => purchaseMutation.mutate(tier.id)}
                                        disabled={purchaseMutation.isPending}
                                    >
                                        {purchaseMutation.isPending ? "Processing..." : "Select Plan"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
                        <h3 className="text-xl font-bold text-slate-700">No plans available</h3>
                        <p className="text-slate-500">Please check back later or contact administration.</p>
                    </div>
                )}
            </div>
        </div>
    )
}