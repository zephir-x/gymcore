import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

// We define a validation scheme (Zod) to secure our form
const loginSchema = z.object({
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Incorrect email address."),
    password: z.string().min(6, "The password must be at least 6 characters long."),
})

// We extract the TypeScript type directly from the schema
type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
    const navigate = useNavigate()

    // We initialize the React Hook Form
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: "onChange",
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const { login } = useAuth() // We use the Context to save the token
    
    // We configure React Query to send a POST request
    const loginMutation = useMutation({
        mutationFn: async (values: LoginFormValues) => {
            const response = await api.post('/api/auth/login', values)
            return response.data
        },
        onSuccess: (data) => {
            login(data.token) // Our Context will now save the token and decrypt the role
            navigate('/')
        },
        onError: (error: any) => {
            console.error("Login error:", error.response?.data || error.message)

            toast.error("Login error", {
                description: "Incorrect email or password. Please try again.",
            })
        }
    })

    // Function called when clicking "Log in"
    const onSubmit = (values: LoginFormValues) => {
        loginMutation.mutate(values)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="absolute top-4 right-4">
                <Link to="/register">
                    <Button variant="outline" className="font-semibold text-slate-600">
                        Register
                    </Button>
                </Link>
            </div>
            
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold text-primary">GymCore</CardTitle>
                    <CardDescription>
                        Enter your email and password to log in
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="jan.kowalski@gmail.com" {...field} />
                                        </FormControl>
                                        <FormMessage /> { /* Zod error will be displayed here */ }
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loginMutation.isPending} // We block the button while charging
                            >
                                {loginMutation.isPending ? "Login..." : "Log in"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}