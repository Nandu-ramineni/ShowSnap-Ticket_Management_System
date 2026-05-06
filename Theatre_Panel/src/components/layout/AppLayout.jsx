import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';




const PAGE_TITLES = {
    '/dashboard':     'Dashboard',
    '/theatre':       'Theatre Profile',
    '/screens':       'Screen Manager',
    '/shows':         'Show Scheduler',
    '/seatmap':       'Live Seat Map',
    '/layout-editor': 'Seat Layout Editor',
    '/bookings':      'Bookings & Transactions',
    '/reports':       'Revenue Reports',
    '/reviews':       'Reviews & Ratings',
    '/notifications': 'Notifications',
    '/team':          'Team Management',
    '/settings':      'Settings',
};

const AppLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const pageTitle = PAGE_TITLES[location.pathname] || 'SeatSecure';

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
                <TopBar onMenuClick={() => setSidebarOpen(true)} pageTitle={pageTitle} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className="flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;