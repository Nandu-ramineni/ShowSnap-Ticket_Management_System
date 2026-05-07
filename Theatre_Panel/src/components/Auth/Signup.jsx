import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';

import Logo from '@/assets/Logo.png';
import { clientRegister } from '@/redux/Actions/authActions';

import {
    FileText,
    CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

const DOCUMENT_TYPES = [
    {
        id: 'gst_certificate',
        label: 'GST Certificate',
        desc: 'Mandatory tax registration document',
        required: true,
    },
    {
        id: 'business_registration',
        label: 'Business Registration',
        desc: 'Company registration certificate',
        required: true,
    },
    {
        id: 'trade_license',
        label: 'Municipal Trade License',
        desc: 'Local authority approval document',
        required: true,
    },
    {
        id: 'pan_card',
        label: 'PAN Card',
        desc: 'Tax identification document',
        required: true,
    },
    {
        id: 'identity_proof',
        label: 'Identity Proof',
        desc: 'Owner identity verification (Aadhaar/Passport)',
        required: true,
    },
    {
        id: 'address_proof',
        label: 'Address Proof',
        desc: 'Utility bill or bank statement',
        required: true,
    },
    {
        id: 'noc',
        label: 'NOC',
        desc: 'No objection certificate from authority',
        required: true,
    },
    {
        id: 'other',
        label: 'Other Documents',
        desc: 'Optional supporting documents',
        required: false,
    },
];

const Signup = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading } = useSelector((s) => s.auth);

    const [step, setStep] = useState(1);

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        documents: {},
        selected: new Set(
            DOCUMENT_TYPES.filter((d) => d.required).map((d) => d.id)
        ),
    });

    const [errors, setErrors] = useState({});
    const [agreed, setAgreed] = useState(false);
    const [viewedPolicy, setViewedPolicy] = useState(false);

    // ─────────────────────────────
    // LIVE VALIDATION (NO TOAST)
    // ─────────────────────────────
    const validateField = (name, value) => {
        let msg = '';

        if (name === 'password') {
            if (value.length < 8)
                msg = 'Password must be at least 8 characters';
            else if (!/[0-9]/.test(value))
                msg = 'Password must contain a number';
            else if (!/[!@#$%^&*]/.test(value))
                msg = 'Password must contain a special character';
        }

        if (name === 'confirmPassword') {
            if (value !== form.password)
                msg = 'Passwords do not match';
        }

        setErrors((p) => ({ ...p, [name]: msg }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((p) => ({ ...p, [name]: value }));

        validateField(name, value);
    };

    const handleFile = (e, id) => {
        const file = e.target.files?.[0];

        setForm((p) => ({
            ...p,
            documents: {
                ...p.documents,
                [id]: file,
            },
        }));
    };

    // ─────────────────────────────
    // STEP VALIDATION
    // ─────────────────────────────
    const validateStep1 = () => {
        const newErr = {};

        if (!form.name) newErr.name = 'Name required';
        if (!form.email) newErr.email = 'Email required';
        if (form.password.length < 8)
            newErr.password = 'Weak password';
        if (form.password !== form.confirmPassword)
            newErr.confirmPassword = 'Passwords do not match';

        setErrors(newErr);

        return Object.keys(newErr).length === 0;
    };

    const validateStep2 = () => {
        const required = DOCUMENT_TYPES.filter((d) => d.required);

        for (const doc of required) {
            if (!form.documents[doc.id]) {
                setErrors({ doc: `Missing ${doc.label}` });
                return false;
            }
        }

        if (!viewedPolicy || !agreed) {
            setErrors({ policy: 'Accept policy required' });
            return false;
        }

        return true;
    };

    // ─────────────────────────────
    // SUBMIT
    // ─────────────────────────────
    const submit = async (e) => {
        e.preventDefault();

        if (!validateStep2()) return;

        const documents = Array.from(form.selected).map((id) => ({
            docType: id,
            file: form.documents[id],
        }));

        const res = await dispatch(
            clientRegister({
                name: form.name,
                email: form.email,
                password: form.password,
                documents,
            })
        );

        if (res?.success) navigate('/login');
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <Card className="w-full max-w-4xl shadow-xl">

                {/* HEADER */}
                <CardHeader className="text-center space-y-2">
                    <img src={Logo} className="w-14 mx-auto" />
                    <CardTitle>CineVault Signup</CardTitle>

                    {/* STEP INDICATOR */}
                    <div className="flex justify-center gap-3 text-sm mt-2">
                        <span className={step === 1 ? 'font-bold' : ''}>1. Details</span>
                        <span>→</span>
                        <span className={step === 2 ? 'font-bold' : ''}>2. Documents</span>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={submit} className="space-y-6">

                        {/* ───── STEP 1 ───── */}
                        {step === 1 && (
                            <div className="grid md:grid-cols-2 gap-4">

                                <div>
                                    <Label>Name</Label>
                                    <Input name="name" onChange={handleChange} />
                                    {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                                </div>

                                <div>
                                    <Label>Email</Label>
                                    <Input name="email" onChange={handleChange} />
                                    {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                                </div>

                                <div>
                                    <Label>Password</Label>
                                    <Input type="password" name="password" onChange={handleChange} />
                                    {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                                </div>

                                <div>
                                    <Label>Confirm Password</Label>
                                    <Input type="password" name="confirmPassword" onChange={handleChange} />
                                    {errors.confirmPassword && (
                                        <p className="text-red-500 text-xs">
                                            {errors.confirmPassword}
                                        </p>
                                    )}
                                </div>

                            </div>
                        )}

                        {/* ───── STEP 2 ───── */}
                        {step === 2 && (
                            <>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {DOCUMENT_TYPES.map((doc) => (
                                        <div key={doc.id} className="border p-3 rounded-xl">
                                            <Label className="flex items-center gap-2">
                                                <FileText size={14} />
                                                {doc.label}
                                                {doc.required && <span className="text-red-500">*</span>}
                                            </Label>

                                            <p className="text-xs text-muted-foreground mb-2">
                                                {doc.desc}
                                            </p>

                                            <Input type="file" onChange={(e) => handleFile(e, doc.id)} />

                                            {form.documents[doc.id] && (
                                                <div className="text-green-600 text-xs flex items-center gap-1 mt-1">
                                                    <CheckCircle2 size={12} /> uploaded
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* POLICY */}
                                <div className="space-y-2 border-t pt-4">
                                    <Checkbox
                                        checked={agreed}
                                        disabled={!viewedPolicy}
                                        onCheckedChange={setAgreed}
                                    />
                                    <Label>I agree to Terms & Privacy Policy</Label>

                                    <Link
                                        to="/privacy-agreement-policy"
                                        target="_blank"
                                        onClick={() => setViewedPolicy(true)}
                                        className="text-blue-600 text-sm underline"
                                    >
                                        Open Privacy Policy
                                    </Link>

                                    {errors.policy && (
                                        <p className="text-red-500 text-xs">
                                            {errors.policy}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* BUTTONS */}
                        <div className="flex gap-3">
                            {step === 2 && (
                                <Button type="button" onClick={() => setStep(1)}>
                                    Back
                                </Button>
                            )}

                            {step === 1 && (
                                <Button
                                    type="button"
                                    onClick={() => validateStep1() && setStep(2)}
                                >
                                    Next
                                </Button>
                            )}

                            {step === 2 && (
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Creating...' : 'Create Account'}
                                </Button>
                            )}
                        </div>

                    </form>
                </CardContent>
            </Card>
        </main>
    );
};

export default Signup;