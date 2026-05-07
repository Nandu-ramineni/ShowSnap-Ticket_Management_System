import { useState, useEffect } from 'react';
import { Ticket, IndianRupee, Users, Activity } from 'lucide-react';
import {  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { SHOWTIMES, RECENT_BOOKINGS, REVENUE_CHART_DATA, formatINRFromRupees } from '@/lib/mockData';
import KPICard from './KPICard';
import BookingFeedItem from './BookingFeedItem';
import ShowCard from './ShowCard';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/Redux/Selectors/authSelectors';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-bold text-white">₹{(payload[0].value).toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const user = useSelector(selectCurrentUser);
  const [bookings, setBookings] = useState(RECENT_BOOKINGS);
  const [chartPeriod, setChartPeriod] = useState('today');

  const todayRevenue = SHOWTIMES.reduce((sum, s) => sum + s.revenue, 0);
  const todayTickets = SHOWTIMES.reduce((sum, s) => sum + s.bookedSeats, 0);
  const totalSeats = SHOWTIMES.reduce((sum, s) => sum + s.totalSeats, 0);
  const occupancy = Math.round((todayTickets / totalSeats) * 100);

  // Simulate live booking arrival
  useEffect(() => {
    const interval = setInterval(() => {
      const newBooking = {
        id: `bk_live_${Date.now()}`,
        ref: `SS-20260418-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        customer: ['Vikash M.', 'Aarav K.', 'Meera S.', 'Rohit P.', 'Kavya R.'][Math.floor(Math.random() * 5)],
        seats: [`${String.fromCharCode(65 + Math.floor(Math.random() * 10))}${Math.floor(Math.random() * 20) + 1}`],
        amount: [1200, 2400, 3600, 4800, 6000][Math.floor(Math.random() * 5)],
        show: 'Pushpa 2 • IMAX • 14:30',
        time: 'just now',
        status: 'confirmed',
        paymentStatus: 'paid',
      };
      setBookings(prev => [newBooking, ...prev.slice(0, 9)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name ?? 'User'} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Here{"'"}s what{"'"}s happening with your theatre today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Today's Revenue"
          value={`₹${(todayRevenue / 100000).toFixed(1)}L`}
          subtitle={formatINRFromRupees(todayRevenue)}
          icon={IndianRupee}
          trend={12}
          color="brand"
        />
        <KPICard
          title="Tickets Sold"
          value={todayTickets.toLocaleString('en-IN')}
          subtitle={`${SHOWTIMES.length} shows today`}
          icon={Ticket}
          trend={8}
          color="blue"
        />
        <KPICard
          title="Occupancy Rate"
          value={`${occupancy}%`}
          subtitle="Across all screens"
          icon={Users}
          trend={5}
          color="green"
        />
        <KPICard
          title="Active Shows"
          value={SHOWTIMES.filter(s => s.status === 'active').length}
          subtitle={`${SHOWTIMES.filter(s => s.status === 'housefull').length} housefull`}
          icon={Activity}
          trend={0}
          color="yellow"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-white font-semibold">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Hourly breakdown for today</p>
            </div>
            <div className="flex gap-1">
              {['today', 'week', 'month'].map(p => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${chartPeriod === p
                      ? 'bg-brand text-white'
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                    }`}
                >
                  {p === 'today' ? 'Today' : p === 'week' ? 'Week' : 'Month'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={REVENUE_CHART_DATA} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#E94560" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Feed */}
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Live Bookings</h3>
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Live
            </div>
          </div>
          <div className="space-y-0 max-h-85 overflow-y-auto pr-1">
            {bookings.slice(0, 8).map((b, i) => (
              <BookingFeedItem key={b.id} booking={b} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Shows */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Today{"'"}s Shows</h3>
          <a href="/shows" className="text-xs text-brand hover:text-brand/80 transition-colors">View all →</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SHOWTIMES.map(show => (
            <ShowCard key={show.id} show={show} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;