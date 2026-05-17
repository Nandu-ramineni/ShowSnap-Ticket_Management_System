import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Mail,
    Lock,
    ArrowRight,
    Loader,
    ChevronLeft,
} from 'lucide-react';

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

import Logo from '@/assets/Logo.png';

import {
    requestPasswordReset,
    verifyOTPAndGenerateToken,
} from '@/Redux/Actions/authActions';

const STEPS = {
    EMAIL: 1,
    OTP: 2,
    SUCCESS: 3,
};

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [step, setStep] = useState(STEPS.EMAIL);
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState('');

    const [otp, setOtp] = useState([
        '',
        '',
        '',
        '',
        '',
        '',
    ]);

    const [errors, setErrors] = useState({});

    const inputRefs = useRef([]);

    // ─────────────────────────────────────────────────────────────
    // Step 1: Request OTP
    // ─────────────────────────────────────────────────────────────

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
            const result = await dispatch(
                requestPasswordReset(email)
            );

            if (result?.success) {
                toast.success('OTP sent to your email');

                setStep(STEPS.OTP);
            }
        } catch (error) {
            toast.error(
                error?.message || 'Failed to send OTP'
            );
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // Step 2: Verify OTP
    // ─────────────────────────────────────────────────────────────

    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        const err = {};

        const otpValue = otp.join('');

        if (!otpValue.trim()) {
            err.otp = 'OTP is required';
        } else if (otpValue.length !== 6) {
            err.otp = 'OTP must be 6 digits';
        }

        setErrors(err);

        if (Object.keys(err).length > 0) return;

        setLoading(true);

        try {
            const result = await dispatch(
                verifyOTPAndGenerateToken(
                    email,
                    otp.join('')
                )
            );

            if (result?.success) {
                toast.success(
                    'OTP verified successfully. Check your inbox for reset instructions.'
                );

                setStep(STEPS.SUCCESS);
            }
        } catch (error) {
            toast.error(
                error?.message || 'Invalid OTP'
            );
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // OTP Handlers
    // ─────────────────────────────────────────────────────────────

    const handleOtpChange = (value, index) => {
        if (!/^\d?$/.test(value)) return;

        const updatedOtp = [...otp];

        updatedOtp[index] = value;

        setOtp(updatedOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        setErrors({
            ...errors,
            otp: '',
        });
    };

    const handleOtpKeyDown = (e, index) => {
        if (
            e.key === 'Backspace' &&
            !otp[index] &&
            index > 0
        ) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();

        const pastedData = e.clipboardData
            .getData('text')
            .replace(/\D/g, '')
            .slice(0, 6);

        if (!pastedData) return;

        const updatedOtp = [...otp];

        pastedData.split('').forEach((char, index) => {
            updatedOtp[index] = char;
        });

        setOtp(updatedOtp);

        const nextIndex = Math.min(
            pastedData.length,
            5
        );

        inputRefs.current[nextIndex]?.focus();

        setErrors({
            ...errors,
            otp: '',
        });
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
                {/* Progress */}
                <div className="flex gap-2 mb-8">
                    {[
                        STEPS.EMAIL,
                        STEPS.OTP,
                        STEPS.SUCCESS,
                    ].map((s) => (
                        <div
                            key={s}
                            className={`flex-1 h-1 rounded-full transition-all ${step >= s
                                ? 'bg-primary'
                                : 'bg-gray-300'
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
                            {step === STEPS.SUCCESS && (
                                <>
                                    <Mail className="w-5 h-5" />
                                    Check Your Inbox
                                </>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {step === STEPS.EMAIL &&
                                'Enter your email to receive an OTP'}
                            {step === STEPS.OTP &&
                                'Enter the 6-digit OTP sent to your email'}
                            {step === STEPS.SUCCESS &&
                                'Password reset instructions sent successfully'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={
                                step === STEPS.EMAIL
                                    ? handleRequestOTP
                                    : handleVerifyOTP
                            }
                            className="space-y-4"
                        >

                            {/* STEP 1 */}
                            {step === STEPS.EMAIL && (
                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your-email@theatre.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(
                                                e.target.value
                                            );
                                            setErrors({
                                                ...errors,
                                                email: '',
                                            });
                                        }}
                                        className={ errors.email ? 'border-red-500': ''}
                                        disabled={loading}
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-red-500">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* STEP 2 */}

                            {step === STEPS.OTP && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-center block">
                                            Enter Verification Code
                                        </Label>
                                        <div className="flex justify-center gap-2">
                                            {otp.map((digit, index) => (
                                                <Input
                                                    key={index}
                                                    ref={(el) => (inputRefs.current[index] = el)}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={(e) =>
                                                        handleOtpChange(e.target.value, index)
                                                    }
                                                    onKeyDown={(e) =>
                                                        handleOtpKeyDown(e, index)
                                                    }
                                                    onPaste={handleOtpPaste}
                                                    className={`w-10 h-10 text-center text-xl font-semibold ${errors.otp ? 'border-red-500' : ''}`}
                                                    disabled={loading}
                                                />
                                            ))}
                                        </div>
                                        {errors.otp && (
                                            <p className="text-xs text-red-500 text-center">
                                                {errors.otp}
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-500 text-center">
                                            OTP is valid for 10 minutes
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3 */}
                            {step === STEPS.SUCCESS && (
                                <div className="text-center space-y-4 py-6">
                                    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                        <Mail className="w-8 h-8 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            Check Your Inbox
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            We have sent a password reset link to:
                                        </p>
                                        <p className="font-medium mt-1">
                                            {email}
                                        </p>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        The reset link will expire in 15 minutes.
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
                                {step !== STEPS.SUCCESS && (
                                    <Button
                                        type="submit"
                                        className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-700"
                                        disabled={loading}
                                    >
                                        {loading && (
                                            <Loader className="w-4 h-4 animate-spin" />
                                        )}
                                        {step === STEPS.EMAIL &&
                                            'Send OTP'}
                                        {step === STEPS.OTP &&
                                            'Verify OTP'}
                                        {!loading && (
                                            <ArrowRight className="w-4 h-4" />
                                        )}
                                    </Button>
                                )}
                                {step === STEPS.SUCCESS && (
                                    <Button
                                        type="button"
                                        className="flex-1"
                                        onClick={() =>
                                            navigate('/login')
                                        }
                                    >
                                        Back to Login
                                    </Button>
                                )}
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="mt-6 pt-6 border-t text-center text-sm">
                            <p className="text-gray-600 mb-2">
                                Remembered your password?
                            </p>
                            <Link
                                to="/login"
                                className="text-muted-foreground hover:underline font-medium"
                            >
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