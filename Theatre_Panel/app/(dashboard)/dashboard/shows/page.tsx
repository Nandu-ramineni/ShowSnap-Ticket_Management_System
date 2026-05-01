'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Clock, Users, DollarSign } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const mockShows = [
  {
    id: 1,
    movieName: 'The Amazing Adventure',
    genre: 'Action',
    theatre: 'Cineplex Plaza',
    screen: 'Screen 1',
    timing: '10:00 AM',
    endTiming: '1:00 PM',
    price: 350,
    format: '2D',
    status: 'Active',
  },
  {
    id: 2,
    movieName: 'Romantic Tales',
    genre: 'Romance',
    theatre: 'Star Cinema',
    screen: 'Screen 2',
    timing: '2:30 PM',
    endTiming: '5:00 PM',
    price: 300,
    format: '2D',
    status: 'Active',
  },
  {
    id: 3,
    movieName: 'Space Odyssey',
    genre: 'Sci-Fi',
    theatre: 'Cineplex Plaza',
    screen: 'Screen 3',
    timing: '7:00 PM',
    endTiming: '9:45 PM',
    price: 400,
    format: '3D',
    status: 'Active',
  },
]

export default function ShowsPage() {
  const [shows, setShows] = useState(mockShows)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    movieName: '',
    genre: '',
    theatre: '',
    timing: '',
    price: '',
  })

  const handleAddShow = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.movieName && formData.genre && formData.theatre && formData.timing) {
      const newShow = {
        id: shows.length + 1,
        movieName: formData.movieName,
        genre: formData.genre,
        theatre: formData.theatre,
        screen: 'Screen 1',
        timing: formData.timing,
        endTiming: '5:00 PM',
        price: parseInt(formData.price) || 0,
        format: '2D',
        status: 'Active',
      }
      setShows([...shows, newShow])
      setFormData({ movieName: '', genre: '', theatre: '', timing: '', price: '' })
      setIsOpen(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shows</h1>
          <p className="text-muted-foreground mt-2">Manage movie schedules and shows</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Show
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Show</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddShow} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Movie Name</label>
                <Input
                  placeholder="Enter movie name"
                  value={formData.movieName}
                  onChange={(e) => setFormData({ ...formData, movieName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Genre</label>
                <Input
                  placeholder="Enter genre"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Theatre</label>
                <Input
                  placeholder="Select theatre"
                  value={formData.theatre}
                  onChange={(e) => setFormData({ ...formData, theatre: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Show Time</label>
                <Input
                  placeholder="e.g., 10:00 AM"
                  value={formData.timing}
                  onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ticket Price (₹)</label>
                <Input
                  type="number"
                  placeholder="Enter price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Add Show</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Shows Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="text-left py-4 px-6 font-semibold text-foreground">Movie</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Theatre</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Timing</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Price</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Format</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Status</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shows.map((show) => (
              <tr
                key={show.id}
                className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <td className="py-4 px-6">
                  <div>
                    <p className="font-medium text-foreground">{show.movieName}</p>
                    <p className="text-sm text-muted-foreground">{show.genre}</p>
                  </div>
                </td>
                <td className="py-4 px-6 text-foreground">{show.theatre}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {show.timing}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    ₹{show.price}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {show.format}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {show.status}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
