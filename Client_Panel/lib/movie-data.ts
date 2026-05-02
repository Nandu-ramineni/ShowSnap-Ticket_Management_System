export interface Movie {
  id: string
  title: string
  genre: string[]
  rating: number
  duration: string
  releaseDate: string
  poster: string
  synopsis: string
  director: string
  cast: string[]
  language: string
  certificate: string
}

export interface Showtime {
  id: string
  time: string
  format: string
  price: number
  available: number
}

export interface Theater {
  id: string
  name: string
  location: string
  showtimes: Showtime[]
}

export interface Seat {
  id: string
  row: string
  number: number
  type: "standard" | "premium" | "vip"
  status: "available" | "occupied" | "selected"
  price: number
}

export const movies: Movie[] = [
  {
    id: "cosmic-dawn",
    title: "Cosmic Dawn",
    genre: ["Sci-Fi", "Adventure"],
    rating: 8.7,
    duration: "2h 28m",
    releaseDate: "2026-02-01",
    poster: "/movies/cosmic-dawn.jpg",
    synopsis:
      "When a deep-space signal reveals the coordinates of humanity's origin, an elite crew embarks on a perilous journey to the edge of the observable universe. What they discover will change everything we know about existence.",
    director: "Elena Vasquez",
    cast: ["Marcus Chen", "Aria Patel", "James Okonkwo"],
    language: "English",
    certificate: "PG-13",
  },
  {
    id: "midnight-chase",
    title: "Midnight Chase",
    genre: ["Thriller", "Action"],
    rating: 8.2,
    duration: "2h 05m",
    releaseDate: "2026-01-24",
    poster: "/movies/midnight-chase.jpg",
    synopsis:
      "A former intelligence operative must navigate the rain-soaked streets of a sprawling metropolis to uncover a conspiracy that reaches the highest levels of government, all before the clock strikes midnight.",
    director: "David Park",
    cast: ["Sarah Mitchell", "Leo Rivera", "Nina Kowalski"],
    language: "English",
    certificate: "R",
  },
  {
    id: "the-last-garden",
    title: "The Last Garden",
    genre: ["Fantasy", "Drama"],
    rating: 9.1,
    duration: "2h 42m",
    releaseDate: "2026-01-17",
    poster: "/movies/the-last-garden.jpg",
    synopsis:
      "In a world where magic has faded from memory, a young botanist discovers an ancient garden that holds the key to restoring wonder to a world grown cold and cynical.",
    director: "Yuki Tanaka",
    cast: ["Emma Laurent", "Raj Kapoor", "Olivia Stone"],
    language: "English",
    certificate: "PG",
  },
  {
    id: "iron-resolve",
    title: "Iron Resolve",
    genre: ["Action", "Drama"],
    rating: 8.5,
    duration: "2h 18m",
    releaseDate: "2026-02-07",
    poster: "/movies/iron-resolve.jpg",
    synopsis:
      "A battle-hardened warrior returns from exile to defend the last free city from an overwhelming invasion force. With nothing but courage and iron will, one person stands between civilization and oblivion.",
    director: "Michael Torres",
    cast: ["Aiden Brooks", "Zara Khan", "Victor Osei"],
    language: "English",
    certificate: "PG-13",
  },
  {
    id: "echoes-of-tomorrow",
    title: "Echoes of Tomorrow",
    genre: ["Sci-Fi", "Romance"],
    rating: 8.9,
    duration: "2h 15m",
    releaseDate: "2026-01-31",
    poster: "/movies/echoes-of-tomorrow.jpg",
    synopsis:
      "In a neon-drenched future city, two strangers discover they share memories of a life together that hasn't happened yet. As they race against time, they must decide if fate can be rewritten.",
    director: "Sofia Reyes",
    cast: ["Luna Park", "Jake Morrison", "Priya Sharma"],
    language: "English",
    certificate: "PG-13",
  },
  {
    id: "silent-waters",
    title: "Silent Waters",
    genre: ["Mystery", "Thriller"],
    rating: 8.4,
    duration: "1h 58m",
    releaseDate: "2026-02-14",
    poster: "/movies/silent-waters.jpg",
    synopsis:
      "A lighthouse keeper on a remote island begins receiving cryptic messages from the sea. As a devastating storm approaches, dark secrets surface that have been buried beneath the waves for decades.",
    director: "Henrik Larsson",
    cast: ["Clara Bennett", "Thomas Wright", "Maya Johansson"],
    language: "English",
    certificate: "R",
  },
]

export const theaters: Theater[] = [
  {
    id: "cineplex-central",
    name: "SeatSecure Cineplex Central",
    location: "Downtown, Main Street",
    showtimes: [
      { id: "s1", time: "10:30 AM", format: "IMAX 3D", price: 18, available: 42 },
      { id: "s2", time: "1:15 PM", format: "Dolby Atmos", price: 16, available: 65 },
      { id: "s3", time: "4:00 PM", format: "Standard", price: 12, available: 88 },
      { id: "s4", time: "7:30 PM", format: "IMAX 3D", price: 20, available: 23 },
      { id: "s5", time: "10:45 PM", format: "Dolby Atmos", price: 16, available: 71 },
    ],
  },
  {
    id: "starlight-mall",
    name: "Starlight Cinema Mall",
    location: "Westside Shopping District",
    showtimes: [
      { id: "s6", time: "11:00 AM", format: "Standard", price: 10, available: 95 },
      { id: "s7", time: "2:30 PM", format: "Standard", price: 10, available: 78 },
      { id: "s8", time: "6:00 PM", format: "Dolby Atmos", price: 15, available: 54 },
      { id: "s9", time: "9:15 PM", format: "IMAX", price: 17, available: 36 },
    ],
  },
]

export function generateSeats(showtimeId: string): Seat[] {
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"]
  const seatsPerRow = 14
  const seats: Seat[] = []

  // Use showtimeId to seed the "occupied" pattern
  let seed = 0
  for (let i = 0; i < showtimeId.length; i++) {
    seed += showtimeId.charCodeAt(i)
  }

  for (const row of rows) {
    for (let num = 1; num <= seatsPerRow; num++) {
      const seatType: Seat["type"] =
        rows.indexOf(row) >= 8
          ? "vip"
          : rows.indexOf(row) >= 5
            ? "premium"
            : "standard"

      // Deterministic "random" based on position + seed
      const hash = (rows.indexOf(row) * seatsPerRow + num + seed) * 2654435761
      const isOccupied = (hash % 100) < 30

      const basePrice =
        seatType === "vip" ? 25 : seatType === "premium" ? 18 : 12

      seats.push({
        id: `${row}${num}`,
        row,
        number: num,
        type: seatType,
        status: isOccupied ? "occupied" : "available",
        price: basePrice,
      })
    }
  }

  return seats
}
