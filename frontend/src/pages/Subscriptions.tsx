import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate, Link } from "react-router-dom"
import { api } from "@/lib/api"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

// Expected structure of subscription tier data from the API
interface SubscriptionTier {
    id: string
    name: string
    monthlyPrice: number
    discountPercentage: number
}

export default function Subscriptions() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    // State to track the selected billing cycle (1, 6, or 12 months)
    const [months, setMonths] = useState<number>(1)

    // Fetch available subscription tiers
    const { data: tiers, isLoading } = useQuery<SubscriptionTier[]>({
        queryKey: ['subscription-tiers'],
        queryFn: async () => (await api.get('/api/subscriptions/tiers')).data
    })

    // Fetch the user's current subscription (if any)
    const { data: mySubscription } = useQuery<any>({
        queryKey: ['my-subscription'],
        queryFn: async () => {
            try {
                return (await api.get('/api/subscriptions/my-subscription')).data
            } catch (error: any) {
                // Return null gracefully if the user has no active subscription (404 Not Found)
                if (error.response?.status === 404) return null
                throw error
            }
        },
        retry: false
    })

    // Handles the purchase or upgrade of a subscription
    const purchaseMutation = useMutation({
        mutationFn: async (tierId: string) => {
            const response = await api.post(`/api/subscriptions/purchase/${tierId}`, { months })
            return response.data
        },
        onSuccess: async () => {
            toast.success("Success!", { description: "Your subscription has been upgraded successfully." })
            // Invalidate the cache to ensure the dashboard reflects the new subscription status immediately
            await queryClient.invalidateQueries({ queryKey: ['my-subscription'] })
            navigate('/dashboard')
        },
        onError: (error: any) => {
            console.error("Purchase error:", error.response?.data || error.message)
            toast.error("Purchase Failed", { description: error.response?.data?.Message || "An error occurred." })
        }
    })

    // Calculates the total price based on the selected tier and billing cycle duration, applying appropriate discounts
    const calculatePrice = (monthlyPrice: number): string => {
        if (months === 1) return monthlyPrice.toFixed(2)
        if (months === 6) return (monthlyPrice * 6 * 0.90).toFixed(2) // 10% discount for 6 months
        if (months === 12) return (monthlyPrice * 12 * 0.81).toFixed(2) // Compounded discount for 12 months
        return (monthlyPrice * months).toFixed(2)
    }

    // Determine the base price of the user's current subscription to formulate upgrade logic
    const currentTier = tiers?.find(t => t.name === mySubscription?.tierName)
    const currentBasePrice = currentTier ? currentTier.monthlyPrice : 0

    // Calculate the remaining duration of the current subscription in months
    let currentMonths = 0
    if (mySubscription) {
        const start = new Date(mySubscription.startDate)
        const end = new Date(mySubscription.endDate)
        // Divide the difference in milliseconds by the approximate number of milliseconds in a month
        currentMonths = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900">Gym Plans</h1>
                        <p className="text-slate-600 mt-1">Upgrade your plan to unlock premium features.</p>
                    </div>
                    <Link to="/dashboard">
                        <Button variant="outline">Return</Button>
                    </Link>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="flex justify-center my-8">
                    <div className="bg-white p-1 rounded-xl shadow-sm border inline-flex">
                        <Button variant={months === 1 ? "default" : "ghost"} onClick={() => setMonths(1)} className="rounded-lg px-6">1 Month</Button>
                        <Button variant={months === 6 ? "default" : "ghost"} onClick={() => setMonths(6)} className="rounded-lg px-6">6 Months (-10%)</Button>
                        <Button variant={months === 12 ? "default" : "ghost"} onClick={() => setMonths(12)} className="rounded-lg px-6">12 Months (-19%)</Button>
                    </div>
                </div>

                {/* Subscription Tiers Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map((i) => <div key={i} className="h-[300px] bg-slate-200 rounded-xl"></div>)}
                    </div>
                ) : tiers && tiers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tiers.map((tier) => {

                            // We disable the purchase button if the user is attempting to downgrade
                            // or trying to buy the exact same tier for a shorter or equal duration
                            const isDowngrade = tier.monthlyPrice < currentBasePrice
                            const isSameButShorter = tier.monthlyPrice === currentBasePrice && months <= currentMonths
                            const isDisabled = mySubscription && (isDowngrade || isSameButShorter)

                            return (
                                <Card key={tier.id} className={`flex flex-col shadow-md border-slate-200 transition-all ${isDisabled ? 'opacity-60 bg-slate-50' : 'hover:shadow-lg'}`}>
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
                                            disabled={isDisabled || purchaseMutation.isPending}
                                            variant={isDisabled ? "secondary" : "default"}
                                        >
                                            {purchaseMutation.isPending ? "Processing..." : (isDisabled ? "Current or lower tier" : "Select Plan")}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">No plans available.</div>
                )}
            </div>
        </div>
    )
}