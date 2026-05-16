import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';




const PAGE_TITLES = {
    '/dashboard': 'Dashboard',
    '/theatre': 'Theatre Profile',
    '/screens': 'Screen Manager',
    '/shows': 'Show Scheduler',
    '/seatmap': 'Live Seat Map',
    '/layout-editor': 'Seat Layout Editor',
    '/bookings': 'Bookings & Transactions',
    '/reports': 'Revenue Reports',
    '/reviews': 'Reviews & Ratings',
    '/notifications': 'Notifications',
    '/team': 'Team Management',
    '/settings': 'Settings',
};

const AppLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const pageTitle = PAGE_TITLES[location.pathname] || 'SeatSecure';

    return (
        <div className="min-h-screen bg-background flex overflow-hidden">
    
    {/* Sidebar */}
    <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
    />

    {/* Main Layout */}
    <div className="flex-1 flex flex-col lg:ml-64 min-w-0 h-screen">
        
        {/* Fixed TopBar */}
        <div className="fixed top-0 right-0 left-0 lg:left-64 z-40 bg-background border-b">
            <TopBar
                onMenuClick={() => setSidebarOpen(true)}
                pageTitle={pageTitle}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto pt-16 px-4">
            <Outlet />
        </main>
    </div>
</div>
    );
};

export default AppLayout;