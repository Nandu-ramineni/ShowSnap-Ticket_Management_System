import {  useState } from 'react';
import { Link } from 'react-router-dom';
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


// ─── Component ────────────────────────────────────────────────────────────────
const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Submitting:', formData);
    }
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

                <CardContent>
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
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    inputMode="email"
                                    placeholder="hello@cinevault.com"
                                    value={formData.email}
                                    onChange={handleChange}
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
                                    required
                                />
                            </div>

                        </div>
                    </form>
                </CardContent>

                <CardFooter className="flex-col gap-3">
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full"
                    >
                        Login
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
    );
};

export default Login;