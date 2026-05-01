'use client'

import { useAuth } from '@/lib/context/auth-context'
import { Card } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, DollarSign, Ticket } from 'lucide-react'

const revenueData = [
  { month: 'Jan', revenue: 12000, bookings: 240 },
  { month: 'Feb', revenue: 19000, bookings: 380 },
  { month: 'Mar', revenue: 9800, bookings: 200 },
  { month: 'Apr', revenue: 29800, bookings: 500 },
  { month: 'May', revenue: 39000, bookings: 650 },
  { month: 'Jun', revenue: 34000, bookings: 580 },
]

const occupancyData = [
  { screen: 'Screen 1', occupied: 85, available: 15 },
  { screen: 'Screen 2', occupied: 72, available: 28 },
  { screen: 'Screen 3', occupied: 91, available: 9 },
  { screen: 'Screen 4', occupied: 65, available: 35 },
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.email?.split('@')[0]}</h1>
        <p className="text-muted-foreground mt-2">Here&apos;s your theatre management overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold mt-2">₹1,43,600</p>
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                +12.5% from last month
              </p>
            </div>
            <DollarSign className="h-12 w-12 text-blue-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Total Bookings</p>
              <p className="text-2xl font-bold mt-2">2,450</p>
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                +8.2% from last month
              </p>
            </div>
            <Ticket className="h-12 w-12 text-purple-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Avg. Occupancy</p>
              <p className="text-2xl font-bold mt-2">78.25%</p>
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                +5.3% from last month
              </p>
            </div>
            <Users className="h-12 w-12 text-green-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Active Shows</p>
              <p className="text-2xl font-bold mt-2">12</p>
              <p className="text-blue-600 text-sm mt-1 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                4 shows this week
              </p>
            </div>
            <Film className="h-12 w-12 text-orange-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Revenue & Bookings Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
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

        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Screen Occupancy</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={occupancyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="screen" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="occupied" stackId="a" fill="#3b82f6" name="Occupied" />
              <Bar dataKey="available" stackId="a" fill="#e5e7eb" name="Available" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

import { Film } from 'lucide-react'
