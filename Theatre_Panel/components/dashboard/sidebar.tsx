'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Film,
  Ticket,
  BarChart3,
  Users,
  DollarSign,
  Settings,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { Client_Logout } from '@/redux/Actions/auth.actions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Theatres', href: '/dashboard/theatres', icon: Building2 },
  { label: 'Shows', href: '/dashboard/shows', icon: Film },
  { label: 'Bookings', href: '/dashboard/bookings', icon: Ticket },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Staff', href: '/dashboard/staff', icon: Users },
  { label: 'Payments', href: '/dashboard/payments', icon: DollarSign },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  // Read user info directly from Redux state
  const user = useAppSelector((state) => state.auth.user);

  const handleSignOut = async () => {
    try {
      await dispatch(Client_Logout() as any);
      toast.success('Signed out successfully');
      router.replace('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Brand */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white">Theatre Portal</h1>
        <p className="text-xs text-slate-400 mt-1">Manage Your Cinema</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-slate-800 space-y-4">
        <div className="px-4 py-3 bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-400">Logged in as</p>
          <p className="text-sm font-medium text-white truncate">
            {user?.name || user?.email || '—'}
          </p>
          {user?.role && (
            <p className="text-xs text-slate-500 capitalize mt-0.5">
              {user.role.replace(/_/g, ' ')}
            </p>
          )}
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
