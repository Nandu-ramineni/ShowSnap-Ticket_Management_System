import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast, Toaster } from 'sonner';

import { login, clearAuthError } from '@/Redux/Actions/authActions';
import {
    selectAuthLoading,
    selectAuthError,
    selectIsAuthenticated,
    selectIsHydrating,
} from '@/Redux/Selectors/authSelectors';

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

// ─── Simple client-side validation ───────────────────────────────────────────
const validate = ({ email, password }) => {
    const errors = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    return errors;
};

// ─── Component ────────────────────────────────────────────────────────────────
const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const isLoading = useSelector(selectAuthLoading);
    const reduxError = useSelector(selectAuthError);
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const isHydrating = useSelector(selectIsHydrating);

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [fieldErrors, setFieldErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const emailRef = useRef(null);

    // Auto-focus email on mount
    useEffect(() => {
        emailRef.current?.focus();
    }, []);

    // If already authenticated (hydrated session), redirect to dashboard
    useEffect(() => {
        if (!isHydrating && isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, isHydrating, navigate]);

    // Show redux error as toast (e.g. rejected / suspended account)
    useEffect(() => {
        if (reduxError) {
            toast.error(reduxError);
        }
    }, [reduxError]);

    // Clear error when component unmounts
    useEffect(() => {
        return () => dispatch(clearAuthError());
    }, [dispatch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear inline error as user types
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: '' }));
        }
        if (reduxError) dispatch(clearAuthError());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Client-side validation
        const errors = validate(formData);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }
        setFieldErrors({});

        const result = await dispatch(login(formData.email.trim(), formData.password));

        if (result?.success) {
            toast.success('Welcome back!');
            navigate('/dashboard', { replace: true });
            return;
        }

        // Account under review → redirect to pending page
        if (result?.isPending) {
            navigate('/pending', {
                replace: true,
                state: {
                    fromLogin: true,
                    message: result.error,
                    owner: result.owner,
                },
            });
            return;
        }
        
        // Account rejected/suspended → redirect to rejection page with reason
        if (result?.isRejected) {
            navigate('/rejected', {
                replace: true,
                state: {
                    fromLogin: true,
                    message: result.error,
                    owner: result.owner,
                },
            });
            return;
        }

        // Other errors are shown via the reduxError useEffect above
    };

    return (
        <>
            <Toaster richColors position="top-right" />

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

                    <CardContent>
                        {/* Global error banner (rejected / suspended) */}
                        {reduxError && !reduxError.toLowerCase().includes('under review') && (
                            <div
                                role="alert"
                                className="mb-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                            >
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{reduxError}</span>
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            noValidate
                            aria-label="Login form"
                        >
                            <div className="flex flex-col gap-5">

                                {/* Email */}
                                <div className="grid gap-1.5">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        ref={emailRef}
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        inputMode="email"
                                        placeholder="hello@cinevault.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={isLoading}
                                        aria-invalid={!!fieldErrors.email}
                                        aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                                        required
                                    />
                                    {fieldErrors.email && (
                                        <p id="email-error" className="text-xs text-destructive">{fieldErrors.email}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="grid gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Password</Label>
                                        <Link
                                            to="/forgot-password"
                                            tabIndex={-1}
                                            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            disabled={isLoading}
                                            className="pr-10"
                                            aria-invalid={!!fieldErrors.password}
                                            aria-describedby={fieldErrors.password ? 'pw-error' : undefined}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            tabIndex={-1}
                                            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {fieldErrors.password && (
                                        <p id="pw-error" className="text-xs text-destructive">{fieldErrors.password}</p>
                                    )}
                                </div>

                            </div>
                        </form>
                    </CardContent>

                    <CardFooter className="flex-col gap-3">
                        <Button
                            type="submit"
                            onClick={handleSubmit}
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    Signing in…
                                </span>
                            ) : 'Login'}
                        </Button>

                        <p className="text-sm text-muted-foreground text-center">
                            Don&apos;t have an account?{' '}
                            <Link
                                to="/register"
                                className="font-medium text-foreground hover:underline underline-offset-2"
                            >
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>

                </Card>
            </main>
        </>
    );
};

export default Login;
