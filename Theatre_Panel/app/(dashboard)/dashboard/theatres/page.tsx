'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, MapPin, Phone } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const mockTheatres = [
  {
    id: 1,
    name: 'Cineplex Plaza',
    location: 'Downtown',
    phone: '+91 98765 43210',
    screens: 4,
    totalSeats: 800,
    status: 'Active',
  },
  {
    id: 2,
    name: 'Star Cinema',
    location: 'Mall Road',
    phone: '+91 98765 43211',
    screens: 3,
    totalSeats: 600,
    status: 'Active',
  },
  {
    id: 3,
    name: 'Royal Theatre',
    location: 'Residential Area',
    phone: '+91 98765 43212',
    screens: 2,
    totalSeats: 400,
    status: 'Inactive',
  },
]

export default function TheatresPage() {
  const [theatres, setTheatres] = useState(mockTheatres)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    screens: '',
  })

  const handleAddTheatre = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.location && formData.phone) {
      const newTheatre = {
        id: theatres.length + 1,
        name: formData.name,
        location: formData.location,
        phone: formData.phone,
        screens: parseInt(formData.screens) || 0,
        totalSeats: 0,
        status: 'Active',
      }
      setTheatres([...theatres, newTheatre])
      setFormData({ name: '', location: '', phone: '', screens: '' })
      setIsOpen(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Theatres</h1>
          <p className="text-muted-foreground mt-2">Manage all your theatre locations</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Theatre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Theatre</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTheatre} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Theatre Name</label>
                <Input
                  placeholder="Enter theatre name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Number of Screens</label>
                <Input
                  type="number"
                  placeholder="Enter number of screens"
                  value={formData.screens}
                  onChange={(e) => setFormData({ ...formData, screens: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Add Theatre</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Theatres Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {theatres.map((theatre) => (
          <Card key={theatre.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-foreground">{theatre.name}</h3>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${theatre.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {theatre.status}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{theatre.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span className="text-sm">{theatre.phone}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Screens</p>
                  <p className="text-lg font-bold">{theatre.screens}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Seats</p>
                  <p className="text-lg font-bold">{theatre.totalSeats}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2">
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-2 text-red-600">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
