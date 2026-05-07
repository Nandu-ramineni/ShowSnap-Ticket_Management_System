import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy = () => {
    return (
        <main className="min-h-screen bg-muted/30 flex justify-center px-4 py-10">
            <Card className="max-w-4xl w-full shadow-xl border-0">
                <CardHeader>
                    <CardTitle>Privacy Policy & Terms of Use</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6 text-sm leading-6 text-muted-foreground">

                    <p>
                        This Privacy Policy explains how we collect, use, and protect your information when you use our platform.
                        By accessing or using our services, you agree to the terms outlined below.
                    </p>

                    <section>
                        <h2 className="font-semibold text-foreground">1. Information We Collect</h2>
                        <p>
                            We collect personal information such as name, email address, business documents,
                            and identity verification details to provide secure onboarding and verification services.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-semibold text-foreground">2. How We Use Data</h2>
                        <p>
                            Your data is used for account creation, identity verification, compliance checks,
                            fraud prevention, and platform improvement. We do not sell your personal data.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-semibold text-foreground">3. Document Security</h2>
                        <p>
                            All uploaded documents are stored securely using encrypted cloud storage.
                            Access is restricted to authorized verification systems only.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-semibold text-foreground">4. Data Retention</h2>
                        <p>
                            We retain user data as long as the account remains active or as required by legal obligations.
                            You may request deletion subject to compliance rules.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-semibold text-foreground">5. Third-Party Services</h2>
                        <p>
                            We may use third-party services for authentication, storage, and analytics.
                            These providers are bound by strict confidentiality agreements.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-semibold text-foreground">6. User Responsibilities</h2>
                        <p>
                            Users must ensure that all submitted documents are valid, accurate, and legally owned.
                            Any fraudulent submission may lead to account termination.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-semibold text-foreground">7. Consent</h2>
                        <p>
                            By clicking "I Agree", you confirm that you have read, understood,
                            and accepted all terms of this Privacy Policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-semibold text-foreground">8. Updates</h2>
                        <p>
                            We may update this policy periodically. Continued use of the platform implies acceptance of changes.
                        </p>
                    </section>

                    <div className="pt-4 border-t">
                        <p className="text-xs">
                            Last updated: May 2026
                        </p>
                    </div>

                </CardContent>
            </Card>
        </main>
    );
};

export default PrivacyPolicy;