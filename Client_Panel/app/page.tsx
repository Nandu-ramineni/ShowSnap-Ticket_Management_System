"use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { HeroCarousel } from "@/components/hero-carousel"
import { MovieCard } from "@/components/movie-card"
import { BottomNav } from "@/components/bottom-nav"
import { movies } from "@/lib/movie-data"
import { TrendingUp, Calendar, Sparkles } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const filters = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "new", label: "New Releases", icon: Calendar },
]

const genres = ["All", "Sci-Fi", "Thriller", "Fantasy", "Action", "Mystery", "Romance", "Drama"]

export default function Page() {
  const [activeFilter, setActiveFilter] = useState("all")
  const [activeGenre, setActiveGenre] = useState("All")

  const filteredMovies = movies.filter((movie) => {
    if (activeGenre !== "All" && !movie.genre.includes(activeGenre)) return false
    if (activeFilter === "trending") return movie.rating >= 8.5
    if (activeFilter === "new") {
      return new Date(movie.releaseDate) >= new Date("2026-01-25")
    }
    return true
  })

  return (
    <main className="min-h-screen pb-20 md:pb-0">
      <Header />

      {/* Hero section */}
      <HeroCarousel movies={movies} />

      {/* Now Showing section */}
      <section className="px-4 py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
              Now Showing
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose from the latest blockbusters
            </p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all min-h-[44px]",
                activeFilter === filter.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              <filter.icon className="w-3.5 h-3.5" />
              {filter.label}
            </button>
          ))}
        </div>

        {/* Genre chips */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all min-h-[36px]",
                activeGenre === genre
                  ? "bg-foreground text-background"
                  : "bg-transparent text-muted-foreground border border-border hover:border-foreground/30"
              )}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Movie grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {filteredMovies.map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} index={i} />
          ))}
        </div>

        {filteredMovies.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">No movies match your filters</p>
            <button
              onClick={() => { setActiveFilter("all"); setActiveGenre("All") }}
              className="text-primary text-sm font-medium mt-2"
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      {/* Quick picks */}
      <section className="px-4 py-8 max-w-7xl mx-auto">
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-6">
          Recommended For You
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
          {movies.slice(0, 4).map((movie, i) => (
            <div key={movie.id} className="flex-shrink-0 w-[280px] md:w-[340px]">
              <Link
                href={`/movie/${movie.id}`}
                className="group flex gap-4 p-3 rounded-xl bg-card hover:bg-secondary transition-colors"
              >
                <div className="relative w-20 h-28 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={movie.poster || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <h3 className="font-display font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{movie.genre.join(" / ")}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs font-semibold text-primary">{movie.rating}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div
                          key={j}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            j < Math.round(movie.rating / 2) ? "bg-primary" : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{movie.duration}</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  )
}
