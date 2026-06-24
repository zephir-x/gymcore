import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { ArrowLeft, Users, ShieldAlert, ShieldCheck, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

/* INTERFACES */
interface Room {
    id: string;
    name: string;
    maxCapacity: number;
    requiredTierId: string | null;
    requiredTierName: string | null;
    imageUrl?: string | null;
    description?: string | null;
}

/* COMPONENT */
export default function Rooms() {
    const [selectedRoomDetails, setSelectedRoomDetails] = useState<Room | null>(null);

    /* QUERIES */
    const { data: rooms, isLoading } = useQuery<Room[]>({
        queryKey: ['rooms'],
        queryFn: async () => {
            const res = await api.get('/api/bookings/rooms');
            return res.data;
        }
    })

    /* RENDER */
    return (
        <div className="h-screen w-full bg-zinc-950 text-zinc-100 font-sans p-4 md:p-12 overflow-y-auto overflow-x-hidden select-none relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* AMBIENT GLOW EFFECTS */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10 space-y-8 animate-in fade-in duration-500 pb-12">
                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-white/5 pb-6 pt-4 md:pt-0">
                    <div className="flex items-center gap-4">
                        <Link to="/">
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl border border-white/5 shrink-0">
                                <ArrowLeft size={20} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Facility Rooms</h1>
                            <p className="text-xs md:text-sm text-zinc-400 font-medium mt-0.5">Browse all zones and training spaces available in GymCore</p>
                        </div>
                    </div>
                </div>

                {/* ROOMS GRID */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-44 bg-zinc-900/50 rounded-2xl" />
                        ))}
                    </div>
                ) : rooms && rooms.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {rooms.map((room) => (
                            <div
                                key={room.id}
                                onClick={() => setSelectedRoomDetails(room)}
                                className="bg-zinc-900/40 border border-white/5 hover:border-white/10 hover:bg-zinc-900/60 rounded-2xl p-6 flex flex-col justify-between h-44 transition-all duration-300 relative overflow-hidden group cursor-pointer"
                            >
                                {/* DYNAMIC BACKGROUND IMAGE */}
                                {room.imageUrl ? (
                                    <>
                                        <img src={room.imageUrl} alt={room.name} className="absolute inset-0 w-full h-full object-cover grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-50 transition-all duration-700 mix-blend-luminosity group-hover:mix-blend-normal pointer-events-none" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none" />
                                    </>
                                ) : (
                                    <div className="absolute -right-8 -top-8 w-28 h-24 bg-gradient-to-br from-orange-500/5 to-transparent rounded-full blur-xl group-hover:from-orange-500/10 transition-all duration-500 pointer-events-none" />
                                )}

                                <div className="relative z-10 flex flex-col h-full justify-between pointer-events-none">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-orange-500 transition-colors">
                                            {room.name}
                                        </h3>
                                        <div className="flex items-center text-zinc-400 text-sm font-semibold bg-zinc-950/80 border border-white/5 w-fit px-3 py-1.5 rounded-xl backdrop-blur-sm">
                                            <Users size={14} className="mr-2 text-orange-500" />
                                            <span>Max Capacity: <span className="text-white font-bold">{room.maxCapacity}</span></span>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/10 pt-4 mt-4 flex items-center justify-between">
                                        <span className="text-xs text-zinc-400 font-medium">Access Status</span>
                                        {room.requiredTierName ? (
                                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20 backdrop-blur-sm">
                                                <ShieldAlert size={12} />
                                                <span>{room.requiredTierName} Required</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20 backdrop-blur-sm">
                                                <ShieldCheck size={12} />
                                                <span>Public Access</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-2xl p-8 max-w-md mx-auto">
                        <h3 className="text-lg font-bold text-zinc-300">No rooms found</h3>
                        <p className="text-sm text-zinc-500 mt-1">Our system claims there are no club areas set up yet.</p>
                    </div>
                )}
            </div>

            {/* ROOM DETAILS MODAL */}
            <Dialog open={!!selectedRoomDetails} onOpenChange={() => setSelectedRoomDetails(null)}>
                <DialogContent className="sm:max-w-[450px] p-0 bg-zinc-950 border border-white/10 overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <div className="w-full h-[250px] relative">
                        {selectedRoomDetails?.imageUrl ? (
                            <img src={selectedRoomDetails.imageUrl} alt={selectedRoomDetails.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                                <span className="text-zinc-600">No Image</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
                    </div>
                    <div className="px-6 pb-6 pt-2">
                        <h2 className="text-2xl font-black text-white mb-2">{selectedRoomDetails?.name}</h2>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="flex items-center text-zinc-400 text-xs font-medium bg-zinc-900 px-2 py-1 rounded-md border border-white/5"><Users size={14} className="mr-1.5 text-orange-500"/> Capacity: {selectedRoomDetails?.maxCapacity}</span>
                            <span className="flex items-center text-zinc-400 text-xs font-medium bg-zinc-900 px-2 py-1 rounded-md border border-white/5"><Award size={14} className="mr-1.5 text-amber-500"/> {selectedRoomDetails?.requiredTierName || "All Access"}</span>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            {selectedRoomDetails?.description || "Experience top-tier fitness in our expertly designed facility, crafted to help you push your limits and achieve your goals."}
                        </p>
                        <Button className="w-full mt-6 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/5" onClick={() => setSelectedRoomDetails(null)}>Close View</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}