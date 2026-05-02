"use client"

import Image from "next/image"
import Link from "next/link"
import { Star, Clock } from "lucide-react"
import type { Movie } from "@/lib/movie-data"

interface MovieCardProps {
  movie: Movie
  index: number
}

export function MovieCard({ movie, index }: MovieCardProps) {
  return (
    <Link
      href={`/movie/${movie.id}`}
      className="group block animate-fade-up"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "backwards" }}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3">
        <Image
          src={movie.poster || "/placeholder.svg"}
          alt={movie.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Rating badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md glass text-xs font-semibold">
          <Star className="w-3 h-3 fill-primary text-primary" />
          <span className="text-foreground">{movie.rating}</span>
        </div>

        {/* Hover CTA */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg">
            Book Now
          </div>
        </div>
      </div>

      <h3 className="font-display font-semibold text-foreground text-sm md:text-base mb-1 truncate group-hover:text-primary transition-colors">
        {movie.title}
      </h3>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {movie.duration}
        </span>
        <span>{movie.genre[0]}</span>
      </div>
    </Link>
  )
}
