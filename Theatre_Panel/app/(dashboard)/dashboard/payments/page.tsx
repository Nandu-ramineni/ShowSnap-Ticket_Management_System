'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, Download, TrendingUp } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const mockPayments = [
  {
    id: 'PAY001',
    bookingId: 'BK001',
    amount: 1050,
    paymentMethod: 'Credit Card',
    date: '2024-04-12',
    time: '10:30 AM',
    status: 'Success',
    customerName: 'Rajesh Kumar',
  },
  {
    id: 'PAY002',
    bookingId: 'BK002',
    amount: 600,
    paymentMethod: 'UPI',
    date: '2024-04-12',
    time: '11:15 AM',
    status: 'Success',
    customerName: 'Priya Singh',
  },
  {
    id: 'PAY003',
    bookingId: 'BK003',
    amount: 1600,
    paymentMethod: 'Debit Card',
    date: '2024-04-11',
    time: '9:45 PM',
    status: 'Refunded',
    customerName: 'Amit Patel',
  },
]

const mockRefunds = [
  {
    id: 'REF001',
    paymentId: 'PAY003',
    amount: 1600,
    reason: 'Show Cancelled',
    date: '2024-04-12',
    status: 'Completed',
  },
  {
    id: 'REF002',
    paymentId: 'PAY002',
    amount: 300,
    reason: 'Partial Refund',
    date: '2024-04-11',
    status: 'Pending',
  },
]

const paymentTrendData = [
  { date: '2024-04-01', revenue: 12000, refunds: 1200 },
  { date: '2024-04-02', revenue: 15000, refunds: 800 },
  { date: '2024-04-03', revenue: 13500, refunds: 1350 },
  { date: '2024-04-04', revenue: 18000, refunds: 1500 },
  { date: '2024-04-05', revenue: 22000, refunds: 2200 },
  { date: '2024-04-06', revenue: 25000, refunds: 1250 },
]

const paymentMethodData = [
  { method: 'UPI', amount: 45000, percentage: 35 },
  { method: 'Credit Card', amount: 38000, percentage: 30 },
  { method: 'Debit Card', amount: 32000, percentage: 25 },
  { method: 'Wallet', amount: 13000, percentage: 10 },
]

export default function PaymentsPage() {
  const [selectedPayment, setSelectedPayment] = useState<typeof mockPayments[0] | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('payments')

  const totalRevenue = mockPayments.reduce((sum, p) => sum + (p.status === 'Success' ? p.amount : 0), 0)
  const totalRefunds = mockRefunds.reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments & Refunds</h1>
          <p className="text-muted-foreground mt-2">Track all transactions and refunds</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Export Statement
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <p className="text-muted-foreground text-sm">Total Revenue</p>
          <p className="text-2xl font-bold mt-2">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            {mockPayments.filter(p => p.status === 'Success').length} transactions
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground text-sm">Total Refunds</p>
          <p className="text-2xl font-bold mt-2">₹{totalRefunds.toLocaleString('en-IN')}</p>
          <p className="text-orange-600 text-sm mt-1">{mockRefunds.length} refund requests</p>
        </Card>
        <Card className="p-6">
          <p className="text-muted-foreground text-sm">Net Revenue</p>
          <p className="text-2xl font-bold mt-2">₹{(totalRevenue - totalRefunds).toLocaleString('en-IN')}</p>
          <p className="text-blue-600 text-sm mt-1">After refunds</p>
        </Card>
      </div>

      {/* Payment Trend Chart */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-bold mb-4">Payment Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={paymentTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              name="Revenue (₹)"
            />
            <Line
              type="monotone"
              dataKey="refunds"
              stroke="#ef4444"
              name="Refunds (₹)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 font-medium border-b-2 ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          Payments ({mockPayments.length})
        </button>
        <button
          onClick={() => setActiveTab('refunds')}
          className={`px-4 py-2 font-medium border-b-2 ${
            activeTab === 'refunds'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          Refunds ({mockRefunds.length})
        </button>
      </div>

      {activeTab === 'payments' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-left py-4 px-6 font-semibold text-foreground">Payment ID</th>
                <th className="text-left py-4 px-6 font-semibold text-foreground">Customer</th>
                <th className="text-left py-4 px-6 font-semibold text-foreground">Amount</th>
                <th className="text-left py-4 px-6 font-semibold text-foreground">Method</th>
                <th className="text-left py-4 px-6 font-semibold text-foreground">Date & Time</th>
                <th className="text-left py-4 px-6 font-semibold text-foreground">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <td className="py-4 px-6 font-medium text-foreground">{payment.id}</td>
                  <td className="py-4 px-6 text-foreground">{payment.customerName}</td>
                  <td className="py-4 px-6 font-bold text-green-600">₹{payment.amount}</td>
                  <td className="py-4 px-6 text-foreground text-sm">{payment.paymentMethod}</td>
                  <td className="py-4 px-6 text-foreground text-sm">
                    {payment.date} {payment.time}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'Success'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPayment(payment)
                        setIsDetailOpen(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'refunds' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-left py-4 px-6 font-semibold text-foreground">Refund ID</th>
                <th className="text-left py-4 px-6 font-semibold text-foreground">Amount</th>
                <th className="text-left py-4 px-6 font-semibold text-foreground">Reason</th>
                <th className="text-left py-4 px-6 font-semibold text-foreground">Date</th>
                <th className="text-left py-4 px-6 font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockRefunds.map((refund) => (
                <tr
                  key={refund.id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <td className="py-4 px-6 font-medium text-foreground">{refund.id}</td>
                  <td className="py-4 px-6 font-bold text-red-600">₹{refund.amount}</td>
                  <td className="py-4 px-6 text-foreground">{refund.reason}</td>
                  <td className="py-4 px-6 text-foreground text-sm">{refund.date}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        refund.status === 'Completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {refund.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Details Dialog */}
      {selectedPayment && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Card className="p-4 bg-slate-50 dark:bg-slate-900">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Payment ID</p>
                    <p className="font-bold text-foreground">{selectedPayment.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-bold text-green-600">{selectedPayment.status}</p>
                  </div>
                </div>
              </Card>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold text-foreground">₹{selectedPayment.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="text-foreground">{selectedPayment.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="text-foreground">{selectedPayment.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="text-foreground">{selectedPayment.date} {selectedPayment.time}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Booking ID</p>
                  <p className="text-foreground font-mono">{selectedPayment.bookingId}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
