"use client"

import { use, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { movies, theaters } from "@/lib/movie-data"
import { Header } from "@/components/header"
import { BottomNav } from "@/components/bottom-nav"
import {
  ArrowLeft,
  Star,
  Clock,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const movie = movies.find((m) => m.id === id)

  const [selectedDate, setSelectedDate] = useState(0)
  const [selectedTheater, setSelectedTheater] = useState<string | null>(null)
  const [selectedShowtime, setSelectedShowtime] = useState<string | null>(null)

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Movie not found</p>
      </div>
    )
  }

  // Generate dates for next 7 days
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      date: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      full: date.toISOString().split("T")[0],
    }
  })

  const handleBooking = () => {
    if (!selectedShowtime) return
    router.push(
      `/select-seats/${movie.id}?showtime=${selectedShowtime}&theater=${selectedTheater}`
    )
  }

  return (
    <main className="min-h-screen pb-20 md:pb-0">
      <Header />

      {/* Hero backdrop */}
      <div className="relative w-full h-[50vh] md:h-[60vh]">
        <Image
          src={movie.poster || "/placeholder.svg"}
          alt={movie.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-16 left-4 z-10 flex items-center justify-center w-10 h-10 rounded-full glass"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Movie info */}
      <div className="relative -mt-32 px-4 max-w-4xl mx-auto z-10">
        <div className="flex gap-4 md:gap-6">
          {/* Poster thumbnail */}
          <div className="relative w-28 h-40 md:w-36 md:h-52 rounded-xl overflow-hidden flex-shrink-0 shadow-2xl">
            <Image
              src={movie.poster || "/placeholder.svg"}
              alt={movie.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col justify-end min-w-0 pb-1">
            <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground text-balance">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-2">
              {movie.genre.map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/15 text-primary border border-primary/20"
                >
                  {g}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span className="text-foreground font-bold">{movie.rating}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {movie.duration}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(movie.releaseDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="px-2 py-0.5 text-xs border border-border rounded">
                {movie.certificate}
              </span>
            </div>
          </div>
        </div>

        {/* Synopsis */}
        <div className="mt-6">
          <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider mb-2">
            Synopsis
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {movie.synopsis}
          </p>
        </div>

        {/* Cast & Crew */}
        <div className="mt-6">
          <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider mb-3">
            Cast & Crew
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-[72px]">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-lg font-display font-bold text-muted-foreground">
                  {movie.director[0]}
                </span>
              </div>
              <span className="text-xs text-foreground font-medium text-center truncate w-full">
                {movie.director.split(" ")[0]}
              </span>
              <span className="text-[10px] text-primary font-medium">Director</span>
            </div>
            {movie.cast.map((actor) => (
              <div
                key={actor}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-[72px]"
              >
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-lg font-display font-bold text-muted-foreground">
                    {actor[0]}
                  </span>
                </div>
                <span className="text-xs text-foreground font-medium text-center truncate w-full">
                  {actor.split(" ")[0]}
                </span>
                <span className="text-[10px] text-muted-foreground">Actor</span>
              </div>
            ))}
          </div>
        </div>

        {/* Date selector */}
        <div className="mt-8">
          <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider mb-3">
            Select Date
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {dates.map((d, i) => (
              <button
                key={d.full}
                onClick={() => setSelectedDate(i)}
                className={cn(
                  "flex flex-col items-center px-4 py-3 rounded-xl min-w-[64px] min-h-[72px] transition-all",
                  selectedDate === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-secondary"
                )}
              >
                <span className="text-[10px] font-medium uppercase">{d.day}</span>
                <span className="text-lg font-bold">{d.date}</span>
                <span className="text-[10px]">{d.month}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theaters & Showtimes */}
        <div className="mt-8 mb-8">
          <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider mb-4">
            Select Showtime
          </h2>
          <div className="flex flex-col gap-4">
            {theaters.map((theater) => (
              <div key={theater.id} className="rounded-xl bg-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display font-semibold text-foreground text-sm">
                      {theater.name}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {theater.location}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {theater.showtimes.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setSelectedTheater(theater.id)
                        setSelectedShowtime(st.id)
                      }}
                      className={cn(
                        "flex flex-col items-center px-4 py-2.5 rounded-lg border min-h-[60px] transition-all",
                        selectedShowtime === st.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-foreground hover:border-muted-foreground"
                      )}
                    >
                      <span className="text-sm font-semibold">{st.time}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {st.format}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground mt-0.5">
                        <Users className="w-2.5 h-2.5" />
                        {st.available} left
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      {selectedShowtime && (
        <div className="fixed bottom-0 left-0 right-0 z-40 glass p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4 animate-fade-up">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div>
              <p className="text-xs text-muted-foreground">Selected</p>
              <p className="text-sm font-semibold text-foreground">
                {theaters
                  .flatMap((t) => t.showtimes)
                  .find((s) => s.id === selectedShowtime)?.time}{" "}
                -{" "}
                {theaters
                  .flatMap((t) => t.showtimes)
                  .find((s) => s.id === selectedShowtime)?.format}
              </p>
            </div>
            <button
              onClick={handleBooking}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity min-h-[48px]"
            >
              Select Seats
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  )
}
