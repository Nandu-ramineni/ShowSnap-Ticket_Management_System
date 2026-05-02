"use client"

import { use, useState, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { movies, theaters, generateSeats } from "@/lib/movie-data"
import type { Seat } from "@/lib/movie-data"
import { SeatMap } from "@/components/seat-map"
import { ArrowLeft, Ticket, X, Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SelectSeatsPage({
  params,
}: {
  params: Promise<{ movieId: string }>
}) {
  const { movieId } = use(params)

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SelectSeatsContent movieId={movieId} />
    </Suspense>
  )
}

function SelectSeatsContent({ movieId }: { movieId: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const showtimeId = searchParams.get("showtime") || "s1"
  const theaterId = searchParams.get("theater") || "cineplex-central"

  const movie = movies.find((m) => m.id === movieId)
  const theater = theaters.find((t) => t.id === theaterId)
  const showtime = theater?.showtimes.find((s) => s.id === showtimeId)

  const seats = useMemo(() => generateSeats(showtimeId), [showtimeId])
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])
  const [ticketCount, setTicketCount] = useState(2)

  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id))

  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0)

  const handleSeatToggle = (seatId: string) => {
    setSelectedSeatIds((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId)
      }
      if (prev.length >= ticketCount) {
        // Replace the first selected seat
        return [...prev.slice(1), seatId]
      }
      return [...prev, seatId]
    })
  }

  const removeSeat = (seatId: string) => {
    setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId))
  }

  const handleProceed = () => {
    if (selectedSeats.length === 0) return
    const seatIds = selectedSeatIds.join(",")
    router.push(
      `/booking/${movieId}?showtime=${showtimeId}&theater=${theaterId}&seats=${seatIds}`
    )
  }

  if (!movie || !showtime) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Session not found</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="flex items-center gap-3 px-4 py-3 max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-semibold text-foreground text-sm truncate">
              {movie.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {showtime.time} / {showtime.format} / {theater?.name}
            </p>
          </div>
        </div>
      </header>

      <div className="pt-20 pb-36 max-w-4xl mx-auto">
        {/* Ticket count */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-card">
            <div>
              <p className="text-sm font-medium text-foreground">How many seats?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select up to {ticketCount} seats on the map
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setTicketCount((c) => Math.max(1, c - 1))
                  setSelectedSeatIds((prev) => prev.slice(0, Math.max(1, ticketCount - 1)))
                }}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary text-foreground"
                aria-label="Decrease ticket count"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-bold text-foreground w-6 text-center">
                {ticketCount}
              </span>
              <button
                onClick={() => setTicketCount((c) => Math.min(8, c + 1))}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary text-foreground"
                aria-label="Increase ticket count"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Seat map */}
        <SeatMap
          seats={seats}
          selectedSeats={selectedSeatIds}
          onSeatToggle={handleSeatToggle}
        />

        {/* Selected seats summary */}
        {selectedSeats.length > 0 && (
          <div className="px-4 mt-6">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
              Selected Seats
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedSeats.map((seat) => (
                <div
                  key={seat.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {seat.id}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {seat.type}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary">${seat.price}</span>
                  <button
                    onClick={() => removeSeat(seat.id)}
                    className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center ml-1"
                    aria-label={`Remove seat ${seat.id}`}
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <p className="text-xs text-muted-foreground">
              {selectedSeats.length} of {ticketCount} seats
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">
                ${totalPrice.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">total</span>
            </div>
          </div>
          <button
            onClick={handleProceed}
            disabled={selectedSeats.length === 0}
            className={cn(
              "flex items-center gap-2 px-6 py-3.5 font-semibold rounded-lg transition-all min-h-[48px]",
              selectedSeats.length > 0
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Ticket className="w-4 h-4" />
            Continue
          </button>
        </div>
      </div>
    </main>
  )
}
