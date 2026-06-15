import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

export default function Home() {
    const { user, isAuthenticated, logout } = useAuth()

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-8">GymCore</h1>

            {!isAuthenticated ? (
                <div className="flex gap-4">
                    <Link to="/login"><Button size="lg">Log in</Button></Link>
                    <Link to="/register"><Button variant="outline" size="lg">Register</Button></Link>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
                    <div className="bg-white p-4 rounded-xl shadow-sm border w-full text-center">
                        <p className="text-sm text-slate-500">Logged in as:</p>
                        <p className="font-bold text-lg">{user?.email}</p>
                        <p className="text-sm text-blue-600 font-semibold uppercase">{user?.role}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        <Link to="/dashboard" className="w-full">
                            <Button variant="secondary" className="w-full h-24 text-lg shadow-sm">
                                My Profile
                            </Button>
                        </Link>
                        <Button variant="secondary" className="w-full h-24 text-lg shadow-sm">
                            Classes (Coming Soon)
                        </Button>
                        {user?.role === 'Admin' && (
                            <Button variant="secondary" className="w-full h-24 text-lg shadow-sm col-span-2 bg-slate-800 text-white hover:bg-slate-700">
                                Administrator Panel
                            </Button>
                        )}
                    </div>

                    <Button variant="outline" onClick={logout} className="mt-4 text-destructive border-destructive hover:bg-destructive/10">
                        Log out
                    </Button>
                </div>
            )}
        </div>
    )
}