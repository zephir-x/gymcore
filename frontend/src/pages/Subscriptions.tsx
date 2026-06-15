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
    price: number
    durationInDays: number
}

export default function Subscriptions() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

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
        mutationFn: async (tierId: string) => {
            const response = await api.post(`/api/subscriptions/purchase/${tierId}`)
            return response.data
        },
        onSuccess: () => {
            toast.success("Success!", {
                description: "Your subscription has been activated successfully."
            })

            // We tell React Query to mark the old dashboard data as stale,
            // when we navigate to /dashboard, it will automatically fetch the fresh status
            queryClient.invalidateQueries({ queryKey: ['my-subscription'] })

            navigate('/dashboard')
        },
        onError: (error: any) => {
            console.error("Purchase error:", error.response?.data || error.message)
            toast.error("Purchase Failed", {
                description: error.response?.data?.Message || "An error occurred during the transaction."
            })
        }
    })

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
                                    <CardDescription>Valid for {tier.durationInDays} days</CardDescription>
                                </CardHeader>
                                <CardContent className="text-center flex-grow">
                                    <span className="text-5xl font-extrabold text-primary">${tier.price}</span>
                                    <span className="text-slate-500 font-medium"> / {tier.durationInDays}d</span>
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