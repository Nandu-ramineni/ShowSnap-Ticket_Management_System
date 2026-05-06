import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'brand' }) {
    const colorMap = {
        brand: 'text-brand bg-brand/10 border-brand/20',
        green: 'text-green-400 bg-green-400/10 border-green-400/20',
        yellow: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
        blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    };

    return (
        <div className="bg-card rounded-xl border border-border p-5 shadow-card hover:border-white/10 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colorMap[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend >= 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                        }`}>
                        {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trendValue || trend)}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
                <p className="text-sm font-medium text-white/80 mt-0.5">{title}</p>
                {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            </div>
        </div>
    );
}
