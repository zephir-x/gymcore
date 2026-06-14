import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <h1 className="text-4xl font-bold">GymCore - Home Page</h1>
            <Link to="/login">
                <Button>Log in</Button>
            </Link>
        </div>
    )
}