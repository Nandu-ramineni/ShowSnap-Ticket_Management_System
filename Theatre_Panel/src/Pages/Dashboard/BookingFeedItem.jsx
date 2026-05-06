import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function BookingFeedItem({ booking, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
        >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${booking.status === 'confirmed' ? 'bg-green-500/15' : 'bg-red-500/15'
                }`}>
                {booking.status === 'confirmed'
                    ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                    : <XCircle className="w-4 h-4 text-red-400" />
                }
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white truncate">{booking.customer}</p>
                    <p className={`text-sm font-bold flex-shrink-0 ${booking.status === 'confirmed' ? 'text-green-400' : 'text-red-400'}`}>
                        {booking.status === 'cancelled' ? '-' : ''}₹{(booking.amount).toLocaleString('en-IN')}
                    </p>
                </div>
                <p className="text-xs font-mono text-muted-foreground">{booking.ref}</p>
                <p className="text-xs text-muted-foreground truncate">{booking.show} • Seats: {booking.seats.join(', ')}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{booking.time}</p>
            </div>
        </motion.div>
    );
}