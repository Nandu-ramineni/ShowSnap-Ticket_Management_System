import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { Lock, Loader } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import { resetPassword } from '@/Redux/Actions/authActions';
import Logo from '@/assets/Logo.png';

const ResetPassword = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { search } = useLocation();
    const params = new URLSearchParams(search);

    const token = params.get("token");
    const email = params.get("email");

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();

        const err = {};

        if (!password.trim()) {
            err.password = 'Password is required';
        } else if (password.length < 8) {
            err.password = 'Password must be at least 8 characters';
        }

        if (password !== confirmPassword) {
            err.confirmPassword = 'Passwords do not match';
        }

        setErrors(err);

        if (Object.keys(err).length > 0) return;

        setLoading(true);

        try {
            const result = await dispatch(
                resetPassword(email, token, password)
            );

            if (result?.success) {
                toast.success('Password reset successful');

                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            }
        } catch (error) {
            toast.error(
                error?.message || 'Failed to reset password'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center py-6 gap-1 select-none">
                    <img
                        src={Logo}
                        alt="CineVault logo"
                        className="w-16 h-16"
                    />
                    <h1 className="text-2xl font-bold">
                        CineVault!
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Your seats. Your cinema.
                    </p>
                </div>
                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5" />
                            Reset Password
                        </CardTitle>

                        <CardDescription>
                            Enter your new password
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label>New Password</Label>

                                <Input
                                    type="password"
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    disabled={loading}
                                />

                                {errors.password && (
                                    <p className="text-xs text-red-500">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Confirm Password</Label>

                                <Input
                                    type="password"
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    disabled={loading}
                                />

                                {errors.confirmPassword && (
                                    <p className="text-xs text-red-500">
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading && (
                                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                                )}

                                Reset Password
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ResetPassword;