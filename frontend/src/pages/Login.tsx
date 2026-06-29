import { useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const loginSchema = z.object({
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Incorrect email address."),
    password: z.string().min(6, "The password must be at least 6 characters long."),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { login } = useAuth()

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        mode: "onChange",
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const loginMutation = useMutation({
        mutationFn: async (values: LoginFormValues) => {
            const response = await api.post('/api/auth/login', values)
            return response.data
        },
        onSuccess: (data) => {
            login(data.token)
            queryClient.removeQueries()
            navigate('/')
        },
        onError: (error: any) => {
            console.error("Login error:", error.response?.data || error.message)
            toast.error("Access Denied", { description: "Incorrect email or password. Please try again." })
        }
    })

    const onSubmit = (values: LoginFormValues) => {
        loginMutation.mutate(values)
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 p-4 sm:p-8 font-sans overflow-hidden">
            {/* AMBIENT GLOW EFFECTS */}
            <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

            {/* GLOSSY GLASS CARD */}
            <Card className="animate-in fade-in slide-in-from-left-8 duration-700 ease-out relative z-10 w-full max-w-[420px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-none outline-none ring-0 ring-offset-0 
            bg-zinc-900/30 backdrop-blur-2xl bg-gradient-to-br from-white/10 via-transparent to-black/40 text-zinc-100 before:absolute before:inset-0 before:rounded-xl 
            before:border before:border-white/20 before:border-b-white/5 before:border-r-white/5 before:pointer-events-none">

                <CardHeader className="space-y-1 text-center pb-6 pt-10 px-8">
                    <div className="flex justify-center mb-4">
                        <h1 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
                            GYMCORE
                        </h1>
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight text-white">
                        Welcome back
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>

                <CardContent className="pb-8 px-8">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-zinc-300 font-medium">Email Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="jan.kowalski@gmail.com" {...field} className="bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:border-orange-500 transition-all duration-300" />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-zinc-300 font-medium">Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} className="bg-zinc-950/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:border-orange-500 transition-all duration-300" />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />

                            {/* FIRE BUTTON */}
                            <Button
                                type="submit"
                                disabled={loginMutation.isPending}
                                className="w-full h-11 text-md font-bold mt-4 border-none text-white shadow-[0_0_20px_rgba(249,115,22,0.25)] 
                                bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600 
                                bg-[length:200%_auto] hover:bg-[position:right_center] 
                                transition-all duration-500"
                            >
                                {loginMutation.isPending ? "Logging in..." : "Login"}
                            </Button>
                        </form>
                    </Form>
                </CardContent>

                <CardFooter className="flex justify-center border-t border-white/5 py-6 bg-transparent rounded-b-xl">
                    <p className="text-sm text-zinc-400">
                        Don't have an account?{" "}
                        <Link to="/register" className="font-semibold text-orange-500 hover:text-orange-400 hover:underline underline-offset-4 transition-colors">
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}