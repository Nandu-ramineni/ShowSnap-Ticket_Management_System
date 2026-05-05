import { useEffect, useRef, useReducer, useCallback } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
}   from "@/components/ui/card"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { useAuth }  from "@/lib/AuthContext"
import Logo  from "@/assets/Logo.png"



const MAX_ATTEMPTS = 5
const LOCKOUT_MS   = 30_000          // 30 s UX soft-lockout
const EMAIL_RE     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ─── Field-error state (local only — never stored in Redux) ──────────────────

const INITIAL_ERRORS = { email: "", password: "", lockout: "" }

const errorReducer = (state, patch) => ({ ...state, ...patch })

// ─── Component ────────────────────────────────────────────────────────────────

const Login = () => {
    const navigate = useNavigate()
    const {
        login,
        isLoading,
        error: serverError,
        isAuthenticated,
        clearError,
    } = useAuth()

    // Uncontrolled inputs — credentials never touch React state or Redux
    const emailRef    = useRef(null)
    const passwordRef = useRef(null)

    // Client-side soft rate-limit counters (UX layer; server enforces the real limit)
    const attemptsRef  = useRef(0)
    const lockedUntil  = useRef(null)
    const lockTimerRef = useRef(null)

    // Local validation + lockout messages
    const [fieldErrors, setFieldErrors] = useReducer(errorReducer, INITIAL_ERRORS)

    // ── Cleanup lockout timer on unmount ────────────────────────────────────
    useEffect(() => () => clearTimeout(lockTimerRef.current), [])

    // ── Already authenticated → skip the form entirely ──────────────────────
    useEffect(() => {
        if (isAuthenticated) navigate("/dashboard", { replace: true })
    }, [isAuthenticated, navigate])

    // ── Clear Redux server error the moment the user starts correcting input ─
    const handleInputChange = useCallback(() => {
        if (serverError) clearError()
    }, [serverError, clearError])

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault()

        // 1. Lockout guard
        if (lockedUntil.current && Date.now() < lockedUntil.current) {
            const remainingSecs = Math.ceil((lockedUntil.current - Date.now()) / 1000)
            setFieldErrors({ lockout: `Too many attempts. Try again in ${remainingSecs}s.` })
            return
        }

        // 2. Read values from DOM refs — never from state
        const email    = emailRef.current?.value.trim() ?? ""
        const password = passwordRef.current?.value      ?? ""

        // 3. Client-side validation (UX convenience; the server re-validates everything)
        const errors = { email: "", password: "", lockout: "" }
        if (!email)                     errors.email    = "Email is required."
        else if (!EMAIL_RE.test(email)) errors.email    = "Enter a valid email address."
        if (!password)                  errors.password = "Password is required."
        else if (password.length < 8)   errors.password = "Password must be at least 8 characters."

        if (errors.email || errors.password) {
            setFieldErrors(errors)
            return
        }

        setFieldErrors(INITIAL_ERRORS)

        // 4. Dispatch via AuthContext → Redux thunk → POST /auth/login
        //    The server sets HttpOnly cookies; we only receive back the user profile.
        const result = await login({ email, password })

        if (!result?.success) {
            // Always wipe the password field on failure so no stale credential
            // remains in the DOM where browser extensions or devtools could read it.
            if (passwordRef.current) {
                passwordRef.current.value = ""
                passwordRef.current.focus()
            }

            // Increment client-side attempt counter
            attemptsRef.current += 1
            if (attemptsRef.current >= MAX_ATTEMPTS) {
                lockedUntil.current = Date.now() + LOCKOUT_MS
                attemptsRef.current = 0
                setFieldErrors({
                    lockout: `Too many failed attempts. Form locked for ${LOCKOUT_MS / 1000}s.`,
                })
                lockTimerRef.current = setTimeout(() => {
                    lockedUntil.current = null
                    setFieldErrors({ lockout: "" })
                }, LOCKOUT_MS)
            }
            return
        }

        // Success — reset counters; the useEffect above handles navigation
        attemptsRef.current = 0
        lockedUntil.current = null
    }, [login])

    // ── Derived ──────────────────────────────────────────────────────────────
    const isLocked   = Boolean(lockedUntil.current && Date.now() < lockedUntil.current)
    const isDisabled = isLoading || isLocked

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <main className="flex justify-center items-center min-h-screen px-4">
            <Card className="w-full max-w-sm">

                {/* Branding */}
                <div className="flex flex-col items-center pt-6 gap-1 select-none">
                    <img src={Logo} alt="CineVault logo" className="w-16 h-16" />
                    <h1 className="text-2xl font-bold">CineVault!</h1>
                    <p className="text-sm text-muted-foreground">Your seats. Your cinema.</p>
                </div>

                <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>Enter your credentials below.</CardDescription>
                </CardHeader>

                <CardContent>

                    {/* Server error banner (from Redux state via AuthContext) */}
                    {serverError && (
                        <div
                            role="alert"
                            aria-live="assertive"
                            className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                        >
                            {serverError}
                        </div>
                    )}

                    {/* Lockout warning banner */}
                    {fieldErrors.lockout && (
                        <div
                            role="alert"
                            aria-live="assertive"
                            className="mb-4 rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400"
                        >
                            {fieldErrors.lockout}
                        </div>
                    )}

                    <form
                        id="loginForm"
                        onSubmit={handleSubmit}
                        noValidate
                        aria-label="Login form"
                    >
                        <div className="flex flex-col gap-5">

                            {/* Email */}
                            <div className="grid gap-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    ref={emailRef}
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    inputMode="email"
                                    placeholder="hello@cinevault.com"
                                    aria-invalid={fieldErrors.email ? "true" : "false"}
                                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                                    onChange={handleInputChange}
                                    disabled={isDisabled}
                                    className={fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {fieldErrors.email && (
                                    <p id="email-error" role="alert" className="text-xs text-destructive">
                                        {fieldErrors.email}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="grid gap-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        to="/forgot-password"
                                        tabIndex={isDisabled ? -1 : 0}
                                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    ref={passwordRef}
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    aria-invalid={fieldErrors.password ? "true" : "false"}
                                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                                    onChange={handleInputChange}
                                    disabled={isDisabled}
                                    className={fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {fieldErrors.password && (
                                    <p id="password-error" role="alert" className="text-xs text-destructive">
                                        {fieldErrors.password}
                                    </p>
                                )}
                            </div>

                        </div>
                    </form>
                </CardContent>

                <CardFooter className="flex-col gap-3">
                    <Button
                        type="submit"
                        form="loginForm"
                        className="w-full"
                        disabled={isDisabled}
                        aria-busy={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span
                                    className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
                                    aria-hidden="true"
                                />
                                Signing in…
                            </span>
                        ) : (
                            "Login"
                        )}
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                        Don&apos;t have an account?{" "}
                        <Link
                            to="/signup"
                            className="font-medium text-foreground hover:underline underline-offset-2"
                        >
                            Sign up
                        </Link>
                    </p>
                </CardFooter>

            </Card>
        </main>
    )
}

export default Login