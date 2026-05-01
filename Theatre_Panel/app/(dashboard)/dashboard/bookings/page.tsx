'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, Trash2, Check, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const mockBookings = [
  {
    id: 'BK001',
    customerName: 'Rajesh Kumar',
    email: 'rajesh@email.com',
    phone: '+91 98765 43200',
    movie: 'The Amazing Adventure',
    theatre: 'Cineplex Plaza',
    screen: 'Screen 1',
    seats: ['A1', 'A2', 'A3'],
    totalAmount: 1050,
    bookingDate: '2024-04-12',
    status: 'Confirmed',
  },
  {
    id: 'BK002',
    customerName: 'Priya Singh',
    email: 'priya@email.com',
    phone: '+91 98765 43201',
    movie: 'Romantic Tales',
    theatre: 'Star Cinema',
    screen: 'Screen 2',
    seats: ['B4', 'B5'],
    totalAmount: 600,
    bookingDate: '2024-04-12',
    status: 'Pending',
  },
  {
    id: 'BK003',
    customerName: 'Amit Patel',
    email: 'amit@email.com',
    phone: '+91 98765 43202',
    movie: 'Space Odyssey',
    theatre: 'Cineplex Plaza',
    screen: 'Screen 3',
    seats: ['C1', 'C2', 'C3', 'C4'],
    totalAmount: 1600,
    bookingDate: '2024-04-11',
    status: 'Cancelled',
  },
]

export default function BookingsPage() {
  const [bookings, setBookings] = useState(mockBookings)
  const [selectedBooking, setSelectedBooking] = useState<typeof mockBookings[0] | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleConfirm = (id: string) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Confirmed' } : b))
  }

  const handleCancel = (id: string) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b))
  }

  const viewDetails = (booking: typeof mockBookings[0]) => {
    setSelectedBooking(booking)
    setIsDetailOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Bookings</h1>
        <p className="text-muted-foreground mt-2">Manage customer bookings and reservations</p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search by booking ID or customer name..."
          className="flex-1"
        />
        <Button variant="outline">Filter</Button>
      </div>

      {/* Bookings Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="text-left py-4 px-6 font-semibold text-foreground">Booking ID</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Customer</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Movie</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Seats</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Amount</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Status</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Date</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <td className="py-4 px-6 font-medium text-foreground">{booking.id}</td>
                <td className="py-4 px-6">
                  <div>
                    <p className="font-medium text-foreground">{booking.customerName}</p>
                    <p className="text-sm text-muted-foreground">{booking.email}</p>
                  </div>
                </td>
                <td className="py-4 px-6 text-foreground">{booking.movie}</td>
                <td className="py-4 px-6 text-foreground">{booking.seats.join(', ')}</td>
                <td className="py-4 px-6 font-medium text-foreground">₹{booking.totalAmount}</td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-foreground text-sm">{booking.bookingDate}</td>
                <td className="py-4 px-6">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewDetails(booking)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {booking.status === 'Pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConfirm(booking.id)}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(booking.id)}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}
                    {booking.status === 'Confirmed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(booking.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Card className="p-4 bg-slate-50 dark:bg-slate-900">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Booking ID</p>
                    <p className="font-bold text-foreground">{selectedBooking.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`font-bold ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="text-foreground font-medium">{selectedBooking.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-foreground">{selectedBooking.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="text-foreground">{selectedBooking.phone}</p>
                </div>
              </div>

              <Card className="p-4 border-l-4 border-blue-600">
                <p className="text-sm text-muted-foreground mb-2">Movie & Venue</p>
                <div className="space-y-1">
                  <p className="font-bold text-foreground">{selectedBooking.movie}</p>
                  <p className="text-sm text-foreground">{selectedBooking.theatre} - {selectedBooking.screen}</p>
                </div>
              </Card>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Seats Booked</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.seats.map((seat) => (
                    <span
                      key={seat}
                      className="px-3 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-lg font-medium"
                    >
                      {seat}
                    </span>
                  ))}
                </div>
              </div>

              <Card className="p-4 bg-green-50 dark:bg-green-900">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">₹{selectedBooking.totalAmount}</p>
              </Card>

              <p className="text-xs text-muted-foreground">
                Booking Date: {selectedBooking.bookingDate}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
