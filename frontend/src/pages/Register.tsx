import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const registerSchema = z.object({
    firstName: z.string().min(2, "Name must be at least 2 characters long."),
    lastName: z.string().min(2, "Last name must be at least 2 characters long."),
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Incorrect email address."),
    password: z.string()
        .min(6, "The password must be at least 6 characters long.")
        .regex(/[A-Z]/, "The password must contain at least one uppercase letter.")
        .regex(/[a-z]/, "The password must contain at least one lowercase letter.")
        .regex(/[0-9]/, "The password must contain at least one number.")
        .regex(/[^a-zA-Z0-9]/, "The password must contain at least one special character (e.g. !, @, #)."),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "The passwords are not identical.",
    path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function Register() {
    const navigate = useNavigate()

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: "onChange",
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    const registerMutation = useMutation({
        mutationFn: async (values: RegisterFormValues) => {
            const response = await api.post('/api/auth/register', values)
            return response.data
        },
        onSuccess: () => {
            toast.success("Account created.", {
                description: "You can now log in with your details."
            })
            navigate('/login') // Smooth, automatic transfer
        },
        onError: (error: any) => {
            // In the console we save the full error for devs to debug
            console.error("Server error details:", error.response?.data || error.message)

            // We only display a short, elegant message to the user
            toast.error("Registration error", {
                description: "Please verify your details. This email address may already be in use."
            })
        }
    })

    const onSubmit = (values: RegisterFormValues) => {
        registerMutation.mutate(values)
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="absolute top-4 right-4">
                <Link to="/login">
                    <Button variant="outline" className="font-semibold text-slate-600">
                        Log in
                    </Button>
                </Link>
            </div>

            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold text-primary">Join GymCore</CardTitle>
                    <CardDescription>
                        Please fill out the details below to create a new account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="firstName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl><Input placeholder="Jan" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="lastName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Last name</FormLabel>
                                            <FormControl><Input placeholder="Kowalski" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl><Input placeholder="jan.kowalski@gmail.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm password</FormLabel>
                                        <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                                {registerMutation.isPending ? "Creating an account..." : "Register"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}