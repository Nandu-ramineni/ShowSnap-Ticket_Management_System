"use client"

import { use, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { movies, theaters, generateSeats } from "@/lib/movie-data"
import {
  ArrowLeft,
  CreditCard,
  Ticket,
  MapPin,
  Clock,
  Calendar,
  Check,
  Download,
  Share2,
  Home,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

type BookingStep = "review" | "payment" | "confirmed"

export default function BookingPage({
  params,
}: {
  params: Promise<{ movieId: string }>
}) {
  const { movieId } = use(params)

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <BookingContent movieId={movieId} />
    </Suspense>
  )
}

function BookingContent({ movieId }: { movieId: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const showtimeId = searchParams.get("showtime") || "s1"
  const theaterId = searchParams.get("theater") || "cineplex-central"
  const seatIds = (searchParams.get("seats") || "").split(",")

  const movie = movies.find((m) => m.id === movieId)
  const theater = theaters.find((t) => t.id === theaterId)
  const showtime = theater?.showtimes.find((s) => s.id === showtimeId)
  const allSeats = generateSeats(showtimeId)
  const selectedSeats = allSeats.filter((s) => seatIds.includes(s.id))

  const [step, setStep] = useState<BookingStep>("review")
  const [isProcessing, setIsProcessing] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)

  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0)
  const convenienceFee = 1.5 * selectedSeats.length
  const discount = promoApplied ? subtotal * 0.1 : 0
  const total = subtotal + convenienceFee - discount

  const bookingId = `SS${Date.now().toString(36).toUpperCase()}`

  const handlePayment = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setStep("confirmed")
    }, 2000)
  }

  if (!movie || !showtime || selectedSeats.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Invalid booking session</p>
      </div>
    )
  }

  // Confirmed state - show ticket
  if (step === "confirmed") {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
        {/* Success animation */}
        <div className="animate-fade-up flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-green-500/40 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Booking Confirmed!</h1>
          <p className="text-sm text-muted-foreground mt-1">Your tickets are ready</p>
        </div>

        {/* Ticket card */}
        <div className="w-full max-w-sm animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="rounded-t-2xl bg-card overflow-hidden">
            {/* Movie header */}
            <div className="relative h-36 overflow-hidden">
              <Image
                src={movie.poster || "/placeholder.svg"}
                alt={movie.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <h2 className="font-display font-bold text-foreground text-lg">{movie.title}</h2>
                <p className="text-xs text-muted-foreground">{movie.genre.join(" / ")}</p>
              </div>
            </div>

            {/* Ticket details */}
            <div className="p-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Date</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Time</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{showtime.time}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Format</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{showtime.format}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Seats</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {selectedSeats.map((s) => s.id).join(", ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {theater?.name}
              </div>
            </div>
          </div>

          {/* Tear line */}
          <div className="relative h-4 bg-card">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-border" />
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background" />
          </div>

          {/* Barcode area */}
          <div className="rounded-b-2xl bg-card p-4 flex flex-col items-center">
            <div className="flex items-center gap-1 mb-2">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-foreground rounded-sm"
                  style={{
                    width: `${(((i * 7 + 3) % 5) + 1)}px`,
                    height: "32px",
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-mono">{bookingId}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Show this ticket at the entrance
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-8 animate-fade-up" style={{ animationDelay: "400ms" }}>
          <button
            className="flex items-center gap-2 px-5 py-3 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors text-sm min-h-[48px]"
            aria-label="Download ticket"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            className="flex items-center gap-2 px-5 py-3 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors text-sm min-h-[48px]"
            aria-label="Share ticket"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 mt-6 text-sm text-primary font-medium min-h-[48px]"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="font-display font-semibold text-foreground text-sm">
              {step === "review" ? "Review Booking" : "Payment"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Step {step === "review" ? "1" : "2"} of 2
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: step === "review" ? "50%" : "100%" }}
          />
        </div>
      </header>

      <div className="pt-20 pb-32 px-4 max-w-2xl mx-auto">
        {step === "review" && (
          <div className="animate-fade-up">
            {/* Movie summary */}
            <div className="flex gap-4 p-4 rounded-xl bg-card mb-4">
              <div className="relative w-16 h-24 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={movie.poster || "/placeholder.svg"}
                  alt={movie.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h2 className="font-display font-bold text-foreground text-sm">{movie.title}</h2>
                <p className="text-xs text-muted-foreground mt-1">{movie.genre.join(" / ")}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {showtime.time}
                  </span>
                  <span>{showtime.format}</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-card mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Cinema
                </span>
                <span className="text-sm text-foreground font-medium">{theater?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </span>
                <span className="text-sm text-foreground font-medium">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  Seats
                </span>
                <span className="text-sm text-foreground font-medium">
                  {selectedSeats.map((s) => `${s.id} (${s.type})`).join(", ")}
                </span>
              </div>
            </div>

            {/* Promo code */}
            <div className="p-4 rounded-xl bg-card mb-4">
              <p className="text-sm font-medium text-foreground mb-2">Promo Code</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={() => {
                    if (promoCode.length > 0) setPromoApplied(true)
                  }}
                  disabled={promoApplied}
                  className={cn(
                    "px-4 py-2.5 rounded-lg text-sm font-medium min-h-[44px]",
                    promoApplied
                      ? "bg-green-500/20 text-green-400"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {promoApplied ? "Applied" : "Apply"}
                </button>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="flex flex-col gap-2 p-4 rounded-xl bg-card">
              <h3 className="text-sm font-semibold text-foreground mb-1">Price Summary</h3>
              {selectedSeats.map((seat) => (
                <div key={seat.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Seat {seat.id} ({seat.type})
                  </span>
                  <span className="text-foreground">${seat.price.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Convenience fee</span>
                <span className="text-foreground">${convenienceFee.toFixed(2)}</span>
              </div>
              {promoApplied && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-400">Promo discount (10%)</span>
                  <span className="text-green-400">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-border my-1" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="animate-fade-up">
            <div className="flex flex-col gap-4">
              {/* Payment methods */}
              <div className="p-4 rounded-xl bg-card">
                <h3 className="text-sm font-semibold text-foreground mb-4">Payment Method</h3>
                {[
                  { id: "card", label: "Credit / Debit Card", icon: CreditCard },
                  { id: "wallet", label: "Digital Wallet", icon: Ticket },
                ].map((method, i) => (
                  <label
                    key={method.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      i === 0 ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        i === 0 ? "bg-primary/20" : "bg-secondary"
                      )}
                    >
                      <method.icon
                        className={cn(
                          "w-5 h-5",
                          i === 0 ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">{method.label}</span>
                    <div className="ml-auto">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          i === 0 ? "border-primary" : "border-muted"
                        )}
                      >
                        {i === 0 && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Card form */}
              <div className="p-4 rounded-xl bg-card">
                <h3 className="text-sm font-semibold text-foreground mb-4">Card Details</h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground" htmlFor="card-name">
                      Name on Card
                    </label>
                    <input
                      id="card-name"
                      type="text"
                      placeholder="John Doe"
                      className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground" htmlFor="card-number">
                      Card Number
                    </label>
                    <input
                      id="card-number"
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground" htmlFor="card-expiry">
                        Expiry
                      </label>
                      <input
                        id="card-expiry"
                        type="text"
                        placeholder="MM/YY"
                        className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground" htmlFor="card-cvv">
                        CVV
                      </label>
                      <input
                        id="card-cvv"
                        type="text"
                        placeholder="123"
                        className="w-full bg-secondary rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order summary mini */}
              <div className="p-4 rounded-xl bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedSeats.length} ticket{selectedSeats.length > 1 ? "s" : ""}
                  </span>
                  <span className="text-lg font-bold text-primary">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto">
          {step === "review" ? (
            <button
              onClick={() => setStep("payment")}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity min-h-[48px]"
            >
              <CreditCard className="w-4 h-4" />
              Proceed to Payment - ${total.toFixed(2)}
            </button>
          ) : (
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-6 py-3.5 font-semibold rounded-lg transition-all min-h-[48px]",
                isProcessing
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              )}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Payment - ${total.toFixed(2)}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
