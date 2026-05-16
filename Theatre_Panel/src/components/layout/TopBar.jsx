import { Bell, Wifi, WifiOff, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PanelLeftIcon, PanelRightIcon, PowerIcon } from '@hugeicons/core-free-icons';

const TopBar = ({
    onMenuClick,
    pageTitle,
    isDesktop,
    isOpen,
    setIsOpen
}) => {

    const isLive = true;

    const [timer, setTimer] = useState(() =>
        new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        })
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer(
                new Date().toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })
            );
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const today = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const toggleSidebar = () => {
        if (isDesktop) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className="h-14 border-b border-sidebar-border bg-sidebar backdrop-blur-md flex items-center gap-4 px-4 lg:px-6 w-full">

            {/* MOBILE MENU */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-muted-foreground hover:text-white"
                onClick={onMenuClick}
            >
                <Menu className="w-5 h-5" />
            </Button>

            {/* TITLE + DESKTOP TOGGLE */}
            <div className="flex items-center flex-1">

                {/* Desktop sidebar toggle */}
                {isDesktop && (
                    <button
                        onClick={toggleSidebar}
                        className="hidden md:block mr-2 text-muted-foreground hover:text-white transition"
                    >
                        <HugeiconsIcon
                            icon={isOpen ? PanelLeftIcon : PanelRightIcon}
                            size={16}
                        />
                    </button>
                )}

                <h2 className="text-white font-semibold text-base hidden sm:block">
                    {pageTitle}
                </h2>
            </div>

            {/* LIVE STATUS */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${isLive
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }`}>
                {isLive ? (
                    <Wifi className="w-3.5 h-3.5" />
                ) : (
                    <WifiOff className="w-3.5 h-3.5" />
                )}
                {isLive ? 'Live' : 'Reconnecting...'}
            </div>

            {/* DATE */}
            <div className="hidden md:block text-xs text-muted-foreground">
                {today}
            </div>

            {/* TIMER (FIXED WIDTH) */}
            <div className="hidden md:block text-xs text-muted-foreground w-[70px] text-right">
                {timer}
            </div>

            {/* NOTIFICATIONS */}
            <Link to="/notifications">
                <button size="icon" className="relative text-muted-foreground hover:text-white">
                    <Bell className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full text-[8px] flex items-center justify-center font-bold text-white">
                        5
                    </span>
                </button>
            </Link>
            
            {/* Logout */}
                <button  className="text-muted-foreground hover:text-red-400">
                    <HugeiconsIcon icon={PowerIcon} size={16} />
                </button>
        </div>
    );
};

export default TopBar;