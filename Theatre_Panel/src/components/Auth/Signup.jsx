import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '@/assets/Logo.png';
import { clientRegister } from '@/redux/Actions/authActions';
import { toast, Toaster } from 'sonner'; // FIX 2a: import Toaster so toasts actually render
import { FileText, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';

/* ─────────────────────────────────────────────
   SECURITY FIX: Never persist sensitive auth
   fields to localStorage. Only save safe fields.
───────────────────────────────────────────── */
const DRAFT_KEY = 'cinevault_signup_draft';

const SAFE_FIELDS = ['name', 'email']; // ← password & confirmPassword intentionally excluded

const saveDraft = ({ form, step, agreed, viewedPolicy }) => {
    const safeDraft = {
        step,
        agreed,
        viewedPolicy,
        form: Object.fromEntries(
            Object.entries(form).filter(([k]) => SAFE_FIELDS.includes(k))
        ),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(safeDraft));
};

/* ─────────────────────────────────────────────
   Step progress indicator (no changes needed)
───────────────────────────────────────────── */
const StepProgress = ({ step }) => {
    const progress = step === 1 ? 50 : 100;
    return (
        <div className="w-1/2 mb-6 mx-auto">
            <div className="relative">
                <div className="h-2 bg-muted rounded-full" />
                <div
                    className="h-2 bg-primary rounded-full absolute top-0 left-0 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
                <div className="absolute top-3 -left-3 -translate-y-1/2 flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold border transition-all
                        ${step >= 1 ? 'bg-primary text-white border-primary' : 'bg-muted text-muted-foreground'}`}>
                        1
                    </div>
                    <span className={`text-xs mt-1 ${step >= 1 ? 'text-primary font-medium' : ''}`}>Details</span>
                </div>
                <div className="absolute top-3 -right-6 -translate-y-1/2 flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold border transition-all
                        ${step >= 2 ? 'bg-primary text-white border-primary' : 'bg-muted text-muted-foreground'}`}>
                        2
                    </div>
                    <span className={`text-xs mt-1 ${step >= 2 ? 'text-primary font-medium' : ''}`}>Documents</span>
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   Document type definitions
───────────────────────────────────────────── */
const DOCUMENT_TYPES = [
    { id: 'gst_certificate', label: 'GST Certificate', desc: 'Tax registration document', required: true },
    { id: 'business_registration', label: 'Business Registration', desc: 'Company registration proof', required: true },
    { id: 'trade_license', label: 'Trade License', desc: 'Municipal approval document', required: true },
    { id: 'pan_card', label: 'PAN Card', desc: 'Tax identity document', required: true },
    { id: 'identity_proof', label: 'Identity Proof', desc: 'Owner identity proof', required: true },
    { id: 'address_proof', label: 'Address Proof', desc: 'Utility bill or bank statement', required: true },
    { id: 'noc', label: 'NOC', desc: 'No objection certificate', required: true },
    { id: 'other', label: 'Other Documents', desc: 'Optional documents', required: false },
];

/* ─────────────────────────────────────────────
   Password regex (shared so it's defined once)
───────────────────────────────────────────── */
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

/* ═══════════════════════════════════════════════════════
   SIGNUP COMPONENT
═══════════════════════════════════════════════════════ */
const Signup = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading } = useSelector((s) => s.auth);

    const [step, setStep] = useState(1);
    const [uploading, setUploading] = useState({});

    /* FIX 4a: All form fields are in state so controlled inputs
       always reflect the current value when switching steps.     */
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        documents: {},
        theatreName: '',
        isMultiplex: null,
    });

    const [errors, setErrors] = useState({});
    const [agreed, setAgreed] = useState(false);
    const [viewedPolicy, setViewedPolicy] = useState(false);

    /* ─── Restore draft (only safe fields) ─── */
    useEffect(() => {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (!saved) return;
        try {
            const parsed = JSON.parse(saved);
            setForm((prev) => ({
                ...prev,
                // Only restore non-sensitive fields
                ...(parsed.form?.name ? { name: parsed.form.name } : {}),
                ...(parsed.form?.email ? { email: parsed.form.email } : {}),
            }));
            setStep(parsed.step || 1);
            setAgreed(parsed.agreed || false);
            setViewedPolicy(parsed.viewedPolicy || false);
        } catch {
            localStorage.removeItem(DRAFT_KEY);
        }
    }, []);

    /* ─── Auto-save (safe fields only) ─── */
    useEffect(() => {
        const t = setTimeout(() => saveDraft({ form, step, agreed, viewedPolicy }), 500);
        return () => clearTimeout(t);
    }, [form, step, agreed, viewedPolicy]);

    /* ─── Generic field handler ─── */
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => {
            const updated = { ...prev, [name]: value };
            const newErrors = { ...errors };

            if (name === 'password') {
                if (!PASSWORD_REGEX.test(value)) {
                    newErrors.password = 'Password must be 8+ chars, include a letter, number & special character';
                } else {
                    delete newErrors.password;
                }
                // Re-check confirm when password changes
                if (updated.confirmPassword && value !== updated.confirmPassword) {
                    newErrors.confirmPassword = 'Passwords do not match';
                } else if (updated.confirmPassword) {
                    delete newErrors.confirmPassword;
                }
            }

            if (name === 'confirmPassword') {
                if (value !== updated.password) {
                    newErrors.confirmPassword = 'Passwords do not match';
                } else {
                    delete newErrors.confirmPassword;
                }
            }

            setErrors(newErrors);
            return updated;
        });
    };

    /* ─── File upload handler ─── */
    const handleFile = async (e, id) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading((p) => ({ ...p, [id]: true }));
        await new Promise((r) => setTimeout(r, 600)); // simulate upload
        setForm((p) => ({ ...p, documents: { ...p.documents, [id]: file } }));
        setUploading((p) => ({ ...p, [id]: false }));
    };

    /* ─────────────────────────────────────────────
       FIX 2b + FIX 3: validateStep1 now fires a
       toast for EVERY error, and the Next button
       won't advance until ALL fields pass.
    ───────────────────────────────────────────── */
    const validateStep1 = () => {
        const err = {};

        if (!form.name.trim()) {
            err.name = 'Theatre name is required';
        }

        if (!form.email.trim()) {
            err.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            err.email = 'Invalid email format';
        }

        if (!form.theatreName.trim()) {
            err.theatreName = 'Theatre name is required';
        }

        if (form.isMultiplex === null) {
            err.isMultiplex = 'Please select theatre type';
        }

        if (!form.password) {
            err.password = 'Password is required';
        } else if (!PASSWORD_REGEX.test(form.password)) {
            err.password = 'Password must be 8+ chars, include a letter, number & special character';
        }

        if (!form.confirmPassword) {
            err.confirmPassword = 'Please confirm your password';
        } else if (form.password !== form.confirmPassword) {
            err.confirmPassword = 'Passwords do not match';
        }

        setErrors(err);

        // FIX 2b: toast every error, not just name/email
        Object.values(err).forEach((msg) => toast.error(msg));

        return Object.keys(err).length === 0;
    };

    const validateStep2 = () => {
        for (const doc of DOCUMENT_TYPES.filter((d) => d.required)) {
            if (!form.documents[doc.id]) {
                const msg = `Please upload: ${doc.label}`;
                setErrors({ doc: msg });
                toast.error(msg);
                return false;
            }
        }

        if (!viewedPolicy) {
            const msg = 'Please read the Privacy Policy before accepting';
            setErrors({ policy: msg });
            toast.error(msg);
            return false;
        }

        if (!agreed) {
            const msg = 'You must agree to the Terms & Conditions';
            setErrors({ policy: msg });
            toast.error(msg);
            return false;
        }

        return true;
    };

    /* ─── Advance to step 2 ─── */
    const handleNext = () => {
        // FIX 3: validateStep1 must return true before setStep(2) is ever called
        if (validateStep1()) {
            setErrors({});
            setStep(2);
        }
    };

    /* ─── Go back to step 1 ─── */
    const handleBack = () => {
        // FIX 4b: step state changes but form state is unchanged, so
        // controlled inputs automatically re-display the saved values.
        setErrors({});
        setStep(1);
    };

    /* ─── Final submit ─── */
    const submit = async (e) => {
        e.preventDefault();
        if (!validateStep2()) return;

        const result = await dispatch(
            clientRegister({
                name: form.name,
                email: form.email,
                password: form.password,
                theatreName: form.theatreName,
                isMultiplex: form.isMultiplex,
                documents: Object.entries(form.documents).map(([k, v]) => ({
                    docType: k,
                    file: v,
                })),
            })
        );

        if (!result?.errors) {
            localStorage.removeItem(DRAFT_KEY);
            toast.success('Account created! Please log in.');
            navigate('/login');
        }
    };

    /* ═══════════════════════════════════════════
        RENDER
    ═══════════════════════════════════════════ */
    return (
        <>
            {/* FIX 2a: Toaster must be mounted for sonner toasts to appear */}
            <Toaster richColors position="top-right" />

            <main className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
                <Card className="w-full max-w-4xl shadow-xl">

                    <div className="flex flex-col items-center py-6 gap-1 select-none">
                        <img src={Logo} alt="CineVault logo" className="w-16 h-16" />
                        <h1 className="text-2xl font-bold">CineVault!</h1>
                        <p className="text-sm text-muted-foreground">Your seats. Your cinema.</p>
                    </div>

                    <div className="flex justify-center">
                        <StepProgress step={step} />
                    </div>

                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">

                            {/* ── STEP 1 ── */}
                            {step === 1 && (
                                <div className="grid md:grid-cols-2 gap-4">

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="name">Owner Name</Label>
                                        {/* FIX 4c: value prop makes this a controlled input */}
                                        <Input
                                            id="name"
                                            name="name"
                                            placeholder="John Doe"
                                            value={form.name}
                                            onChange={handleChange}
                                        />
                                        {errors.name && (
                                            <p className="text-red-500 text-sm">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="owner@cinevault.com"
                                            value={form.email}
                                            onChange={handleChange}
                                        />
                                        {errors.email && (
                                            <p className="text-red-500 text-sm">{errors.email}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="theatreName">Theatre Name</Label>
                                        <Input
                                            id="theatreName"
                                            name="theatreName"
                                            placeholder="Grand Cinema"
                                            value={form.theatreName}
                                            onChange={handleChange}
                                        />
                                        {errors.theatreName && (
                                            <p className="text-red-500 text-sm">{errors.theatreName}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="password">Password</Label>
                                        {/*
                                            FIX 4c + SECURITY: controlled input.
                                            Password is in component state only — never persisted.
                                        */}
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            placeholder="Password"
                                            value={form.password}
                                            onChange={handleChange}
                                        />
                                        {errors.password && (
                                            <p className="text-red-500 text-sm">{errors.password}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            name="confirmPassword"
                                            placeholder="Confirm Password"
                                            value={form.confirmPassword}
                                            onChange={handleChange}
                                        />
                                        {errors.confirmPassword && (
                                            <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                                        )}
                                    </div>
                                    <div className="md:col-span-1 space-y-2">
                                        <Label>Theatre Type</Label>

                                        <div className="grid grid-cols-2 gap-3">

                                            {/* Single Screen */}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        isMultiplex: false,
                                                    }))
                                                }
                                                className={`justify-center items-center  transition-all
                ${form.isMultiplex === false
                                                        ? 'border-primary bg-primary text-primary ring-2 ring-primary/20 hover:bg-primary/10'
                                                        : 'hover:border-primary/40'
                                                    }`}
                                            >
                                                <div className="text-left space-y-1">
                                                    <h3 className="font-medium">Single Screen</h3>

                                                </div>
                                            </Button>

                                            {/* Multiplex */}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        isMultiplex: true,
                                                    }))
                                                }
                                                className={`justify-center items-center  transition-all
                ${form.isMultiplex === true
                                                        ? 'border-primary bg-primary text-white ring-2 ring-primary/20 '
                                                        : 'hover:border-primary/40'
                                                    }`}
                                            >
                                                <div className="text-left space-y-1">
                                                    <h3 className="font-medium">Multiplex</h3>

                                                </div>
                                            </Button>

                                        </div>

                                        {errors.isMultiplex && (
                                            <p className="text-sm text-red-500">
                                                {errors.isMultiplex}
                                            </p>
                                        )}
                                    </div>

                                    {/* FIX 3: onClick calls handleNext which gates on validateStep1() */}
                                    <Button type="button" onClick={handleNext} className="md:col-span-2">
                                        Next →
                                    </Button>
                                </div>
                            )}

                            {/* ── STEP 2 ── */}
                            {step === 2 && (
                                <>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {DOCUMENT_TYPES.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="border p-3 rounded-xl grid grid-cols-[1fr_1fr] gap-4 items-center"
                                            >
                                                {/* LEFT SIDE */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1">
                                                        <Label>{doc.label}</Label>
                                                        {doc.required && (
                                                            <span className="text-red-500 text-xs">*</span>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-muted-foreground">
                                                        {doc.desc}
                                                    </p>

                                                    {uploading[doc.id] ? (
                                                        <p className="text-xs text-blue-500">Uploading…</p>
                                                    ) : form.documents[doc.id] ? (
                                                        <p className="text-xs text-green-600 flex items-center gap-1">
                                                            <CheckCircle2 size={12} /> Uploaded
                                                        </p>
                                                    ) : null}
                                                </div>

                                                {/* RIGHT SIDE */}
                                                <div>
                                                    <Input
                                                        type="file"
                                                        accept="application/pdf,image/*"
                                                        onChange={(e) => handleFile(e, doc.id)}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t pt-4 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="agreed"
                                                checked={agreed}
                                                disabled={!viewedPolicy}
                                                onCheckedChange={setAgreed}
                                            />
                                            <Label htmlFor="agreed" className="cursor-pointer">
                                                I agree to the Terms &amp; Conditions
                                            </Label>
                                            <Link
                                                to="/privacy-agreement-policy"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => setViewedPolicy(true)}
                                                className="text-blue-600 text-sm underline inline-flex items-center gap-1"
                                            >
                                                <FileText size={14} />
                                                Open Privacy Policy
                                            </Link>
                                        </div>



                                        {!viewedPolicy && (
                                            <p className="text-xs text-muted-foreground">
                                                You must open the policy before accepting.
                                            </p>
                                        )}

                                        {errors.policy && (
                                            <p className="text-red-500 text-xs">{errors.policy}</p>
                                        )}
                                        {errors.doc && (
                                            <p className="text-red-500 text-xs">{errors.doc}</p>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* ── NAV BUTTONS ── */}
                            <div className="flex gap-3">
                                {step === 2 && (
                                    /* FIX 4b: handleBack only resets step, form state is preserved */
                                    <Button type="button" variant="outline" onClick={handleBack}>
                                        ← Back
                                    </Button>
                                )}
                                {step === 2 && (
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? 'Creating…' : 'Create Account'}
                                    </Button>
                                )}
                            </div>

                        </form>
                    </CardContent>
                </Card>
            </main>
        </>
    );
};

export default Signup;