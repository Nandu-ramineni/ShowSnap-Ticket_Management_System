import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    CheckCircle2,
    Clock,
    Mail,
    FileText,
    Shield,
    ChevronRight,
    Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { selectCurrentUser } from '@/Redux/Selectors/authSelectors';
import Logo from '@/assets/logo.png';

/* ── Timeline Step ── */
const TimelineStep = ({ icon: Icon, title, subtitle, status, isLast }) => {
    const colors = {
        done: 'bg-muted text-foreground border',
        active: 'bg-muted text-foreground border border-primary',
        pending: 'bg-muted text-muted-foreground border',
    };

    const connectorColor =
        status === 'done' ? 'bg-border' : 'bg-border/60';

    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <div
                    className={`w-9 h-9 rounded-md border flex items-center justify-center shrink-0 ${colors[status]}`}
                >
                    {status === 'active' ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Icon size={14} />
                    )}
                </div>

                {!isLast && (
                    <div className={`w-0.5 flex-1 mt-1 min-h-8 ${connectorColor}`} />
                )}
            </div>

            <div className="pb-5">
                <p className="text-sm font-medium text-foreground">
                    {title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {subtitle}
                </p>
            </div>
        </div>
    );
};


const PendingNavbar = () => {
    return (
        <div className="sticky top-0 z-50 backdrop-blur-md bg-muted/30 ">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between ">

                {/* Left - Brand */}
                <div className="flex items-center gap-2">
                    <img src={Logo} alt="CineVault Logo" className="w-7 h-7" />
                    <span className="text-sm font-medium tracking-wider text-foreground">
                        CineVault
                    </span>
                </div>

                {/* Center - Status */}
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                    <p>Status: <span className='font-bold'>Under Review</span></p>

                </div>

                {/* Right - Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() =>
                            window.open('mailto:support@cinevault.in')
                        }
                        className="text-xs text-muted-foreground hover:text-foreground transition"
                    >
                        Support
                    </button>
                    <button
                        onClick={() =>
                            window.open('mailto:support@cinevault.in')
                        }
                        className="text-xs text-muted-foreground hover:text-foreground transition"
                    >
                        Privacy Policy
                    </button>
                    <button
                        onClick={() =>
                            window.open('mailto:support@cinevault.in')
                        }
                        className="text-xs text-muted-foreground hover:text-foreground transition"
                    >
                        Service Terms
                    </button>

                    {/* <button
                        onClick={() => navigate('/login')}
                        className="text-xs px-3 py-1.5 rounded-md border bg-muted hover:bg-muted/80 transition"
                    >
                        Logout
                    </button> */}
                </div>
            </div>
        </div>
    );
};

const PendingApproval = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const reduxUser = useSelector(selectCurrentUser);

    const [visible, setVisible] = useState(false);

    const routeOwner = location.state?.owner;
    const owner = routeOwner ?? reduxUser ?? {};
    const fromLogin = location.state?.fromLogin ?? false;

    /* ── Animation ── */
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    /* ── Guard ── */
    useEffect(() => {
        if (!routeOwner && !reduxUser && !fromLogin) {
            navigate('/login', { replace: true });
        }
    }, [routeOwner, reduxUser, fromLogin, navigate]);

    const steps = [
        {
            icon: CheckCircle2,
            title: 'Application Submitted',
            subtitle: 'Your application and documents have been received.',
            status: 'done',
        },
        {
            icon: Shield,
            title: 'Document Verification',
            subtitle:
                'Our compliance team is verifying submitted documents.',
            status: 'active',
        },
        {
            icon: Clock,
            title: 'Admin Review',
            subtitle:
                'A senior reviewer will validate and approve your account.',
            status: 'pending',
        },
        {
            icon: Mail,
            title: 'Final Notification',
            subtitle:
                'You will receive email confirmation once review is complete.',
            status: 'pending',
        },
    ];

    return (
        <main >
            <PendingNavbar owner={owner} navigate={navigate} />
            <main className="min-h-[93vh] bg-muted/30 flex items-center justify-center px-4 py-10">
                <div
                    className={`max-w-2xl w-full space-y-5 transition-all duration-500 ${visible
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-4'
                        }`}
                >
                    {/* ── HEADER CARD ── */}
                    <Card className="border shadow-sm">
                        <CardContent className="py-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="w-10 h-10 rounded-md border bg-muted flex items-center justify-center">
                                    <Clock size={16} />
                                </div>

                                <div className="flex-1">
                                    <h1 className="text-base font-semibold text-foreground">
                                        Hello, {owner?.theatreInfo?.theatreName ||
                                            owner?.name ||
                                            'there'}! Your Application is currently under review
                                    </h1>

                                    <p className="text-sm text-muted-foreground mt-1">
                                        {fromLogin
                                            ? 'Your account is currently being verified by our team.'
                                            : 'Your application is in the verification queue.'}
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="text-xs px-2 py-1 border rounded-md bg-muted text-muted-foreground">
                                            Status: Pending
                                        </span>

                                        <span className="text-xs px-2 py-1 border rounded-md font-mono">
                                            {owner.applicationId || 'CINE-XXXXXX'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid sm:grid-cols-2 gap-5">
                        {/* ── TIMELINE ── */}
                        <Card className="border shadow-sm">
                            <CardContent >
                                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <Clock size={14} />
                                    Application Progress
                                </h2>

                                {steps.map((s, i) => (
                                    <TimelineStep
                                        key={s.title}
                                        {...s}
                                        isLast={i === steps.length - 1}
                                    />
                                ))}
                            </CardContent>
                        </Card>

                        <div className="space-y-5">
                            {/* ── DOCUMENTS ── */}
                            {owner.supportingDocuments?.length > 0 && (
                                <Card className="border shadow-sm">
                                    <CardContent >
                                        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            <FileText size={14} />
                                            Submitted Documents
                                        </h2>

                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {owner.supportingDocuments.map((doc, index) => {
                                                const label = doc.docType
                                                    .replace(/_/g, ' ')
                                                    .replace(/\b\w/g, (c) => c.toUpperCase());

                                                return (
                                                    <span key={doc.id}>
                                                        <button
                                                            onClick={() => window.open(doc.url, '_blank')}
                                                            className="text-foreground hover:underline"
                                                        >
                                                            {label}
                                                        </button>
                                                        {index !== owner.supportingDocuments.length - 1 && ', '}
                                                    </span>
                                                );
                                            })}
                                        </p>
                                        <p className='py-2 text-xs text-muted-foreground'>
                                            Note: Click the document name to view it.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* ── INFO BOX ── */}
                            {owner.email && (
                                <Card className="border bg-muted/40 shadow-sm">
                                    <CardContent className=" space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Mail size={14} />
                                            Email Notification
                                        </div>

                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Updates will be sent to{' '}
                                            <span className="font-medium text-foreground">
                                                {owner.email}
                                            </span>
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* ── SLA ── */}
                            <Card className="border shadow-sm">
                                <CardContent>
                                    <div className="flex gap-3">
                                        <Shield size={14} className="mt-1" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Review Timeline
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                Standard verification takes 3–5 business days.
                                                You will be notified once status changes.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* ── FOOTER ── */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <p className="text-xs text-muted-foreground">
                            Application ID:{' '}
                            <span className="font-mono text-foreground">
                                {owner.applicationId || '—'}
                            </span>
                        </p>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/login')}
                            >
                                Go to Login
                            </Button>

                            <Button
                                size="sm"
                                onClick={() =>
                                    window.open('mailto:support@cinevault.in')
                                }
                            >
                                Contact Support
                                <ChevronRight size={14} />
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </main>
    );
};

export default PendingApproval;