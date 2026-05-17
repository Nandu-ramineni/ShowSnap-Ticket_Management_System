import {  useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/Redux/Selectors/authSelectors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    MapPin,
    Phone,
    Mail,
    Globe,
    Building2,
    BarChart3,
    Lock,
    Edit,
} from 'lucide-react';

const AMENITIES_LABELS = {
    parking: '🅿️ Parking',
    foodCourt: '🍿 Food Court',
    wheelchairAccess: '♿ Wheelchair Access',
    mTicket: '📱 M-Ticket',
    threeD: '🎬 3D',
    dolbySound: '🔊 Dolby Sound',
    fourDX: '🎢 4DX',
    reclinerSeats: '🛋️ Recliner Seats',
    atm: '🏧 ATM',
    lounge: '☕ Lounge',
};

const TheatreProfile = () => {
    const owner = useSelector(selectCurrentUser);
    const [isEditMode, setIsEditMode] = useState(false);

    if (!owner) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Loading theatre profile...</p>
            </div>
        );
    }

    const {
        theatreInfo = {},
        location = {},
        amenities = {},
        cancellationPolicy = {},
        traction = {},
        isMultiplex,
        onboardingStatus,
        accountStatus,
    } = owner;

    const activeAmenities = Object.entries(amenities)
        .filter(([_, isActive]) => isActive)
        .map(([key]) => key);

    return (
        <div className="min-h-screen p-4">
            <div className="mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold ">Theatre Profile</h1>
                        <p className="text-muted-foreground mt-1">Manage your theatre information</p>
                    </div>
                    <Button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className="flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        {isEditMode ? 'View' : 'Edit'}
                    </Button>
                </div>
                {isEditMode && (
                    <div className="my-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800">
                            💡 Edit mode is coming soon! You'll be able to update your theatre information here.
                        </p>
                    </div>
                )}

                {/* Status Badges */}
                <div className="flex gap-3 mb-8">
                    <Badge variant={onboardingStatus === 'completed' ? 'default' : 'secondary'}>
                        Onboarding: {onboardingStatus?.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                    <Badge variant={accountStatus === 'active' ? 'default' : 'secondary'}>
                        Account: {accountStatus?.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                    {isMultiplex && <Badge variant="outline">Multiplex Chain</Badge>}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Theatre Information Card */}
                    <Card className="md:col-span-2 lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                Theatre Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Theatre Name</label>
                                <p className="text-lg font-semibold  mt-1">
                                    {theatreInfo?.theatreName || 'Not provided'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        Contact Phone
                                    </label>
                                    <p className=" mt-1">
                                        {theatreInfo?.contactPhone || 'Not provided'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Contact Email
                                    </label>
                                    <p className=" mt-1">
                                        {theatreInfo?.contactEmail || 'Not provided'}
                                    </p>
                                </div>
                            </div>

                            {theatreInfo?.website && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                        <Globe className="w-4 h-4" />
                                        Website
                                    </label>
                                    <a
                                        href={theatreInfo.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline mt-1 block"
                                    >
                                        {theatreInfo.website}
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Account Stats Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                Login Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Total Logins</p>
                                <p className="text-2xl font-bold ">
                                    {traction?.loginCounts || 0}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Active Sessions</p>
                                <p className="text-2xl font-bold ">
                                    {traction?.activeLogins || 0}
                                </p>
                            </div>
                            {traction?.lastLogin && (
                                <div>
                                    <p className="text-sm text-gray-600">Last Login</p>
                                    <p className="text-sm  mt-1">
                                        {new Date(traction.lastLogin).toLocaleString()}
                                    </p>
                                </div>
                            )}
                            {traction?.lastLocation && (
                                <div>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        Last Location
                                    </p>
                                    <p className="text-sm  mt-1">
                                        {traction.lastLocation.city && `${traction.lastLocation.city}, `}
                                        {traction.lastLocation.region && `${traction.lastLocation.region}, `}
                                        {traction.lastLocation.country}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Location Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Address</p>
                                <p className=" mt-1">
                                    {location?.streetAddress || 'Not provided'}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">City</p>
                                    <p className=" mt-1">
                                        {location?.city || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">State</p>
                                    <p className=" mt-1">
                                        {location?.state || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pincode</p>
                                <p className=" mt-1">
                                    {location?.pincode || 'N/A'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Amenities Card */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Amenities</CardTitle>
                            <CardDescription>
                                {activeAmenities.length} amenities available
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {activeAmenities.length > 0 ? (
                                    activeAmenities.map((amenity) => (
                                        <Badge key={amenity} variant="outline" className="py-2 px-3">
                                            {AMENITIES_LABELS[amenity] || amenity}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-gray-500 col-span-full">No amenities listed</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cancellation Policy Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="w-5 h-5" />
                                Cancellation Policy
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Cancellations Allowed</p>
                                <Badge
                                    variant={cancellationPolicy?.allowCancellations ? 'default' : 'secondary'}
                                    className="mt-1"
                                >
                                    {cancellationPolicy?.allowCancellations ? 'Yes' : 'No'}
                                </Badge>
                            </div>

                            {cancellationPolicy?.allowCancellations && (
                                <>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Cutoff Hours</p>
                                        <p className=" mt-1">
                                            {cancellationPolicy?.cutoffHours || 0} hours before showtime
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Refund Percentage</p>
                                        <p className=" mt-1">
                                            {cancellationPolicy?.refundPercentage || 0}%
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                
                
            </div>
        </div>
    );
};

export default TheatreProfile;
