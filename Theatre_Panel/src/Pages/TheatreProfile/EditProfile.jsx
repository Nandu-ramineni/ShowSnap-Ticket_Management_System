import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { updateTheatreProfile } from '@/Redux/Actions/authActions';
import { selectCurrentUser, selectAuthLoading, selectAuthError } from '@/Redux/Selectors/authSelectors';
import {
    Atm02Icon,
    MeetingRoomIcon,
    Motion01Icon,
    ParkingAreaCircleIcon,
    Restaurant01Icon,
    SeatSelectorIcon,
    Speaker01Icon,
    Ticket01Icon,
    VirtualRealityVr01Icon,
    WheelchairIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

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
    { id: 'lounge', label: 'Lounge', icon: MeetingRoomIcon },
];

export default function EditProfile() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const owner = useSelector(selectCurrentUser);
    const isLoading = useSelector(selectAuthLoading);
    const error = useSelector(selectAuthError);

    const [formData, setFormData] = useState({
        name: '',
        isMultiplex: false,
        theatreInfo: {
            theatreName: '',
            website: '',
            contactPhone: '',
            contactEmail: '',
        },
        location: {
            streetAddress: '',
            city: '',
            state: '',
            pincode: '',
        },
        amenities: AMENITIES.reduce((acc, a) => ({ ...acc, [a.id]: false }), {}),
        cancellationPolicy: {
            allowCancellations: false,
            cutoffHours: 2,
            refundPercentage: 100,
        },
    });

    const [errors, setErrors] = useState({});

    // Initialize form with current user data
    useEffect(() => {
        if (owner) {
            setFormData({
                name: owner.name || '',
                isMultiplex: owner.isMultiplex || false,
                theatreInfo: {
                    theatreName: owner.theatreInfo?.theatreName || '',
                    website: owner.theatreInfo?.website || '',
                    contactPhone: owner.theatreInfo?.contactPhone || '',
                    contactEmail: owner.theatreInfo?.contactEmail || '',
                },
                location: {
                    streetAddress: owner.location?.streetAddress || '',
                    city: owner.location?.city || '',
                    state: owner.location?.state || '',
                    pincode: owner.location?.pincode || '',
                },
                amenities: owner.amenities || AMENITIES.reduce((acc, a) => ({ ...acc, [a.id]: false }), {}),
                cancellationPolicy: owner.cancellationPolicy || {
                    allowCancellations: false,
                    cutoffHours: 2,
                    refundPercentage: 100,
                },
            });
        }
    }, [owner]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => {
            const updated = { ...prev };
            const keys = name.split('.');

            if (keys.length === 1) {
                updated[name] = type === 'checkbox' ? checked : value;
            } else if (keys.length === 2) {
                const obj = updated[keys[0]];
                obj[keys[1]] = type === 'checkbox' ? checked : value;
            }

            // Clear error for this field
            setErrors((prev) => ({ ...prev, [name]: '' }));
            return updated;
        });
    };

    const validateForm = () => {
        const newErrors = {};

        // Owner name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Owner name is required';
        } else if (formData.name.length > 150) {
            newErrors.name = 'Owner name must be 150 characters or fewer';
        }

        // Website validation (if provided)
        if (formData.theatreInfo.website && !isValidUrl(formData.theatreInfo.website)) {
            newErrors['theatreInfo.website'] = 'Please enter a valid URL';
        }

        // Phone validation (if provided)
        if (formData.theatreInfo.contactPhone && !isValidPhone(formData.theatreInfo.contactPhone)) {
            newErrors['theatreInfo.contactPhone'] = 'Please enter a valid phone number';
        }

        // Email validation (if provided)
        if (formData.theatreInfo.contactEmail && !isValidEmail(formData.theatreInfo.contactEmail)) {
            newErrors['theatreInfo.contactEmail'] = 'Please enter a valid email';
        }

        // Location validation
        if (formData.location.streetAddress && formData.location.streetAddress.length > 200) {
            newErrors['location.streetAddress'] = 'Street address must be 200 characters or fewer';
        }
        if (formData.location.city && formData.location.city.length > 100) {
            newErrors['location.city'] = 'City must be 100 characters or fewer';
        }
        if (formData.location.state && formData.location.state.length > 100) {
            newErrors['location.state'] = 'State must be 100 characters or fewer';
        }
        if (formData.location.pincode && !isValidPincode(formData.location.pincode)) {
            newErrors['location.pincode'] = 'Pincode must be 4-10 digits';
        }

        // Cancellation policy validation
        if (formData.cancellationPolicy.cutoffHours < 0 || formData.cancellationPolicy.cutoffHours > 720) {
            newErrors['cancellationPolicy.cutoffHours'] = 'Cutoff hours must be between 0 and 720';
        }
        if (formData.cancellationPolicy.refundPercentage < 0 || formData.cancellationPolicy.refundPercentage > 100) {
            newErrors['cancellationPolicy.refundPercentage'] = 'Refund percentage must be between 0 and 100';
        }

        return newErrors;
    };

    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const isValidPhone = (phone) => {
        return /^[0-9\+\-\s\(\)]{10,}$/.test(phone);
    };

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const isValidPincode = (pincode) => {
        return /^\d{4,10}$/.test(pincode);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fix the errors in the form');
            return;
        }

        try {
            // Only send fields that might have changed (exclude immutable theatreName)
            const updateData = {
                name: formData.name,
                isMultiplex: formData.isMultiplex,
                theatreInfo: {
                    website: formData.theatreInfo.website,
                    contactPhone: formData.theatreInfo.contactPhone,
                    // email is intentionally excluded from update (immutable) - can be changed via support only
                    // theatreName is intentionally excluded (immutable)
                },
                location: formData.location,
                amenities: formData.amenities,
                cancellationPolicy: formData.cancellationPolicy,
            };

            await dispatch(updateTheatreProfile(updateData));
            toast.success('Profile updated successfully!');
            navigate('/theatre');
        } catch (err) {
            console.error('Error updating profile:', err);
            toast.error('An error occurred while updating the profile. Please try again.');
        }
    };

    const handleCancel = () => {
        navigate('/theatre');
    };

    return (
        <div className="min-h-screen p-6">
            <div className=" mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancel}
                        className="h-8 w-8"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">Edit Theatre Profile</h1>
                        <p className="text-muted-foreground mt-1">Update your theatre information</p>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                    {/* Owner Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Owner Information</CardTitle>
                            <CardDescription>Your personal details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Owner Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your full name"
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Theatre Name</Label>
                                <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-muted-foreground">
                                    <Lock className="h-4 w-4 text-gray-900" />
                                    <span className="text-gray-900">{formData.theatreInfo.theatreName}</span>
                                    <span className="text-xs text-gray-900 ml-auto">(Read-only)</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Contact support to change theatre name</p>
                            </div>

                            <div className="pt-4 border-t">
                                <label className="flex items-center gap-2">
                                    <Checkbox
                                        name="isMultiplex"
                                        checked={formData.isMultiplex}
                                        onCheckedChange={(checked) =>
                                            setFormData((prev) => ({ ...prev, isMultiplex: checked }))
                                        }
                                    />
                                    <span className="text-sm font-medium">This is a multiplex chain</span>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Theatre Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Theatre Contact</CardTitle>
                            <CardDescription>Contact details for your theatre</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    name="theatreInfo.website"
                                    type="url"
                                    value={formData.theatreInfo.website}
                                    onChange={handleChange}
                                    placeholder="https://example.com"
                                    className={errors['theatreInfo.website'] ? 'border-red-500' : ''}
                                />
                                {errors['theatreInfo.website'] && (
                                    <p className="text-xs text-red-600 mt-1">{errors['theatreInfo.website']}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contactPhone">Contact Phone</Label>
                                    <Input
                                        id="contactPhone"
                                        name="theatreInfo.contactPhone"
                                        type="tel"
                                        value={formData.theatreInfo.contactPhone}
                                        onChange={handleChange}
                                        placeholder="+91 9876543210"
                                        className={errors['theatreInfo.contactPhone'] ? 'border-red-500' : ''}
                                    />
                                    {errors['theatreInfo.contactPhone'] && (
                                        <p className="text-xs text-red-600 mt-1">{errors['theatreInfo.contactPhone']}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                <Label>Contact Email</Label>
                                <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-muted-foreground">
                                    <Lock className="h-4 w-4 text-gray-900" />
                                    <span className="text-gray-900">{formData.theatreInfo.contactEmail}</span>
                                    <span className="text-xs text-gray-900 ml-auto">(Read-only)</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Contact support to change contact email</p>
                            </div>
                                
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Location</CardTitle>
                            <CardDescription>Theatre address details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="streetAddress">Street Address</Label>
                                <Input
                                    id="streetAddress"
                                    name="location.streetAddress"
                                    value={formData.location.streetAddress}
                                    onChange={handleChange}
                                    placeholder="123 Main Street"
                                    className={errors['location.streetAddress'] ? 'border-red-500' : ''}
                                />
                                {errors['location.streetAddress'] && (
                                    <p className="text-xs text-red-600 mt-1">{errors['location.streetAddress']}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        name="location.city"
                                        value={formData.location.city}
                                        onChange={handleChange}
                                        placeholder="Mumbai"
                                        className={errors['location.city'] ? 'border-red-500' : ''}
                                    />
                                    {errors['location.city'] && (
                                        <p className="text-xs text-red-600 mt-1">{errors['location.city']}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        name="location.state"
                                        value={formData.location.state}
                                        onChange={handleChange}
                                        placeholder="Maharashtra"
                                        className={errors['location.state'] ? 'border-red-500' : ''}
                                    />
                                    {errors['location.state'] && (
                                        <p className="text-xs text-red-600 mt-1">{errors['location.state']}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pincode">Pincode</Label>
                                    <Input
                                        id="pincode"
                                        name="location.pincode"
                                        value={formData.location.pincode}
                                        onChange={handleChange}
                                        placeholder="400001"
                                        className={errors['location.pincode'] ? 'border-red-500' : ''}
                                    />
                                    {errors['location.pincode'] && (
                                        <p className="text-xs text-red-600 mt-1">{errors['location.pincode']}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Cancellation Policy */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Cancellation Policy</CardTitle>
                            <CardDescription>Set your refund and cancellation rules</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <label className="flex items-center gap-2">
                                <Checkbox
                                    name="cancellationPolicy.allowCancellations"
                                    checked={formData.cancellationPolicy.allowCancellations}
                                    onCheckedChange={(checked) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            cancellationPolicy: { ...prev.cancellationPolicy, allowCancellations: checked },
                                        }))
                                    }
                                />
                                <span className="text-sm font-medium">Allow cancellations</span>
                            </label>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cutoffHours">Cancellation Cutoff Hours</Label>
                                    <Input
                                        id="cutoffHours"
                                        name="cancellationPolicy.cutoffHours"
                                        type="number"
                                        min="0"
                                        max="720"
                                        value={formData.cancellationPolicy.cutoffHours}
                                        onChange={handleChange}
                                        className={errors['cancellationPolicy.cutoffHours'] ? 'border-red-500' : ''}
                                    />
                                    {errors['cancellationPolicy.cutoffHours'] && (
                                        <p className="text-xs text-red-600 mt-1">{errors['cancellationPolicy.cutoffHours']}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="refundPercentage">Refund Percentage (%)</Label>
                                    <Input
                                        id="refundPercentage"
                                        name="cancellationPolicy.refundPercentage"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.cancellationPolicy.refundPercentage}
                                        onChange={handleChange}
                                        className={errors['cancellationPolicy.refundPercentage'] ? 'border-red-500' : ''}
                                    />
                                    {errors['cancellationPolicy.refundPercentage'] && (
                                        <p className="text-xs text-red-600 mt-1">{errors['cancellationPolicy.refundPercentage']}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>


                    {/* Amenities */}
                    <Card className="col-span-2">
                        <CardHeader>
                            <CardTitle>Amenities</CardTitle>
                            <CardDescription>What amenities does your theatre offer?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {AMENITIES.map((amenity) => {
                                    const Icon = amenity.icon;
                                    return (
                                        <label key={amenity.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted cursor-pointer">
                                            <Checkbox
                                                name={`amenities.${amenity.id}`}
                                                checked={formData.amenities[amenity.id] || false}
                                                onCheckedChange={(checked) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        amenities: { ...prev.amenities, [amenity.id]: checked },
                                                    }))
                                                }
                                            />
                                            <HugeiconsIcon icon={Icon} className="w-5 h-5 text-gray-600" />
                                            <span className="text-sm font-medium">{amenity.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    
                    {/* Form Actions */}
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1"
                        >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
