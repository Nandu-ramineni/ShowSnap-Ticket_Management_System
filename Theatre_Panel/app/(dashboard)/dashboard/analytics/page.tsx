'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Download, Calendar } from 'lucide-react'

const revenueData = [
  { date: '2024-04-01', revenue: 12000, bookings: 45, cancelled: 2 },
  { date: '2024-04-02', revenue: 15000, bookings: 52, cancelled: 1 },
  { date: '2024-04-03', revenue: 13500, bookings: 48, cancelled: 3 },
  { date: '2024-04-04', revenue: 18000, bookings: 65, cancelled: 2 },
  { date: '2024-04-05', revenue: 22000, bookings: 78, cancelled: 4 },
  { date: '2024-04-06', revenue: 25000, bookings: 89, cancelled: 1 },
  { date: '2024-04-07', revenue: 28000, bookings: 98, cancelled: 2 },
]

const moviePerformance = [
  { name: 'The Amazing Adventure', revenue: 125000, bookings: 450 },
  { name: 'Romantic Tales', revenue: 98000, bookings: 380 },
  { name: 'Space Odyssey', revenue: 145000, bookings: 520 },
  { name: 'Comedy Hour', revenue: 67000, bookings: 210 },
  { name: 'Drama King', revenue: 89000, bookings: 290 },
]

const occupancyData = [
  { name: 'Occupied', value: 78, fill: '#3b82f6' },
  { name: 'Available', value: 22, fill: '#e5e7eb' },
]

const bookingStatusData = [
  { name: 'Confirmed', value: 720, fill: '#10b981' },
  { name: 'Pending', value: 120, fill: '#f59e0b' },
  { name: 'Cancelled', value: 40, fill: '#ef4444' },
]

const genreDistribution = [
  { name: 'Action', count: 580, percentage: 35 },
  { name: 'Romance', count: 420, percentage: 25 },
  { name: 'Sci-Fi', count: 380, percentage: 23 },
  { name: 'Comedy', count: 220, percentage: 13 },
  { name: 'Drama', count: 80, percentage: 4 },
]

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-2">Comprehensive insights into your theatre business</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <p className="text-muted-foreground text-sm">Total Revenue</p>
          <p className="text-2xl font-bold mt-2">₹1,33,600</p>
          <p className="text-green-600 text-sm mt-1">↑ 12.5% week over week</p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground text-sm">Total Bookings</p>
          <p className="text-2xl font-bold mt-2">880</p>
          <p className="text-green-600 text-sm mt-1">↑ 8.2% week over week</p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground text-sm">Avg. Ticket Price</p>
          <p className="text-2xl font-bold mt-2">₹348</p>
          <p className="text-green-600 text-sm mt-1">↑ 3.5% week over week</p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground text-sm">Occupancy Rate</p>
          <p className="text-2xl font-bold mt-2">78.25%</p>
          <p className="text-green-600 text-sm mt-1">↑ 5.3% week over week</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue & Bookings Trend */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Revenue & Bookings Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                name="Revenue (₹)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bookings"
                stroke="#8b5cf6"
                name="Bookings"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Movie Performance */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Movie Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moviePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} width={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (₹)" />
              <Bar dataKey="bookings" fill="#10b981" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Occupancy & Booking Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Average Occupancy</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
              >
                {occupancyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center">
            <p className="text-3xl font-bold text-foreground">78.25%</p>
            <p className="text-muted-foreground text-sm">Average occupancy rate</p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Booking Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={bookingStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
              >
                {bookingStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {bookingStatusData.map((item) => (
              <div key={item.name} className="flex justify-between text-sm">
                <span className="text-foreground">{item.name}</span>
                <span className="font-bold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Genre Distribution</h2>
          <div className="space-y-3">
            {genreDistribution.map((genre) => (
              <div key={genre.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{genre.name}</span>
                  <span className="text-sm font-bold text-foreground">{genre.count}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${genre.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
