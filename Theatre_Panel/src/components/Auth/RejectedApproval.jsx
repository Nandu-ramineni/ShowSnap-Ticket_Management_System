import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    XCircle,
    AlertTriangle,
    Mail,
    FileText,
    ShieldAlert,
    ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { selectCurrentUser } from '@/Redux/Selectors/authSelectors';

import Logo from '@/assets/logo.png';

/* ───────────────────────────────────────────────────────────── */
/* Timeline Step */
/* ───────────────────────────────────────────────────────────── */

const TimelineStep = ({ icon: Icon, title, subtitle, status, isLast }) => {
    const colors = {
        done: 'bg-muted text-foreground border',
        rejected: 'bg-destructive/10 text-destructive border border-destructive/40',
        pending: 'bg-muted text-muted-foreground border',
    };

    const connectorColor =
        status === 'done' || status === 'rejected'
            ? 'bg-border'
            : 'bg-border/60';

    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <div
                    className={`w-9 h-9 rounded-md border flex items-center justify-center shrink-0 ${colors[status]}`}
                >
                    <Icon size={14} />
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

/* ───────────────────────────────────────────────────────────── */
/* Navbar */
/* ───────────────────────────────────────────────────────────── */

const RejectedNavbar = () => {
    return (
        <div className="sticky top-0 z-50 backdrop-blur-md bg-muted/30">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">

                <div className="flex items-center gap-2">
                    <img src={Logo} alt="CineVault Logo" className="w-7 h-7" />
                    <span className="text-sm font-medium tracking-wider text-foreground">
                        CineVault
                    </span>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                    <p>
                        Status:{' '}
                        <span className="font-bold text-destructive">
                            Rejected
                        </span>
                    </p>
                </div>

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
                </div>
            </div>
        </div>
    );
};

/* ───────────────────────────────────────────────────────────── */
/* Main Component */
/* ───────────────────────────────────────────────────────────── */

const RejectedApproval = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const reduxUser = useSelector(selectCurrentUser);

    const [visible, setVisible] = useState(false);

    const routeOwner = location.state?.owner;
    const owner = routeOwner ?? reduxUser ?? {};

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!routeOwner && !reduxUser) {
            navigate('/login', { replace: true });
        }
    }, [routeOwner, reduxUser, navigate]);

    const steps = [
        {
            icon: FileText,
            title: 'Application Submitted',
            subtitle: 'Your application and documents were received.',
            status: 'done',
        },
        {
            icon: ShieldAlert,
            title: 'Document Review',
            subtitle:
                'Our compliance team reviewed your submitted documents.',
            status: 'done',
        },
        {
            icon: AlertTriangle,
            title: 'Verification Failed',
            subtitle:
                'Some submitted information or documents could not be verified.',
            status: 'rejected',
        },
        {
            icon: Mail,
            title: 'Notification Sent',
            subtitle:
                'A rejection notification has been sent to your email.',
            status: 'done',
        },
    ];

    return (
        <main>
            <RejectedNavbar />

            <main className="min-h-[93vh] bg-muted/30 flex items-center justify-center px-4 py-10">
                <div
                    className={`max-w-2xl w-full space-y-5 transition-all duration-500 ${
                        visible
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 translate-y-4'
                    }`}
                >
                    {/* HEADER */}
                    <Card className="border border-destructive/30 shadow-sm">
                        <CardContent className="py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="w-10 h-10 rounded-md border border-destructive/30 bg-destructive/10 flex items-center justify-center">
                                    <XCircle
                                        size={18}
                                        className="text-destructive"
                                    />
                                </div>

                                <div className="flex-1">
                                    <h1 className="text-base font-semibold text-foreground">
                                        Hello,{' '}
                                        {owner?.theatreInfo?.theatreName ||
                                            owner?.name ||
                                            'there'}
                                        ! Application Rejected
                                    </h1>

                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                        Unfortunately, your theatre onboarding
                                        request could not be approved at this
                                        time.
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="text-xs px-2 py-1 border border-destructive/30 rounded-md bg-destructive/10 text-destructive">
                                            Status: Rejected
                                        </span>

                                        <span className="text-xs px-2 py-1 border rounded-md font-mono">
                                            {owner.applicationId || 'CINE-XXXX'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid sm:grid-cols-2 gap-5">

                        {/* TIMELINE */}
                        <Card className="border shadow-sm">
                            <CardContent className="pt-5">
                                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                    <AlertTriangle size={14} />
                                    Review Summary
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

                            {/* REJECTION REASON */}
                            <Card className="border border-destructive/20 bg-destructive/5 shadow-sm">
                                <CardContent className="pt-5">
                                    <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-destructive">
                                        <AlertTriangle size={14} />
                                        Rejection Reason
                                    </h2>

                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {owner.rejectionReason ||
                                            'Your submitted documents could not be verified. Please review and re-submit valid documents.'}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* DOCUMENTS */}
                            {owner.supportingDocuments?.length > 0 && (
                                <Card className="border shadow-sm">
                                    <CardContent className="pt-5">
                                        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            <FileText size={14} />
                                            Submitted Documents
                                        </h2>

                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {owner.supportingDocuments.map(
                                                (doc, index) => {
                                                    const label = doc.docType
                                                        .replace(/_/g, ' ')
                                                        .replace(
                                                            /\b\w/g,
                                                            (c) => c.toUpperCase()
                                                        );

                                                    return (
                                                        <span key={doc.id}>
                                                            <button
                                                                onClick={() =>
                                                                    window.open(
                                                                        doc.url,
                                                                        '_blank'
                                                                    )
                                                                }
                                                                className="text-foreground hover:underline"
                                                            >
                                                                {label}
                                                            </button>

                                                            {index !==
                                                                owner
                                                                    .supportingDocuments
                                                                    .length -
                                                                    1 && ', '}
                                                        </span>
                                                    );
                                                }
                                            )}
                                        </p>

                                        <p className="py-2 text-xs text-muted-foreground">
                                            Note: Click the document name to
                                            review it.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* EMAIL */}
                            {owner.email && (
                                <Card className="border bg-muted/40 shadow-sm">
                                    <CardContent className="pt-5 space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Mail size={14} />
                                            Email Notification
                                        </div>

                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Rejection details were sent to{' '}
                                            <span className="font-medium text-foreground">
                                                {owner.email}
                                            </span>
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* FOOTER */}
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
                                onClick={() => navigate('/register')}
                            >
                                Submit Again
                            </Button>

                            <Button
                                size="sm"
                                onClick={() =>
                                    window.open(
                                        'mailto:support@cinevault.in'
                                    )
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

export default RejectedApproval;