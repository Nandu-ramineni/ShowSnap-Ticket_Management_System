'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { Client_Login } from '@/redux/Actions/auth.actions';
import { clearError } from '@/redux/Reducers/auth.reducers';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const loginInitialData = { email: '', password: '' };

export default function LoginPage() {
  const [data, setData] = useState(loginInitialData);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error, isAuthenticated } = useAppSelector((s) => s.auth);

  // Already logged in → go straight to dashboard
  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  // Surface API errors via toast then clear from state
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await dispatch(Client_Login(data) as any);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch {
      // error already surfaced via the useEffect above
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Theatre Owner</h1>
          <p className="text-muted-foreground mt-2">Management Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="owner@theatre.com"
              value={data.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={data.password}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
