import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Loader, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/assets/Logo.png';
import { requestPasswordReset, verifyOTPAndGenerateToken, resetPassword } from '@/Redux/Actions/authActions';

const STEPS = {
    EMAIL: 1,
    OTP: 2,
    NEW_PASSWORD: 3,
};

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [step, setStep] = useState(STEPS.EMAIL);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [errors, setErrors] = useState({});

    // ─── Step 1: Request OTP ───────────────────────────────────────────────────
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        const err = {};

        if (!email.trim()) {
            err.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            err.email = 'Invalid email format';
        }

        setErrors(err);
        if (Object.keys(err).length > 0) return;

        setLoading(true);
        try {
            const result = await dispatch(requestPasswordReset(email));
            if (result?.success) {
                toast.success('OTP sent to your email');
                setStep(STEPS.OTP);
            }
        } catch (error) {
            toast.error(error?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 2: Verify OTP ────────────────────────────────────────────────────
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const err = {};

        if (!otp.trim()) {
            err.otp = 'OTP is required';
        } else if (otp.length !== 6) {
            err.otp = 'OTP must be 6 digits';
        }

        setErrors(err);
        if (Object.keys(err).length > 0) return;

        setLoading(true);
        try {
            const result = await dispatch(verifyOTPAndGenerateToken(email, otp));
            if (result?.success) {
                toast.success('OTP verified! Check your email for reset link');
                // In a real scenario, you'd receive the reset token here
                // For now, we'll prompt user to enter it manually
                setStep(STEPS.NEW_PASSWORD);
            }
        } catch (error) {
            toast.error(error?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 3: Reset Password ────────────────────────────────────────────────
    const handleResetPassword = async (e) => {
        e.preventDefault();
        const err = {};

        if (!resetToken.trim()) {
            err.resetToken = 'Reset token is required';
        }

        if (!newPassword.trim()) {
            err.newPassword = 'New password is required';
        } else if (newPassword.length < 8) {
            err.newPassword = 'Password must be at least 8 characters';
        }

        if (!confirmPassword.trim()) {
            err.confirmPassword = 'Please confirm password';
        } else if (newPassword !== confirmPassword) {
            err.confirmPassword = 'Passwords do not match';
        }

        setErrors(err);
        if (Object.keys(err).length > 0) return;

        setLoading(true);
        try {
            const result = await dispatch(resetPassword(email, resetToken, newPassword));
            if (result?.success) {
                toast.success('Password reset successful! Redirecting to login...');
                setTimeout(() => navigate('/login'), 1500);
            }
        } catch (error) {
            toast.error(error?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step > STEPS.EMAIL) {
            setStep(step - 1);
            setErrors({});
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="flex flex-col items-center py-6 gap-1 select-none">
                    <img src={Logo} alt="CineVault logo" className="w-16 h-16" />
                    <h1 className="text-2xl font-bold">CineVault!</h1>
                    <p className="text-sm text-muted-foreground">Your seats. Your cinema.</p>
                </div>

                {/* Progress Indicator */}
                <div className="flex gap-2 mb-8">
                    {[STEPS.EMAIL, STEPS.OTP, STEPS.NEW_PASSWORD].map((s) => (
                        <div
                            key={s}
                            className={`flex-1 h-1 rounded-full transition-all ${
                                step >= s ? 'bg-primary' : 'bg-gray-300'
                            }`}
                        />
                    ))}
                </div>

                {/* Card */}
                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {step === STEPS.EMAIL && (
                                <>
                                    <Mail className="w-5 h-5" />
                                    Forgot Password
                                </>
                            )}
                            {step === STEPS.OTP && (
                                <>
                                    <Lock className="w-5 h-5" />
                                    Verify OTP
                                </>
                            )}
                            {step === STEPS.NEW_PASSWORD && (
                                <>
                                    <Lock className="w-5 h-5" />
                                    Reset Password
                                </>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {step === STEPS.EMAIL && 'Enter your email to receive an OTP'}
                            {step === STEPS.OTP && 'Enter the 6-digit OTP sent to your email'}
                            {step === STEPS.NEW_PASSWORD && 'Enter your new password'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={
                            step === STEPS.EMAIL
                                ? handleRequestOTP
                                : step === STEPS.OTP
                                    ? handleVerifyOTP
                                    : handleResetPassword
                        } className="space-y-4">
                            {/* Step 1: Email */}
                            {step === STEPS.EMAIL && (
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your-email@theatre.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setErrors({ ...errors, email: '' });
                                        }}
                                        className={errors.email ? 'border-red-500' : ''}
                                        disabled={loading}
                                    />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                                </div>
                            )}

                            {/* Step 2: OTP */}
                            {step === STEPS.OTP && (
                                <div className="space-y-2">
                                    <Label htmlFor="otp">Enter OTP</Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => {
                                            setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                                            setErrors({ ...errors, otp: '' });
                                        }}
                                        maxLength="6"
                                        className={`text-center text-lg tracking-widest ${
                                            errors.otp ? 'border-red-500' : ''
                                        }`}
                                        disabled={loading}
                                    />
                                    {errors.otp && <p className="text-xs text-red-500">{errors.otp}</p>}
                                    <p className="text-xs text-gray-500">OTP is valid for 10 minutes</p>
                                </div>
                            )}

                            {/* Step 3: New Password */}
                            {step === STEPS.NEW_PASSWORD && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="resetToken">Reset Token (from email)</Label>
                                        <Input
                                            id="resetToken"
                                            type="text"
                                            placeholder="Paste the token from reset link"
                                            value={resetToken}
                                            onChange={(e) => {
                                                setResetToken(e.target.value);
                                                setErrors({ ...errors, resetToken: '' });
                                            }}
                                            className={errors.resetToken ? 'border-red-500' : ''}
                                            disabled={loading}
                                        />
                                        {errors.resetToken && (
                                            <p className="text-xs text-red-500">{errors.resetToken}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="newPassword">New Password</Label>
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                setErrors({ ...errors, newPassword: '' });
                                            }}
                                            className={errors.newPassword ? 'border-red-500' : ''}
                                            disabled={loading}
                                        />
                                        {errors.newPassword && (
                                            <p className="text-xs text-red-500">{errors.newPassword}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="Confirm password"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                setErrors({ ...errors, confirmPassword: '' });
                                            }}
                                            className={errors.confirmPassword ? 'border-red-500' : ''}
                                            disabled={loading}
                                        />
                                        {errors.confirmPassword && (
                                            <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    className="flex items-center gap-2"
                                    disabled={loading}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-700"
                                    disabled={loading}
                                >
                                    {loading && <Loader className="w-4 h-4 animate-spin" />}
                                    {step === STEPS.EMAIL && 'Send OTP'}
                                    {step === STEPS.OTP && 'Verify OTP'}
                                    {step === STEPS.NEW_PASSWORD && 'Reset Password'}
                                    {!loading && <ArrowRight className="w-4 h-4" />}
                                </Button>
                            </div>
                        </form>

                        {/* Help Text */}
                        <div className="mt-6 pt-6 border-t text-center text-sm">
                            <p className="text-gray-600 mb-2">Remembered your password?</p>
                            <Link to="/login" className="text-blue-600 hover:underline font-medium">
                                Back to Login
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPassword;
