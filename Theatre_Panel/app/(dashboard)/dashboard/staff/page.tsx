'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Mail, Phone } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

const mockStaff = [
  {
    id: 1,
    name: 'Vikram Singh',
    email: 'vikram@theatre.com',
    phone: '+91 98765 43210',
    role: 'Manager',
    theatre: 'Cineplex Plaza',
    joinDate: '2023-01-15',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Neha Sharma',
    email: 'neha@theatre.com',
    phone: '+91 98765 43211',
    role: 'Cashier',
    theatre: 'Star Cinema',
    joinDate: '2023-06-20',
    status: 'Active',
  },
  {
    id: 3,
    name: 'Rohan Gupta',
    email: 'rohan@theatre.com',
    phone: '+91 98765 43212',
    role: 'Staff',
    theatre: 'Cineplex Plaza',
    joinDate: '2024-01-10',
    status: 'Active',
  },
]

export default function StaffPage() {
  const [staff, setStaff] = useState(mockStaff)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Staff',
    theatre: '',
  })

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.email && formData.theatre) {
      const newStaff = {
        id: staff.length + 1,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        theatre: formData.theatre,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'Active',
      }
      setStaff([...staff, newStaff])
      setFormData({ name: '', email: '', phone: '', role: 'Staff', theatre: '' })
      setIsOpen(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground mt-2">Manage your theatre staff and employees</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <Input
                  placeholder="Enter staff name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option>Manager</option>
                  <option>Cashier</option>
                  <option>Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Theatre</label>
                <Input
                  placeholder="Select theatre"
                  value={formData.theatre}
                  onChange={(e) => setFormData({ ...formData, theatre: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Add Staff</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="text-left py-4 px-6 font-semibold text-foreground">Name</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Email</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Phone</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Role</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Theatre</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Join Date</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Status</th>
              <th className="text-left py-4 px-6 font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr
                key={member.id}
                className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <td className="py-4 px-6 font-medium text-foreground">{member.name}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {member.phone}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {member.role}
                  </span>
                </td>
                <td className="py-4 px-6 text-foreground">{member.theatre}</td>
                <td className="py-4 px-6 text-foreground text-sm">{member.joinDate}</td>
                <td className="py-4 px-6">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {member.status}
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
