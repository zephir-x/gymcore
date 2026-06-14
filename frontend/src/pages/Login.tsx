import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function Login() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <h1 className="text-4xl font-bold">Login</h1>
            <p>The authorization form will be here.</p>
            <Link to="/">
                <Button variant="outline">Back to Home</Button>
            </Link>
        </div>
    )
}