import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import {
    DashboardSquare01Icon,
    OfficeIcon,
    ModernTvIcon,
    Calendar03Icon,
    SeatSelectorIcon,
    BookOpen01Icon,
    ChartIcon,
    StarIcon,
    Notification01Icon,
    Settings01Icon,
    ArrowRight01Icon,
    ZapIcon,
    UserGroupIcon,
    Edit02Icon,
    Logout01Icon
} from '@hugeicons/core-free-icons';
import { selectCurrentUser } from '@/Redux/Selectors/authSelectors';
import { logout } from '@/Redux/Actions/authActions';
import Logo from '@/assets/Logo.png';
const navItems = [
    { icon: DashboardSquare01Icon, label: 'Dashboard', path: '/dashboard' },
    { icon: OfficeIcon, label: 'Theatre Profile', path: '/theatre' },
    { icon: ModernTvIcon, label: 'Screens', path: '/screens' },
    { icon: Calendar03Icon, label: 'Show Scheduler', path: '/shows' },
    { icon: SeatSelectorIcon, label: 'Live Seat Map', path: '/seatmap' },
    { icon: Edit02Icon, label: 'Layout Editor', path: '/layout-editor' },
    { icon: BookOpen01Icon, label: 'Bookings', path: '/bookings', badge: 3 },
    { icon: ChartIcon, label: 'Revenue Reports', path: '/reports' },
    { icon: StarIcon, label: 'Reviews', path: '/reviews' },
    { icon: Notification01Icon, label: 'Notifications', path: '/notifications', badge: 5 },
    { icon: UserGroupIcon, label: 'Team', path: '/team' },
    { icon: Settings01Icon, label: 'Settings', path: '/settings' },
];

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector(selectCurrentUser);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login', { replace: true });
    };

    // Derive initials from logged-in user's name
    const initials = user?.name
        ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    const roleName = user?.role
        ? user.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'Theatre Owner';

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside className={`
                fixed left-0 top-0 h-full w-64 z-50
                bg-sidebar text-white border-r border-sidebar-border
                flex flex-col
                transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>

                {/* ── Logo ─────────────────────────────────────────────── */}
                <div className="flex justify-center items-center p-2 gap-1 select-none">
                    <img src={Logo} alt="CineVault logo" className="w-16 h-16" />
                    <div>
                        <h1 className="text-xl font-bold tracking-wider">CineVault!</h1>
                        <p className="text-[8px] text-muted-foreground">Your seats. Your cinema.</p>
                    </div>
                </div>

                {/* ── Theatre badge ─────────────────────────────────────── */}
                <div className="px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">PVR Andheri West</p>
                            <p className="text-xs text-muted-foreground">6 screens • Live</p>
                        </div>
                        <HugeiconsIcon icon={ZapIcon} size={14} className="text-yellow-400" />
                    </div>
                </div>

                {/* ── Navigation ───────────────────────────────────────── */}
                <nav className="flex-1 overflow-y-auto py-4 px-3">
                    <div className="space-y-0.5">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={onClose}
                                    className={`
                                        group flex items-center gap-3 px-3 py-2.5 rounded-lg
                                        text-sm font-medium transition-all duration-150
                                        ${isActive
                                            ? 'bg-sidebar-accent text-brand'
                                            : 'text-muted-foreground hover:text-white hover:bg-white/5'
                                        }
                                    `}
                                >
                                    <HugeiconsIcon
                                        icon={item.icon}
                                        size={18}
                                        strokeWidth={1.5}
                                        className={isActive ? 'text-brand' : 'text-muted-foreground group-hover:text-white'}
                                    />
                                    <span className="flex-1">{item.label}</span>
                                    {item.badge && (
                                        <Badge className="bg-brand text-white text-xs px-1.5 py-0 h-5 min-w-5 flex items-center justify-center rounded-full">
                                            {item.badge}
                                        </Badge>
                                    )}
                                    {isActive && <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-brand" />}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* ── User footer ───────────────────────────────────────── */}
                <div className="px-4 py-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-3 py-2">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-orange-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {initials}
                        </div>
                        {/* Name + role */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name ?? 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">{roleName}</p>
                        </div>
                        {/* Logout icon button */}
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="text-muted-foreground hover:text-red-400 transition-colors p-1 rounded flex-shrink-0"
                        >
                            <HugeiconsIcon icon={Logout01Icon} size={16} />
                        </button>
                    </div>
                </div>

            </aside>
        </>
    );
}