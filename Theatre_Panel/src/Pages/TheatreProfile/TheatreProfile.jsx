import { useNavigate } from 'react-router-dom';
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
import {  Atm02Icon,  MeetingRoomIcon, Motion01Icon, ParkingAreaCircleIcon, Restaurant01Icon, SeatSelectorIcon, Speaker01Icon, Ticket01Icon, VirtualRealityVr01Icon, WheelchairIcon } from '@hugeicons/core-free-icons';
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
    { id: 'lounge', label: 'Lounge', icon: MeetingRoomIcon},
];

const TheatreProfile = () => {
    const owner = useSelector(selectCurrentUser);
    const navigate = useNavigate();

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
        .filter(([amenity, isActive]) => isActive)
        .map(([key]) => key);

    return (
        <div className=" p-4">
            <div className="mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start pb-4">
                    <div>
                        <h1 className="text-3xl font-bold ">Theatre Profile</h1>
                        <p className="text-muted-foreground mt-1">Manage your theatre information</p>
                    </div>
                    <Button
                        onClick={() => navigate('/theatre/edit')}
                        className="flex items-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        Edit
                    </Button>
                </div>

                {/* Status Badges */}
                <div className="flex gap-3 mb-8">
                    <Badge variant={onboardingStatus === 'completed' ? 'default' : 'secondary'}>
                        Onboarding: {onboardingStatus?.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                    <Badge variant={accountStatus === 'active' ? 'default' : 'secondary'} className="p-2">
                        Account: {accountStatus?.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                    {isMultiplex && <Badge variant="outline">Multiplex Chain</Badge>}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Theatre Information Card */}
                    <Card className="">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                Theatre Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Column 1 */}
                            <div className="grid grid-rows-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        Theatre Name
                                    </label>
                                    <p className="text-lg font-semibold mt-1">
                                        {theatreInfo?.theatreName || 'Not provided'}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        Contact Phone
                                    </label>
                                    <p className="mt-1">
                                        {theatreInfo?.contactPhone || 'Not provided'}
                                    </p>
                                </div>
                            </div>

                            {/* Column 2 */}
                            <div className="grid grid-rows-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Contact Email
                                    </label>
                                    <p className="mt-1">
                                        {theatreInfo?.contactEmail || 'Not provided'}
                                    </p>
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
                            </div>

                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Location
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Column 1 */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Address
                                    </p>
                                    <p className="mt-1">
                                        {location?.streetAddress || 'Not provided'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        City
                                    </p>
                                    <p className="mt-1">
                                        {location?.city || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Column 2 */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        State
                                    </p>
                                    <p className="mt-1">
                                        {location?.state || 'N/A'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Pincode
                                    </p>
                                    <p className="mt-1">
                                        {location?.pincode || 'N/A'}
                                    </p>
                                </div>
                            </div>

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

                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Column 1 */}
                            <div className="grid grid-rows-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Total Logins
                                    </p>

                                    <p className="text-2xl font-bold">
                                        {traction?.loginCounts || 0}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600">
                                        Active Sessions
                                    </p>

                                    <p className="text-2xl font-bold">
                                        {traction?.activeLogins || 0}
                                    </p>
                                </div>
                            </div>

                            {/* Column 2 */}
                            <div className="grid grid-rows-2 gap-6">

                                {traction?.lastLogin && (
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Last Login
                                        </p>

                                        <p className="text-sm mt-1">
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

                                        <p className="text-sm mt-1">
                                            {traction.lastLocation.city &&
                                                `${traction.lastLocation.city}, `}
                                            {traction.lastLocation.region &&
                                                `${traction.lastLocation.region}, `}
                                            {traction.lastLocation.country}
                                        </p>
                                    </div>
                                )}

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
                                        <div
                                            key={amenity}
                                            className="flex items-center gap-2 p-3 bg-sidebar/50 rounded-lg border"
                                        >
                                            <HugeiconsIcon
                                                icon={AMENITIES.find((a) => a.id === amenity)?.icon}
                                                className="w-5 h-5 "
                                            />
                                            <span className="text-sm ">
                                                {AMENITIES.find((a) => a.id === amenity)?.label ||
                                                    amenity}
                                            </span>
                                        </div>
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
