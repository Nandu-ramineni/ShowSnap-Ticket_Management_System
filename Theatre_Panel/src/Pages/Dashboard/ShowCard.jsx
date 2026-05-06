import { Clock, Monitor, Users, Edit2, XCircle, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ShowCard({ show }) {
    const occupancy = Math.round((show.bookedSeats / show.totalSeats) * 100);
    const available = show.totalSeats - show.bookedSeats - show.lockedSeats - show.blockedSeats;

    const statusColor = show.status === 'housefull'
        ? 'bg-brand/20 text-brand border-brand/30'
        : occupancy > 80
            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            : 'bg-green-500/20 text-green-400 border-green-500/30';

    return (
        <div className="bg-card rounded-xl border border-border p-4 hover:border-white/10 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-semibold text-sm truncate">{show.movie}</h4>
                        {show.isPremiere && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] px-1.5 py-0">PREMIERE</Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{show.screen}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{show.startTime}</span>
                    </div>
                </div>
                <Badge className={`text-[10px] px-2 border ${statusColor} ml-2 flex-shrink-0`}>
                    {show.status === 'housefull' ? '🔥 HOUSEFULL' : `${occupancy}%`}
                </Badge>
            </div>

            {/* Occupancy bar */}
            <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{show.bookedSeats} booked</span>
                    <span className="text-muted-foreground">{available} left</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${occupancy >= 90 ? 'bg-brand' : occupancy >= 70 ? 'bg-yellow-400' : 'bg-green-400'
                            }`}
                        style={{ width: `${occupancy}%` }}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Link to="/shows" className="flex-1">
                    <Button size="sm" variant="ghost" className="w-full h-7 text-xs text-muted-foreground hover:text-white hover:bg-white/5">
                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                </Link>
                <Link to="/seatmap" className="flex-1">
                    <Button size="sm" className="w-full h-7 text-xs bg-brand/20 hover:bg-brand/30 text-brand border border-brand/30">
                        <MapPin className="w-3 h-3 mr-1" /> Seat Map
                    </Button>
                </Link>
            </div>
        </div>
    );
}