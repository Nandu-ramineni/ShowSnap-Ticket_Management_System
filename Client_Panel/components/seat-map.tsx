"use client"

import { cn } from "@/lib/utils"
import type { Seat } from "@/lib/movie-data"
import { useRef, useState } from "react"

interface SeatMapProps {
  seats: Seat[]
  selectedSeats: string[]
  onSeatToggle: (seatId: string) => void
}

export function SeatMap({ seats, selectedSeats, onSeatToggle }: SeatMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  
  const rows = [...new Set(seats.map((s) => s.row))].sort()
  const seatsPerRow = Math.max(...seats.map((s) => s.number))

  const getSeatColor = (seat: Seat) => {
    if (seat.status === "occupied") return "bg-muted/60 cursor-not-allowed"
    if (selectedSeats.includes(seat.id)) return "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 ring-offset-background"
    if (seat.type === "vip") return "bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30 text-amber-400"
    if (seat.type === "premium") return "bg-cyan-500/20 border-cyan-500/40 hover:bg-cyan-500/30 text-cyan-400"
    return "bg-secondary border-border hover:bg-secondary/80 text-foreground"
  }

  return (
    <div className="flex flex-col items-center">
      {/* Screen */}
      <div className="relative w-[85%] max-w-md mb-10">
        <div className="screen-glow w-full h-2 rounded-b-[50%] bg-gradient-to-r from-transparent via-[hsl(200,80%,70%)] to-transparent opacity-60" />
        <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-3 font-medium">
          Screen
        </p>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setScale(s => Math.max(0.6, s - 0.1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary text-foreground text-sm font-bold"
          aria-label="Zoom out"
        >
          -
        </button>
        <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale(s => Math.min(1.4, s + 0.1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary text-foreground text-sm font-bold"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>

      {/* Seat grid */}
      <div
        ref={containerRef}
        className="overflow-x-auto overflow-y-visible w-full pb-4 scrollbar-none"
      >
        <div
          className="flex flex-col gap-1.5 items-center min-w-fit px-4 transition-transform duration-200"
          style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
        >
          {rows.map((row) => {
            const rowSeats = seats.filter((s) => s.row === row)
            const rowType = rowSeats[0]?.type
            const isNewSection =
              (row === "F" && rowSeats[0]?.type === "premium") ||
              (row === "J" && rowSeats[0]?.type === "vip")

            return (
              <div key={row}>
                {isNewSection && (
                  <div className="flex items-center gap-2 my-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-medium">
                      {rowType === "vip" ? "VIP Lounge" : "Premium"}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="w-5 text-right text-[10px] text-muted-foreground font-medium mr-1">
                    {row}
                  </span>
                  <div className="flex gap-1">
                    {rowSeats.map((seat, i) => {
                      // Add aisle gap
                      const hasAisle = i === Math.floor(seatsPerRow / 2) - 1

                      return (
                        <div key={seat.id} className={cn("flex", hasAisle && "mr-4")}>
                          <button
                            onClick={() =>
                              seat.status !== "occupied" && onSeatToggle(seat.id)
                            }
                            disabled={seat.status === "occupied"}
                            className={cn(
                              "w-7 h-7 md:w-8 md:h-8 rounded-t-lg rounded-b-sm text-[9px] font-semibold border transition-all duration-150 flex items-center justify-center",
                              getSeatColor(seat),
                              seat.status === "occupied" && "opacity-30",
                              selectedSeats.includes(seat.id) && "scale-110"
                            )}
                            aria-label={`Seat ${seat.id}, ${seat.type}, ${seat.status === "occupied" ? "occupied" : selectedSeats.includes(seat.id) ? "selected" : "available"}`}
                          >
                            {seat.number}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <span className="w-5 text-left text-[10px] text-muted-foreground font-medium ml-1">
                    {row}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6 px-4">
        {[
          { label: "Available", className: "bg-secondary border-border" },
          { label: "Selected", className: "bg-primary" },
          { label: "Occupied", className: "bg-muted/60 opacity-30" },
          { label: "Premium", className: "bg-cyan-500/20 border-cyan-500/40" },
          { label: "VIP", className: "bg-amber-500/20 border-amber-500/40" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-5 h-5 rounded-t-md rounded-b-sm border",
                item.className
              )}
            />
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
