'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Building2, DollarSign, Shield, Bell } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)

  const [settings, setSettings] = useState({
    theatreName: 'Cineplex Plaza',
    ownerName: 'John Doe',
    email: 'owner@theatre.com',
    phone: '+91 98765 43210',
    address: 'Downtown Main Street',
    city: 'New York',
    gstNumber: '18AABCT1234H1Z0',
    cinemaLicense: 'LIC123456789',
    refundPolicy: '48 hours before show',
    cancellationFee: 10,
    advanceBookingDays: 30,
    emailNotifications: true,
    smsNotifications: true,
    bookingAlerts: true,
    revenueAlerts: true,
  })

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    toast.success('Settings saved successfully!')
    setIsSaving(false)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your theatre configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Tabs */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {[
              { id: 'general', label: 'General', icon: Building2 },
              { id: 'policies', label: 'Policies & Fees', icon: DollarSign },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'notifications', label: 'Notifications', icon: Bell },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {/* General Settings */}
          {activeTab === 'general' && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">General Settings</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Theatre Name</label>
                    <Input
                      value={settings.theatreName}
                      onChange={(e) => setSettings({ ...settings, theatreName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Owner Name</label>
                    <Input
                      value={settings.ownerName}
                      onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <Input
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <Input
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">City</label>
                    <Input
                      value={settings.city}
                      onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">GST Number</label>
                    <Input
                      value={settings.gstNumber}
                      onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Cinema License</label>
                  <Input
                    value={settings.cinemaLicense}
                    onChange={(e) => setSettings({ ...settings, cinemaLicense: e.target.value })}
                  />
                </div>

                <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Card>
          )}

          {/* Policies & Fees */}
          {activeTab === 'policies' && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Policies & Fees</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Refund Policy</label>
                  <Input
                    value={settings.refundPolicy}
                    onChange={(e) => setSettings({ ...settings, refundPolicy: e.target.value })}
                    placeholder="e.g., 48 hours before show"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cancellation Fee (%)</label>
                    <Input
                      type="number"
                      value={settings.cancellationFee}
                      onChange={(e) => setSettings({ ...settings, cancellationFee: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Advance Booking (Days)</label>
                    <Input
                      type="number"
                      value={settings.advanceBookingDays}
                      onChange={(e) => setSettings({ ...settings, advanceBookingDays: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Card>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Security Settings</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Two-Factor Authentication is not yet enabled. Enable it for better security.
                  </p>
                  <Button className="mt-2" variant="outline">
                    Enable 2FA
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <Input type="password" placeholder="Enter current password" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">New Password</label>
                    <Input type="password" placeholder="Enter new password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm Password</label>
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                </div>

                <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Update Password'}
                </Button>
              </div>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive booking and system updates via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                      className="w-5 h-5"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                      className="w-5 h-5"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Booking Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified on new bookings</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.bookingAlerts}
                      onChange={(e) => setSettings({ ...settings, bookingAlerts: e.target.checked })}
                      className="w-5 h-5"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Revenue Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified on revenue milestones</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.revenueAlerts}
                      onChange={(e) => setSettings({ ...settings, revenueAlerts: e.target.checked })}
                      className="w-5 h-5"
                    />
                  </div>
                </div>

                <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
