import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import Logo from '@/assets/Logo.png';
import { login, clearAuthError } from '@/Redux/Actions/authActions';
import {
    selectIsAuthenticated,
    selectAuthLoading,
    selectAuthError,
} from '@/Redux/Selectors/authSelectors';

// ─── Component ────────────────────────────────────────────────────────────────
const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const isAuthenticated = useSelector(selectIsAuthenticated);
    const isLoading = useSelector(selectAuthLoading);
    const error = useSelector(selectAuthError);

    const [formData, setFormData] = useState({ email: '', password: '' });

    // ── Redirect on successful login ──────────────────────────────────────
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // ── Clear stale errors when the component unmounts ────────────────────
    useEffect(() => () => { dispatch(clearAuthError()); }, [dispatch]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error as soon as the user starts correcting input
        if (error) dispatch(clearAuthError());
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const { email, password } = formData;
        if (!email.trim() || !password) return;
        dispatch(login(email.trim(), password));
    };

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <main className="flex justify-center items-center min-h-screen px-4">
            <Card className="w-full max-w-sm">

                {/* Branding */}
                <div className="flex flex-col items-center pt-6 gap-1 select-none">
                    <img src={Logo} alt="CineVault logo" className="w-16 h-16" />
                    <h1 className="text-2xl font-bold">CineVault!</h1>
                    <p className="text-sm text-muted-foreground">Your seats. Your cinema.</p>
                </div>

                <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>Enter your credentials below.</CardDescription>
                </CardHeader>

                {/* Error banner */}
                {error && (
                    <div
                        role="alert"
                        className="mx-6 mb-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                        {/* Warning icon */}
                        <svg
                            className="mt-0.5 h-4 w-4 shrink-0"
                            viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <CardContent>
                    <form
                        id="loginForm"
                        onSubmit={handleSubmit}
                        noValidate
                        aria-label="Login form"
                    >
                        <div className="flex flex-col gap-5">

                            {/* Email */}
                            <div className="grid gap-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    inputMode="email"
                                    placeholder="hello@cinevault.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div className="grid gap-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                                        tabIndex={isLoading ? -1 : 0}
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                        </div>
                    </form>
                </CardContent>

                <CardFooter className="flex-col gap-3">
                    <Button
                        type="submit"
                        form="loginForm"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg
                                    className="h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2"
                                    aria-hidden="true"
                                >
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                                Signing in…
                            </span>
                        ) : (
                            'Login'
                        )}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                        Don&apos;t have an account?{' '}
                        <Link
                            to="/signup"
                            className="font-medium text-foreground hover:underline underline-offset-2"
                        >
                            Sign up
                        </Link>
                    </p>
                </CardFooter>

            </Card>
        </main>
    );
};

export default Login;