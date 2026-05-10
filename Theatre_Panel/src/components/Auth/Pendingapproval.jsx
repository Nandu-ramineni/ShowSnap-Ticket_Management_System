import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CheckCircle2, Clock, Mail, FileText, Shield, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { selectCurrentUser } from '@/Redux/Selectors/authSelectors';

/* ── Utility ── */
const fmtSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* ── Timeline step ── */
const TimelineStep = ({ icon: Icon, title, subtitle, status, isLast }) => {
    const colors = {
        done: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
        active: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
        pending: 'bg-muted text-muted-foreground border-border',
    };
    const connectorColor = status === 'done' ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-border';

    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${colors[status]}`}>
                    {status === 'active' ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
                </div>
                {!isLast && <div className={`w-0.5 flex-1 mt-1 min-h-[2rem] ${connectorColor}`} />}
            </div>
            <div className="pb-6">
                <p className={`font-semibold text-sm ${status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>
            </div>
        </div>
    );
};

/* ── Document badge ── */
const DocBadge = ({ doc }) => {
    const label = doc.docType
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
            <div className="flex items-center gap-2.5">
                <FileText size={14} className="text-primary flex-shrink-0" />
                <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    {doc.fileName && (
                        <p className="text-xs text-muted-foreground">{doc.fileName} · {fmtSize(doc.fileSize)}</p>
                    )}
                </div>
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                Under Review
            </span>
        </div>
    );
};

/* ══════════════════════════════════════════════════════
   PENDING APPROVAL PAGE

   Supports two entry paths:
   1. From Signup  → navigate('/pending', { state: { owner, documents } })
   2. From Login   → navigate('/pending', { state: { fromLogin: true, message } })
      In this case we pull owner info from Redux (hydrated user).
══════════════════════════════════════════════════════ */
const PendingApproval = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const reduxUser = useSelector(selectCurrentUser);
    const [visible, setVisible] = useState(false);

    // Resolve owner data: prefer router state (fresh signup),
    // fall back to Redux store (login redirect).
    const routeOwner = location.state?.owner;
    const owner = routeOwner ?? reduxUser ?? {};
    const documents = location.state?.documents ?? [];
    const fromLogin = location.state?.fromLogin ?? false;

    // Animate in
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    // Guard: if no owner data at all, redirect to login
    useEffect(() => {
        if (!routeOwner && !reduxUser) {
            navigate('/login', { replace: true });
        }
    }, [routeOwner, reduxUser, navigate]);

    const steps = [
        {
            icon: CheckCircle2,
            title: fromLogin ? 'Application Previously Submitted' : 'Registration Submitted',
            subtitle: fromLogin
                ? 'Your account and documents were already received. We are still reviewing them.'
                : 'Your account and documents have been received successfully.',
            status: 'done',
        },
        {
            icon: Shield,
            title: 'Document Verification',
            subtitle: 'Our compliance team is reviewing your business documents for authenticity and completeness.',
            status: 'active',
        },
        {
            icon: Clock,
            title: 'Admin Approval',
            subtitle: 'A senior reviewer will approve your account once verification is complete.',
            status: 'pending',
        },
        {
            icon: Mail,
            title: 'Email Notification',
            subtitle: "You'll receive a confirmation email with next steps and your dashboard credentials.",
            status: 'pending',
        },
    ];

    return (
        <main className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-12">
            <div
                className={`max-w-2xl w-full space-y-5 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
            >
                {/* ── Hero Card ── */}
                <Card className="shadow-xl border-0 overflow-hidden">
                    <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />

                    <CardContent className="pt-8 pb-8 text-center">
                        <div className="relative inline-flex items-center justify-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                                <CheckCircle2 size={38} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="absolute -top-1 -right-1 text-2xl animate-bounce">🎉</span>
                        </div>

                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            {fromLogin ? 'Account Under Review' : 'Application Submitted!'}
                        </h1>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                            {fromLogin
                                ? <>Welcome back, <span className="font-semibold text-foreground">{owner.name || 'there'}</span>! Your account is currently under review. You&apos;ll be notified once approved.</>
                                : <>Great news, <span className="font-semibold text-foreground">{owner.name || 'there'}</span>! Your registration for <span className="font-semibold text-foreground">{owner.theatreName || 'your theatre'}</span> has been received. Our team will review your documents and get back to you shortly.</>
                            }
                        </p>

                        <div className="flex flex-wrap justify-center gap-2 mt-5">
                            {owner.email && (
                                <div className="flex items-center gap-1.5 bg-muted/70 rounded-full px-3 py-1.5 text-xs">
                                    <Mail size={12} className="text-primary" />
                                    <span className="text-muted-foreground">Confirmation sent to</span>
                                    <span className="font-medium text-foreground">{owner.email}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 bg-muted/70 rounded-full px-3 py-1.5 text-xs">
                                <Clock size={12} className="text-amber-600" />
                                <span className="font-medium text-foreground">3–5 business days</span>
                                <span className="text-muted-foreground">for review</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid sm:grid-cols-2 gap-5">
                    {/* ── Timeline ── */}
                    <Card className="shadow-md border-0">
                        <CardContent className="pt-6 pb-6">
                            <h2 className="font-semibold text-foreground text-sm mb-4 flex items-center gap-2">
                                <Clock size={15} className="text-primary" />
                                What happens next?
                            </h2>
                            <div>
                                {steps.map((s, i) => (
                                    <TimelineStep key={s.title} {...s} isLast={i === steps.length - 1} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-5">
                        {/* ── Documents (signup path only) ── */}
                        {documents.length > 0 && (
                            <Card className="shadow-md border-0">
                                <CardContent className="pt-6 pb-4">
                                    <h2 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                                        <FileText size={15} className="text-primary" />
                                        Documents Received ({documents.length})
                                    </h2>
                                    <div>
                                        {documents.map((doc) => (
                                            <DocBadge key={doc.id || doc.docType} doc={doc} />
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* ── Check inbox ── */}
                        {owner.email && (
                            <Card className="shadow-md border-0 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                                <CardContent className="pt-5 pb-5 space-y-3 text-sm">
                                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold">
                                        <Mail size={15} />
                                        Check your inbox
                                    </div>
                                    <p className="text-blue-700/80 dark:text-blue-300/70 leading-relaxed text-xs">
                                        A confirmation email has been sent to <strong>{owner.email}</strong>.
                                        It contains your application reference number — please keep it handy for any support queries.
                                    </p>
                                    <p className="text-blue-700/80 dark:text-blue-300/70 leading-relaxed text-xs">
                                        If you don't see it within 10 minutes, check your spam/junk folder.
                                        For urgent queries, reach us at{' '}
                                        <a href="mailto:support@cinevault.in" className="underline font-medium">
                                            support@cinevault.in
                                        </a>
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* ── SLA commitment ── */}
                        <Card className="shadow-md border-0">
                            <CardContent className="pt-5 pb-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Shield size={15} className="text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground text-sm">Our commitment to you</p>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                            We review all applications within <strong>3–5 business days</strong>.
                                            You will receive a detailed email regardless of outcome —
                                            approval notice or a clear explanation if additional documents are needed.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* ── Footer CTA ── */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-muted-foreground text-center sm:text-left">
                        Application ID: <span className="font-mono font-medium text-foreground">{owner.id || '—'}</span>
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/login')}
                            className="text-sm"
                        >
                            Go to Login
                        </Button>
                        <Button
                            size="sm"
                            className="text-sm"
                            onClick={() => window.open('mailto:support@cinevault.in', '_blank')}
                        >
                            Contact Support
                            <ChevronRight size={14} className="ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default PendingApproval;
