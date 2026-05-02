"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Star, Clock, Play, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Movie } from "@/lib/movie-data"

interface HeroCarouselProps {
  movies: Movie[]
}

export function HeroCarousel({ movies }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0)
  const featured = movies.slice(0, 4)

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % featured.length)
  }, [featured.length])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + featured.length) % featured.length)
  }, [featured.length])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  const movie = featured[current]

  return (
    <section className="relative w-full h-[75vh] md:h-[80vh] overflow-hidden">
      {/* Background image */}
      {featured.map((m, i) => (
        <div
          key={m.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === current ? "opacity-100" : "opacity-0"
          )}
        >
          <Image
            src={m.poster || "/placeholder.svg"}
            alt={m.title}
            fill
            className="object-cover"
            priority={i === 0}
          />
          {/* Overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 md:pb-16 max-w-7xl mx-auto">
        <div className="animate-fade-up" key={movie.id}>
          <div className="flex items-center gap-3 mb-3">
            {movie.genre.map((g) => (
              <span
                key={g}
                className="px-3 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary border border-primary/30"
              >
                {g}
              </span>
            ))}
          </div>

          <h1 className="font-display text-3xl md:text-6xl font-bold text-foreground mb-3 text-balance">
            {movie.title}
          </h1>

          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="text-foreground font-semibold">{movie.rating}</span>
              <span>/10</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {movie.duration}
            </span>
            <span className="px-2 py-0.5 text-xs border border-border rounded">
              {movie.certificate}
            </span>
          </div>

          <p className="text-sm md:text-base text-muted-foreground max-w-lg mb-6 leading-relaxed line-clamp-2 md:line-clamp-3">
            {movie.synopsis}
          </p>

          <div className="flex items-center gap-3">
            <Link
              href={`/movie/${movie.id}`}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm md:text-base"
            >
              <Ticket className="w-4 h-4" />
              Book Tickets
            </Link>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors text-sm md:text-base"
              aria-label={`Watch ${movie.title} trailer`}
            >
              <Play className="w-4 h-4" />
              Trailer
            </button>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <div className="absolute right-4 bottom-8 md:right-8 md:bottom-16 flex items-center gap-2">
        <button
          onClick={prev}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
          aria-label="Previous movie"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={next}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
          aria-label="Next movie"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 md:hidden">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === current ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}


