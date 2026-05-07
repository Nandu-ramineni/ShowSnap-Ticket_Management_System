import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Shield, Lock, Database, Eye, Users, FileCheck, RefreshCw, Globe, AlertTriangle, Mail } from 'lucide-react';

const Section = ({ icon: Icon, number, title, children }) => (
    <section className="group">
        <div className="flex items-start gap-4 mb-3">
            <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                <Icon size={17} className="text-primary" />
            </div>
            <div>
                <h2 className="text-base font-semibold text-foreground leading-snug">
                    {number}. {title}
                </h2>
            </div>
        </div>
        <div className="ml-13 pl-13 text-sm leading-7 text-muted-foreground space-y-3" style={{ paddingLeft: '3.25rem' }}>
            {children}
        </div>
    </section>
);

const Highlight = ({ children }) => (
    <span className="font-medium text-foreground">{children}</span>
);

const TableRow = ({ label, value }) => (
    <tr className="border-b border-border/50 last:border-0">
        <td className="py-2 pr-6 font-medium text-foreground w-48 align-top">{label}</td>
        <td className="py-2 text-muted-foreground">{value}</td>
    </tr>
);

const PrivacyPolicy = () => {
    return (
        <main className="min-h-screen bg-muted/30 flex justify-center px-4 py-12">
            <div className="max-w-4xl w-full space-y-6">

                {/* Header Card */}
                <Card className="shadow-xl border-0 overflow-hidden">
                    <div className="bg-linear-to-br from-primary/90 to-primary px-8 py-10 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Shield size={20} />
                            </div>
                            <span className="text-sm font-medium uppercase tracking-widest opacity-80">Legal Document</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Privacy Policy &amp; Terms of Use</h1>
                        <p className="text-white/75 text-sm max-w-xl leading-relaxed">
                            CineVault is committed to protecting your privacy and operating transparently.
                            This document governs your use of our platform and explains how your data is handled.
                        </p>
                        <div className="flex flex-wrap gap-4 mt-6 text-xs text-white/60">
                            <span>📅 Last updated: May 2026</span>
                            <span>📌 Version 2.0</span>
                            <span>🌏 Applicable jurisdiction: India</span>
                        </div>
                    </div>
                </Card>

                {/* Introduction */}
                <Card className="shadow-md border-0">
                    <CardContent className="pt-6 pb-6">
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                            <strong>Important:</strong> Please read this Privacy Policy carefully before using CineVault's theatre owner onboarding platform.
                            By registering an account, uploading documents, or accessing any part of our service, you acknowledge that you have read,
                            understood, and agreed to be bound by this policy in its entirety. If you do not agree, please do not use our services.
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <Card className="shadow-xl border-0">
                    <CardContent className="pt-8 pb-10 space-y-10">

                        <Section icon={Eye} number="1" title="Information We Collect">
                            <p>
                                When you register as a theatre owner on CineVault, we collect the following categories of information
                                to facilitate a secure and compliant onboarding experience:
                            </p>

                            <div>
                                <p className="font-medium text-foreground mb-2">1.1 Personal Identification Data</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Full legal name of the business owner or authorized representative</li>
                                    <li>Email address (used as your primary account identifier)</li>
                                    <li>Mobile number (for OTP verification and critical alerts)</li>
                                    <li>Government-issued identity proof (PAN Card, Aadhaar, Passport)</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-medium text-foreground mb-2">1.2 Business &amp; Entity Data</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Theatre name and classification (Single Screen / Multiplex)</li>
                                    <li>GST registration number and certificate</li>
                                    <li>Business Registration / Certificate of Incorporation</li>
                                    <li>Trade License issued by local municipal authority</li>
                                    <li>No Objection Certificate (NOC) from relevant fire/safety departments</li>
                                    <li>Business address and geolocation data</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-medium text-foreground mb-2">1.3 Financial &amp; Compliance Data</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Bank account details for payout settlement (collected post-approval only)</li>
                                    <li>PAN Card for TDS compliance and tax filing</li>
                                    <li>Address proof (utility bill, bank statement dated within 3 months)</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-medium text-foreground mb-2">1.4 Technical &amp; Usage Data</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>IP address, browser type, and device fingerprint (for fraud detection)</li>
                                    <li>Login timestamps, session durations, and page interaction logs</li>
                                    <li>Document upload metadata (file size, upload time, format)</li>
                                    <li>Error and crash reports for platform stability</li>
                                </ul>
                            </div>
                        </Section>

                        <div className="border-t" />

                        <Section icon={Database} number="2" title="How We Use Your Data">
                            <p>
                                We use the information we collect exclusively for legitimate business purposes.
                                We do <Highlight>not</Highlight> sell, rent, or broker your personal data to any third party for commercial gain.
                            </p>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm mt-2">
                                    <thead>
                                        <tr className="border-b-2 border-border">
                                            <th className="text-left py-2 pr-6 text-foreground font-semibold">Purpose</th>
                                            <th className="text-left py-2 text-foreground font-semibold">Legal Basis</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <TableRow label="Account creation &amp; login" value="Contractual necessity" />
                                        <TableRow label="KYC &amp; identity verification" value="Legal obligation (RBI, IT Act)" />
                                        <TableRow label="Document authenticity checks" value="Legitimate interest" />
                                        <TableRow label="Fraud prevention &amp; risk scoring" value="Legitimate interest" />
                                        <TableRow label="Admin review &amp; approval workflow" value="Contractual necessity" />
                                        <TableRow label="Email notifications &amp; status updates" value="Contractual necessity" />
                                        <TableRow label="Platform analytics &amp; improvement" value="Legitimate interest" />
                                        <TableRow label="Legal &amp; regulatory compliance" value="Legal obligation" />
                                        <TableRow label="Tax reporting (TDS/GST)" value="Legal obligation" />
                                    </tbody>
                                </table>
                            </div>

                            <p>
                                We apply data minimisation principles — only the data strictly necessary for the stated purpose is
                                processed. Automated decision-making does not result in final approval or rejection;
                                all onboarding decisions involve a human reviewer.
                            </p>
                        </Section>

                        <div className="border-t" />

                        <Section icon={Lock} number="3" title="Document Security &amp; Encryption">
                            <p>
                                We treat your uploaded documents with the highest level of security. All documents are processed
                                through a hardened pipeline designed to prevent unauthorized access at every stage:
                            </p>

                            <div>
                                <p className="font-medium text-foreground mb-2">3.1 Transmission Security</p>
                                <p>
                                    All data in transit is protected using <Highlight>TLS 1.3</Highlight> encryption.
                                    We enforce HSTS (HTTP Strict Transport Security) and reject connections on older,
                                    insecure protocol versions. Certificate pinning is implemented in our mobile clients.
                                </p>
                            </div>

                            <div>
                                <p className="font-medium text-foreground mb-2">3.2 Storage Security</p>
                                <p>
                                    Documents are stored in <Highlight>Cloudinary{"'"}s secure cloud</Highlight> with server-side
                                    AES-256 encryption at rest. Signed, time-limited URLs are generated per-access — raw storage
                                    URLs are never exposed publicly. Buckets are private with no public read access.
                                </p>
                            </div>

                            <div>
                                <p className="font-medium text-foreground mb-2">3.3 Access Controls</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Role-based access control (RBAC) — only authorized admins can view submitted documents</li>
                                    <li>All admin access to documents is logged with a full audit trail</li>
                                    <li>Multi-factor authentication (MFA) is mandatory for all internal staff</li>
                                    <li>Principle of least privilege applied across all service accounts</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-medium text-foreground mb-2">3.4 Infrastructure</p>
                                <p>
                                    Our backend infrastructure runs on ISO 27001-certified cloud providers.
                                    Vulnerability assessments and penetration tests are conducted at least quarterly.
                                    We maintain a bug bounty programme for responsible disclosure.
                                </p>
                            </div>
                        </Section>

                        <div className="border-t" />

                        <Section icon={RefreshCw} number="4" title="Data Retention &amp; Deletion">
                            <p>We retain your data only as long as necessary for the purpose it was collected:</p>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm mt-2">
                                    <thead>
                                        <tr className="border-b-2 border-border">
                                            <th className="text-left py-2 pr-6 text-foreground font-semibold">Data Category</th>
                                            <th className="text-left py-2 text-foreground font-semibold">Retention Period</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <TableRow label="Active account data" value="Duration of account activity" />
                                        <TableRow label="KYC &amp; identity documents" value="7 years (statutory minimum under PMLA)" />
                                        <TableRow label="Transaction records" value="8 years (as per IT Act, 2000)" />
                                        <TableRow label="Rejected applications" value="2 years from rejection date" />
                                        <TableRow label="Session &amp; audit logs" value="12 months rolling" />
                                        <TableRow label="Support correspondence" value="3 years from resolution" />
                                        <TableRow label="Marketing consent records" value="Until withdrawal + 1 year" />
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-muted/50 rounded-lg p-4 mt-2">
                                <p className="font-medium text-foreground mb-1">Your Right to Erasure</p>
                                <p>
                                    You may request deletion of your account and associated data by contacting
                                    <Highlight> privacy@cinevault.in</Highlight>. Note that data subject to statutory
                                    retention obligations (e.g., KYC documents) cannot be deleted before the mandated
                                    retention period lapses, even upon request. We will confirm receipt of your request
                                    within 72 hours and complete action within 30 days.
                                </p>
                            </div>
                        </Section>

                        <div className="border-t" />

                        <Section icon={Globe} number="5" title="Third-Party Services &amp; Data Processors">
                            <p>
                                We engage carefully vetted third-party processors to deliver our services.
                                All processors are bound by Data Processing Agreements (DPAs) that impose
                                obligations equivalent to or stricter than this policy:
                            </p>

                            <div className="grid sm:grid-cols-2 gap-3 mt-2">
                                {[
                                    { name: 'Cloudinary', purpose: 'Secure document storage & CDN delivery', category: 'Storage' },
                                    { name: 'MongoDB Atlas', purpose: 'Primary database hosting', category: 'Database' },
                                    { name: 'SendGrid / Nodemailer', purpose: 'Transactional email delivery', category: 'Email' },
                                    { name: 'Razorpay', purpose: 'Payment processing (post-approval)', category: 'Payments' },
                                    { name: 'Sentry', purpose: 'Error monitoring & crash reporting', category: 'Monitoring' },
                                    { name: 'AWS / GCP', purpose: 'Infrastructure & compute', category: 'Cloud' },
                                ].map(p => (
                                    <div key={p.name} className="border border-border/60 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-foreground text-sm">{p.name}</span>
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{p.category}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{p.purpose}</p>
                                    </div>
                                ))}
                            </div>

                            <p>
                                We do not transfer your personal data outside of India without adequate safeguards
                                as required under the Digital Personal Data Protection Act, 2023 (DPDPA).
                            </p>
                        </Section>

                        <div className="border-t" />

                        <Section icon={Users} number="6" title="User Rights &amp; Responsibilities">
                            <div>
                                <p className="font-medium text-foreground mb-2">6.1 Your Rights Under DPDPA 2023</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li><Highlight>Right to Access</Highlight> — Request a copy of all personal data we hold about you</li>
                                    <li><Highlight>Right to Correction</Highlight> — Request correction of inaccurate or incomplete data</li>
                                    <li><Highlight>Right to Erasure</Highlight> — Request deletion subject to legal retention limits</li>
                                    <li><Highlight>Right to Grievance Redressal</Highlight> — Lodge a complaint with our Data Protection Officer</li>
                                    <li><Highlight>Right to Nominate</Highlight> — Nominate an individual to exercise rights on your behalf</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-medium text-foreground mb-2">6.2 Your Obligations as a User</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>All submitted documents must be authentic, unaltered originals or certified true copies</li>
                                    <li>You must be the authorized representative of the registered business entity</li>
                                    <li>You must not submit documents belonging to another person or entity without authorization</li>
                                    <li>You are responsible for keeping your login credentials confidential</li>
                                    <li>You must promptly notify us of any unauthorized access to your account</li>
                                    <li>Any fraudulent submission constitutes a breach and may result in account termination,
                                        reporting to authorities, and civil or criminal liability</li>
                                </ul>
                            </div>
                        </Section>

                        <div className="border-t" />

                        <Section icon={FileCheck} number="7" title="Consent &amp; Legal Basis">
                            <p>
                                By completing the registration process and clicking <Highlight>"Create Account"</Highlight>,
                                you provide explicit, informed consent to the collection and processing of your personal data
                                as described in this policy. This consent forms the contractual basis for our relationship.
                            </p>
                            <p>
                                Where we rely on <Highlight>legitimate interests</Highlight> as a legal basis,
                                we have conducted a balancing test to ensure our interests do not override your fundamental rights.
                                You may object to such processing by contacting our DPO.
                            </p>
                            <p>
                                Consent for optional communications (e.g., marketing newsletters, feature announcements)
                                is collected separately and may be withdrawn at any time without affecting your account status.
                            </p>
                        </Section>

                        <div className="border-t" />

                        <Section icon={AlertTriangle} number="8" title="Data Breach Notification">
                            <p>
                                In the unlikely event of a personal data breach that poses a risk to your rights and freedoms,
                                we are committed to:
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Notifying the Data Protection Board of India within <Highlight>72 hours</Highlight> of becoming aware</li>
                                <li>Informing affected users promptly via the email address registered on their account</li>
                                <li>Providing a clear description of the nature of the breach, data affected, and mitigation steps taken</li>
                                <li>Publishing a post-incident report within 30 days for significant incidents</li>
                            </ul>
                            <p>
                                We maintain an Incident Response Plan and conduct annual breach simulation drills to
                                ensure preparedness.
                            </p>
                        </Section>

                        <div className="border-t" />

                        <Section icon={RefreshCw} number="9" title="Policy Updates">
                            <p>
                                We may update this Privacy Policy periodically to reflect changes in our practices,
                                technology, legal requirements, or regulatory guidance. The <Highlight>"Last updated"</Highlight>
                                date at the top of this document will always reflect the most recent revision.
                            </p>
                            <p>
                                For <Highlight>material changes</Highlight> (those that significantly affect your rights or
                                how we use your data), we will provide at least 30 days' advance notice via email and
                                an in-platform banner. Continued use of the platform after the effective date constitutes
                                acceptance of the revised policy.
                            </p>
                            <p>
                                For <Highlight>minor changes</Highlight> (typographic corrections, clarifications that
                                do not alter the substance of the policy), we will update the version number and date
                                without prior notice.
                            </p>
                            <p>
                                We maintain an archive of previous policy versions which is available upon request.
                            </p>
                        </Section>

                        <div className="border-t" />

                        <Section icon={Mail} number="10" title="Contact Us &amp; Grievance Redressal">
                            <p>
                                For any questions, concerns, or requests regarding this Privacy Policy or our data practices,
                                please contact:
                            </p>

                            <div className="grid sm:grid-cols-2 gap-4 mt-2">
                                <div className="border border-border/60 rounded-lg p-4 space-y-1">
                                    <p className="font-semibold text-foreground text-sm">Data Protection Officer</p>
                                    <p>CineVault Technologies Pvt. Ltd.</p>
                                    <p>📧 privacy@cinevault.in</p>
                                    <p>📍 Bengaluru, Karnataka, India</p>
                                    <p className="text-xs mt-2 text-muted-foreground">Response within 72 hours on business days</p>
                                </div>
                                <div className="border border-border/60 rounded-lg p-4 space-y-1">
                                    <p className="font-semibold text-foreground text-sm">General Support</p>
                                    <p>📧 support@cinevault.in</p>
                                    <p>🕐 Mon–Fri, 9 AM – 6 PM IST</p>
                                    <p className="text-xs mt-2 text-muted-foreground">
                                        For grievances unresolved within 30 days, you may escalate to the
                                        Data Protection Board of India.
                                    </p>
                                </div>
                            </div>
                        </Section>

                    </CardContent>
                </Card>

                {/* Footer */}
                <Card className="shadow-md border-0">
                    <CardContent className="py-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Shield size={14} className="text-primary" />
                                <span>CineVault Technologies Pvt. Ltd. — All rights reserved © 2026</span>
                            </div>
                            <div className="flex gap-4">
                                <span>Version 2.0</span>
                                <span>•</span>
                                <span>Last updated: May 2026</span>
                                <span>•</span>
                                <span>Governed by Indian law</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </main>
    );
};

export default PrivacyPolicy;