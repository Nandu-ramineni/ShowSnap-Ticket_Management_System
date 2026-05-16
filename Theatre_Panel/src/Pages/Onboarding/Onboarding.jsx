import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { saveTheatreOnboarding } from '@/Redux/Actions/authActions';
import Logo from '@/assets/Logo.png';
import { selectCurrentUser } from '@/Redux/Selectors/authSelectors';
import { Checkbox } from '@/components/ui/checkbox';
import { ArtboardIcon, Atm02Icon, ChatCancelIcon, Location08Icon, MeetingRoomIcon, ModernTvIcon, Motion01Icon, ParkingAreaCircleIcon, Restaurant01Icon, SeatSelectorIcon, Speaker01Icon, Ticket01Icon, VirtualRealityVr01Icon, WheelchairIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

const DRAFT_KEY = 'theatre_onboarding_draft';

const StepProgress = ({ step, totalSteps = 4 }) => {
    const progress = (step / totalSteps) * 100;
    const steps = ['Theatre Info', 'Location', 'Amenities', 'Cancellation Policy'];

    return (
        <div className="w-full mb-8">
            <div className="flex gap-2 mb-4">
                {steps.map((label, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 mb-2 transition-all
                            ${step > idx + 1
                                ? 'bg-primary text-white border-primary/80'
                                : step === idx + 1
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-gray-100 text-primary border-gray-300'
                            }`}
                        >
                            {step > idx + 1 ? '✓' : idx + 1}
                        </div>
                        <span className={`text-xs text-center ${step >= idx + 1 ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

const AMENITIES = [
    { id: 'parking', label: 'Parking', icon: ParkingAreaCircleIcon },
    { id: 'foodCourt', label: 'Food Court', icon: Restaurant01Icon },
    { id: 'wheelchairAccess', label: 'Wheelchair Access', icon: WheelchairIcon },
    { id: 'mTicket', label: 'M-Ticket', icon: Ticket01Icon },
    { id: 'threeD', label: '3D', icon: VirtualRealityVr01Icon },
    { id: 'dolbySound', label: 'Dolby Sound', icon: Speaker01Icon },
    { id: 'fourDX', label: '4DX', icon: Motion01Icon },
    { id: 'reclinerSeats', label: 'Recliner Seats', icon: SeatSelectorIcon },
    { id: 'atm', label: 'ATM', icon: Atm02Icon },
    { id: 'lounge', label: 'Lounge', icon: MeetingRoomIcon},
];

const STEP_META = {
    1: { title: 'Theatre Information', desc: 'Tell us more info about your theatre', icon: ModernTvIcon },
    2: { title: 'Location Details', desc: 'Where is your theatre located?', icon: Location08Icon },
    3: { title: 'Amenities', desc: 'What amenities does your theatre offer?',icon: ArtboardIcon },
    4: { title: 'Cancellation Policy', desc: 'Set your cancellation policy',icon: ChatCancelIcon},
};

const Onboarding = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading } = useSelector((s) => s.auth);
    const reduxUser = useSelector(selectCurrentUser);
    const [step, setStep] = useState(1);
    const [errors, setErrors] = useState({});
    const meta = STEP_META[step];
    const [form, setForm] = useState({
        // Theatre Info
        isMultiplex: false,
        theatreInfo: {
            theatreName: reduxUser?.theatreInfo?.theatreName || '',
            website: '',
            contactPhone: '',
            contactEmail: '',
        },
        // Location
        location: {
            streetAddress: '',
            city: '',
            state: '',
            pincode: '',
        },
        // Amenities
        amenities: AMENITIES.reduce((acc, a) => ({ ...acc, [a.id]: false }), {}),
        // Cancellation Policy
        cancellationPolicy: {
            allowCancellations: false,
            cutoffHours: 2,
            refundPercentage: 100,
        },
    });


    // Auto-save draft
    useEffect(() => {
        const t = setTimeout(() => {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
        }, 500);
        return () => clearTimeout(t);
    }, [form]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => {
            const updated = { ...prev };
            const keys = name.split('.');

            if (keys.length === 1) {
                updated[name] = type === 'checkbox' ? checked : value;
            } else {
                const obj = updated[keys[0]];
                if (keys.length === 2) {
                    obj[keys[1]] = type === 'checkbox' ? checked : value;
                }
            }

            setErrors((prev) => ({ ...prev, [name]: '' }));
            return updated;
        });
    };

    const validateStep1 = () => {
        const err = {};

        if (!form.theatreInfo.theatreName.trim()) {
            err['theatreInfo.theatreName'] = 'Theatre name is required';
        }

        if (!form.theatreInfo.contactPhone.trim()) {
            err['theatreInfo.contactPhone'] = 'Contact phone is required';
        }

        if (!form.theatreInfo.contactEmail.trim()) {
            err['theatreInfo.contactEmail'] = 'Contact email is required';
        } else if (!/\S+@\S+\.\S+/.test(form.theatreInfo.contactEmail)) {
            err['theatreInfo.contactEmail'] = 'Invalid email format';
        }

        if (form.theatreInfo.website && !/^https?:\/\/.+/.test(form.theatreInfo.website)) {
            err['theatreInfo.website'] = 'Website must start with http:// or https://';
        }

        setErrors(err);
        Object.values(err).forEach((msg) => toast.error(msg));
        return Object.keys(err).length === 0;
    };

    const validateStep2 = () => {
        const err = {};

        if (!form.location.streetAddress.trim()) {
            err['location.streetAddress'] = 'Street address is required';
        }

        if (!form.location.city.trim()) {
            err['location.city'] = 'City is required';
        }

        if (!form.location.state.trim()) {
            err['location.state'] = 'State is required';
        }

        if (!form.location.pincode.trim()) {
            err['location.pincode'] = 'Pincode is required';
        } else if (!/^\d{4,10}$/.test(form.location.pincode)) {
            err['location.pincode'] = 'Pincode must be 4-10 digits';
        }

        setErrors(err);
        Object.values(err).forEach((msg) => toast.error(msg));
        return Object.keys(err).length === 0;
    };

    const validateStep3 = () => {
        // Amenities are optional, no validation needed
        return true;
    };

    const validateStep4 = () => {
        const err = {};

        if (form.cancellationPolicy.allowCancellations) {
            const hours = parseInt(form.cancellationPolicy.cutoffHours);
            if (hours < 0 || hours > 720) {
                err['cancellationPolicy.cutoffHours'] = 'Cutoff hours must be 0-720';
            }

            const refund = parseInt(form.cancellationPolicy.refundPercentage);
            if (refund < 0 || refund > 100) {
                err['cancellationPolicy.refundPercentage'] = 'Refund percentage must be 0-100';
            }
        }

        setErrors(err);
        Object.values(err).forEach((msg) => toast.error(msg));
        return Object.keys(err).length === 0;
    };

    const validateStep = (currentStep) => {
        switch (currentStep) {
            case 1:
                return validateStep1();
            case 2:
                return validateStep2();
            case 3:
                return validateStep3();
            case 4:
                return validateStep4();
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1);
            window.scrollTo(0, 0);
        }
    };

    const handlePrev = () => {
        setStep(step - 1);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async () => {
        if (!validateStep(step)) return;

        try {
            const result = await dispatch(saveTheatreOnboarding(form));
            if (result?.success) {
                localStorage.removeItem(DRAFT_KEY);
                toast.success('Onboarding completed successfully!');
                setTimeout(() => navigate('/dashboard'), 1500);
            }
        } catch (error) {
            toast.error(error?.message || 'Onboarding failed');
        }
    };

    return (
        <div className="min-h-screen  p-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex justify-center  items-center py-6 gap-1 select-none">
                        <img src={Logo} alt="CineVault logo" className="w-16 h-16" />
                        <div>
                            <h1 className="text-2xl font-bold ">CineVault!</h1>
                        <p className="text-[.7rem] text-muted-foreground">Your seats. Your cinema.</p>
                        </div>
                </div>

                {/* ── Greetings── */}
                {reduxUser && (
                    <div className="text-center pb-8">
                        <p className="text-lg font-semibold">
                            Holla, {reduxUser?.theatreInfo?.theatreName || reduxUser?.name}!
                        </p>
                        <p className="text-muted-foreground text-sm">
                            Complete your onboarding to set up into the CineVault universe. <br /> We promise it’s painless and quick!
                        </p>
                    </div>
                )}
                {/* Progress */}
                <StepProgress step={step} />

                {/* Form Card */}
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HugeiconsIcon icon={meta.icon} className="w-5 h-5 " />
                            {meta.title}
                        </CardTitle>

                        <CardDescription>
                            {meta.desc}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Step 1: Theatre Info */}
                        {step === 1 && (
                            <div className="space-y-4">

                                <div className='space-y-2'>
                                    <Label htmlFor="theatreName">Theatre Name *</Label>
                                    <Input
                                        id="theatreName"
                                        name="theatreInfo.theatreName"
                                        value={form.theatreInfo.theatreName}
                                        onChange={handleChange}
                                        placeholder="e.g., PVR Cinemas"
                                        className={errors['theatreInfo.theatreName'] ? 'border-red-500' : ''}
                                    />
                                    {errors['theatreInfo.theatreName'] && (
                                        <p className="text-xs text-red-500 mt-1">{errors['theatreInfo.theatreName']}</p>
                                    )}
                                </div>

                                <div className='space-y-2'>
                                    <Label htmlFor="website">Website (Optional)</Label>
                                    <Input
                                        id="website"
                                        name="theatreInfo.website"
                                        value={form.theatreInfo.website}
                                        onChange={handleChange}
                                        placeholder="https://yourtheatre.com"
                                        className={errors['theatreInfo.website'] ? 'border-red-500' : ''}
                                    />
                                    {errors['theatreInfo.website'] && (
                                        <p className="text-xs text-red-500 mt-1">{errors['theatreInfo.website']}</p>
                                    )}
                                </div>

                                <div className='space-y-2'>
                                    <Label htmlFor="contactPhone">Contact Phone *</Label>
                                    <Input
                                        id="contactPhone"
                                        name="theatreInfo.contactPhone"
                                        value={form.theatreInfo.contactPhone}
                                        onChange={handleChange}
                                        placeholder="+91-9876543210"
                                        className={errors['theatreInfo.contactPhone'] ? 'border-red-500' : ''}
                                    />
                                    {errors['theatreInfo.contactPhone'] && (
                                        <p className="text-xs text-red-500 mt-1">{errors['theatreInfo.contactPhone']}</p>
                                    )}
                                </div>

                                <div className='space-y-2'>
                                    <Label htmlFor="contactEmail">Contact Email *</Label>
                                    <Input
                                        id="contactEmail"
                                        name="theatreInfo.contactEmail"
                                        type="email"
                                        value={form.theatreInfo.contactEmail}
                                        onChange={handleChange}
                                        placeholder="contact@theatre.com"
                                        className={errors['theatreInfo.contactEmail'] ? 'border-red-500' : ''}
                                    />
                                    {errors['theatreInfo.contactEmail'] && (
                                        <p className="text-xs text-red-500 mt-1">{errors['theatreInfo.contactEmail']}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Location */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="streetAddress">Street Address *</Label>
                                    <Input
                                        id="streetAddress"
                                        name="location.streetAddress"
                                        value={form.location.streetAddress}
                                        onChange={handleChange}
                                        placeholder="123 Main Street"
                                        className={errors['location.streetAddress'] ? 'border-red-500' : ''}
                                    />
                                    {errors['location.streetAddress'] && (
                                        <p className="text-xs text-red-500 mt-1">{errors['location.streetAddress']}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City *</Label>
                                        <Input
                                            id="city"
                                            name="location.city"
                                            value={form.location.city}
                                            onChange={handleChange}
                                            placeholder="Mumbai"
                                            className={errors['location.city'] ? 'border-red-500' : ''}
                                        />
                                        {errors['location.city'] && (
                                            <p className="text-xs text-red-500 mt-1">{errors['location.city']}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="state">State *</Label>
                                        <Input
                                            id="state"
                                            name="location.state"
                                            value={form.location.state}
                                            onChange={handleChange}
                                            placeholder="Maharashtra"
                                            className={errors['location.state'] ? 'border-red-500' : ''}
                                        />
                                        {errors['location.state'] && (
                                            <p className="text-xs text-red-500 mt-1">{errors['location.state']}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pincode">Pincode *</Label>
                                    <Input
                                        id="pincode"
                                        name="location.pincode"
                                        value={form.location.pincode}
                                        onChange={handleChange}
                                        placeholder="400001"
                                        className={errors['location.pincode'] ? 'border-red-500' : ''}
                                    />
                                    {errors['location.pincode'] && (
                                        <p className="text-xs text-red-500 mt-1">{errors['location.pincode']}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Amenities */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {AMENITIES.map((amenity) => (
                                        <div key={amenity.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-secondary cursor-pointer">
                                            <Checkbox
                                                id={amenity.id}
                                                checked={form.amenities[amenity.id]}
                                                onCheckedChange={(checked) => {
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        amenities: {
                                                            ...prev.amenities,
                                                            [amenity.id]: Boolean(checked),
                                                        },
                                                    }));
                                                }}
                                            />
                                            <label htmlFor={amenity.id} className="flex-1 cursor-pointer flex items-center gap-2">
                                                <HugeiconsIcon icon={amenity.icon} className="w-5 h-5" />
                                                <span className="text-sm font-medium">{amenity.label}</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Cancellation Policy */}
                        {step === 4 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-secondary">
                                    <input
                                        type="checkbox"
                                        id="allowCancellations"
                                        name="cancellationPolicy.allowCancellations"
                                        checked={form.cancellationPolicy.allowCancellations}
                                        onChange={handleChange}
                                        className="w-4 h-4 cursor-pointer"
                                    />
                                    <label htmlFor="allowCancellations" className="text-sm font-medium cursor-pointer">
                                        Allow booking cancellations
                                    </label>
                                </div>

                                {form.cancellationPolicy.allowCancellations && (
                                    <div className="space-y-4 p-4 bg-muted rounded-lg">
                                        <div className="space-y-2">
                                            <Label htmlFor="cutoffHours">
                                                Cancellation Cutoff (hours before showtime)
                                            </Label>
                                            <Input
                                                id="cutoffHours"
                                                name="cancellationPolicy.cutoffHours"
                                                type="number"
                                                value={form.cancellationPolicy.cutoffHours}
                                                onChange={handleChange}
                                                min="0"
                                                max="720"
                                                className={errors['cancellationPolicy.cutoffHours'] ? 'border-red-500' : ''}
                                            />
                                            {errors['cancellationPolicy.cutoffHours'] && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {errors['cancellationPolicy.cutoffHours']}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">Default: 2 hours</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="refundPercentage">Refund Percentage (%)</Label>
                                            <Input
                                                id="refundPercentage"
                                                name="cancellationPolicy.refundPercentage"
                                                type="number"
                                                value={form.cancellationPolicy.refundPercentage}
                                                onChange={handleChange}
                                                min="0"
                                                max="100"
                                                className={errors['cancellationPolicy.refundPercentage'] ? 'border-red-500' : ''}
                                            />
                                            {errors['cancellationPolicy.refundPercentage'] && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {errors['cancellationPolicy.refundPercentage']}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">Default: 100% refund</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <div className="flex gap-3 mt-6">
                    {step > 1 && (
                        <Button
                            variant="outline"
                            onClick={handlePrev}
                            className="flex items-center gap-2"
                            disabled={isLoading}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </Button>
                    )}

                    {step < 4 && (
                        <Button
                            onClick={handleNext}
                            className="flex-1 flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader className="w-4 h-4 animate-spin" />}
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    )}

                    {step === 4 && (
                        <Button
                            onClick={handleSubmit}
                            className="flex-1 flex items-center justify-center gap-2 "
                            disabled={isLoading}
                        >
                            {isLoading && <Loader className="w-4 h-4 animate-spin" />}
                            Complete Onboarding
                        </Button>
                    )}
                </div>

                {/* Step indicator text */}
                <div className="text-center mt-4 text-sm text-gray-500">
                    Step {step} of 4
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
