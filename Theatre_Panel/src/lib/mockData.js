// Mock data for SeatSecure Theatre Owner Panel

export const THEATRE = {
  id: "th_001",
  name: "PVR Cinemas — Andheri West",
  address: "Infinity Mall, New Link Rd, Andheri West",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400053",
  phone: "+91 98765 43210",
  email: "pvr.andheri@pvrcinemas.com",
  website: "https://pvrcinemas.com",
  isMultiplex: true,
  verified: true,
  amenities: ["Parking", "Food Court", "Wheelchair Access", "M-Ticket", "3D Glasses", "Dolby Sound", "Recliner Seats"],
  cancellationPolicy: { allowed: true, cutoffHours: 2, refundPercent: 80 },
  coverImage: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80",
  screens: 6,
};

export const SCREENS = [
  { id: "sc_1", name: "Screen 1 — IMAX", type: "IMAX", sound: "Dolby Atmos", projection: "Laser 4K", seats: 280, active: true, rows: 14, seatsPerRow: 20 },
  { id: "sc_2", name: "Screen 2 — Dolby", type: "Dolby", sound: "Dolby 7.1", projection: "4K", seats: 220, active: true, rows: 11, seatsPerRow: 20 },
  { id: "sc_3", name: "Screen 3 — Standard", type: "Standard", sound: "5.1 Surround", projection: "2K", seats: 180, active: true, rows: 9, seatsPerRow: 20 },
  { id: "sc_4", name: "Screen 4 — 4DX", type: "4DX", sound: "Dolby Atmos", projection: "4K", seats: 120, active: true, rows: 8, seatsPerRow: 15 },
  { id: "sc_5", name: "Screen 5 — Standard", type: "Standard", sound: "5.1 Surround", projection: "2K", seats: 160, active: true, rows: 8, seatsPerRow: 20 },
  { id: "sc_6", name: "Screen 6 — Premium", type: "Dolby", sound: "Dolby 7.1", projection: "4K", seats: 90, active: false, rows: 6, seatsPerRow: 15 },
];

export const MOVIES = [
  { id: "mv_1", title: "Kalki 2898-AD", duration: 181, genre: "Sci-Fi/Action", poster: "https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?w=200&q=80", rating: 8.4 },
  { id: "mv_2", title: "Stree 2", duration: 145, genre: "Horror/Comedy", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&q=80", rating: 8.9 },
  { id: "mv_3", title: "Fighter", duration: 166, genre: "Action", poster: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=200&q=80", rating: 7.2 },
  { id: "mv_4", title: "Animal Park", duration: 155, genre: "Action/Drama", poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=200&q=80", rating: 7.8 },
  { id: "mv_5", title: "Pushpa 2", duration: 195, genre: "Action/Drama", poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&q=80", rating: 9.1 },
];

export const SHOWTIMES = [
  { id: "st_001", movieId: "mv_5", movie: "Pushpa 2", screen: "Screen 1 — IMAX", screenId: "sc_1", date: "2026-04-18", startTime: "10:00", endTime: "13:15", format: "IMAX", language: "Hindi", totalSeats: 280, bookedSeats: 267, lockedSeats: 5, blockedSeats: 2, revenue: 2136000, status: "housefull", isPremiere: true },
  { id: "st_002", movieId: "mv_2", movie: "Stree 2", screen: "Screen 2 — Dolby", screenId: "sc_2", date: "2026-04-18", startTime: "10:30", endTime: "12:55", format: "Dolby", language: "Hindi", totalSeats: 220, bookedSeats: 198, lockedSeats: 3, blockedSeats: 0, revenue: 1188000, status: "active", isPremiere: false },
  { id: "st_003", movieId: "mv_1", movie: "Kalki 2898-AD", screen: "Screen 3 — Standard", screenId: "sc_3", date: "2026-04-18", startTime: "11:00", endTime: "14:01", format: "2D", language: "Telugu", totalSeats: 180, bookedSeats: 142, lockedSeats: 8, blockedSeats: 0, revenue: 710000, status: "active", isPremiere: false },
  { id: "st_004", movieId: "mv_4", movie: "Animal Park", screen: "Screen 4 — 4DX", screenId: "sc_4", date: "2026-04-18", startTime: "13:00", endTime: "15:35", format: "4DX", language: "Hindi", totalSeats: 120, bookedSeats: 45, lockedSeats: 2, blockedSeats: 5, revenue: 315000, status: "active", isPremiere: false },
  { id: "st_005", movieId: "mv_5", movie: "Pushpa 2", screen: "Screen 1 — IMAX", screenId: "sc_1", date: "2026-04-18", startTime: "14:30", endTime: "17:45", format: "IMAX", language: "Hindi", totalSeats: 280, bookedSeats: 189, lockedSeats: 12, blockedSeats: 2, revenue: 1512000, status: "active", isPremiere: false },
  { id: "st_006", movieId: "mv_3", movie: "Fighter", screen: "Screen 5 — Standard", screenId: "sc_5", date: "2026-04-18", startTime: "15:00", endTime: "17:46", format: "2D", language: "Hindi", totalSeats: 160, bookedSeats: 22, lockedSeats: 0, blockedSeats: 0, revenue: 110000, status: "active", isPremiere: false },
  { id: "st_007", movieId: "mv_2", movie: "Stree 2", screen: "Screen 2 — Dolby", screenId: "sc_2", date: "2026-04-18", startTime: "17:00", endTime: "19:25", format: "Dolby", language: "Hindi", totalSeats: 220, bookedSeats: 156, lockedSeats: 6, blockedSeats: 0, revenue: 936000, status: "active", isPremiere: false },
  { id: "st_008", movieId: "mv_1", movie: "Kalki 2898-AD", screen: "Screen 3 — Standard", screenId: "sc_3", date: "2026-04-18", startTime: "19:30", endTime: "22:31", format: "3D", language: "Hindi", totalSeats: 180, bookedSeats: 91, lockedSeats: 15, blockedSeats: 0, revenue: 546000, status: "active", isPremiere: false },
];

export const RECENT_BOOKINGS = [
  { id: "bk_001", ref: "SS-20260418-X7K2", customer: "Arjun Sharma", seats: ["F12", "F13"], amount: 8000, show: "Pushpa 2 • IMAX • 10:00", time: "2 min ago", status: "confirmed", paymentStatus: "paid" },
  { id: "bk_002", ref: "SS-20260418-M3P9", customer: "Priya Nair", seats: ["C5", "C6", "C7"], amount: 4500, show: "Stree 2 • Dolby • 10:30", time: "5 min ago", status: "confirmed", paymentStatus: "paid" },
  { id: "bk_003", ref: "SS-20260418-Q1R8", customer: "Rahul Gupta", seats: ["H8"], amount: 1200, show: "Kalki 2898-AD • 2D • 11:00", time: "8 min ago", status: "confirmed", paymentStatus: "paid" },
  { id: "bk_004", ref: "SS-20260418-T5W6", customer: "Sneha Patel", seats: ["A1", "A2"], amount: 6000, show: "Pushpa 2 • IMAX • 14:30", time: "12 min ago", status: "confirmed", paymentStatus: "paid" },
  { id: "bk_005", ref: "SS-20260418-K9L4", customer: "Vikram Singh", seats: ["D10", "D11", "D12", "D13"], amount: 12000, show: "Pushpa 2 • IMAX • 10:00", time: "15 min ago", status: "confirmed", paymentStatus: "paid" },
  { id: "bk_006", ref: "SS-20260418-N2B7", customer: "Anita Rao", seats: ["E3"], amount: 800, show: "Fighter • 2D • 15:00", time: "23 min ago", status: "cancelled", paymentStatus: "refunded" },
  { id: "bk_007", ref: "SS-20260418-P8D1", customer: "Kiran Reddy", seats: ["G15", "G16"], amount: 7200, show: "Stree 2 • Dolby • 17:00", time: "31 min ago", status: "confirmed", paymentStatus: "paid" },
  { id: "bk_008", ref: "SS-20260418-C3F5", customer: "Deepa Menon", seats: ["B4", "B5"], amount: 3200, show: "Kalki • 3D • 19:30", time: "45 min ago", status: "confirmed", paymentStatus: "paid" },
];

export const REVENUE_CHART_DATA = [
  { hour: "9 AM", revenue: 125000, tickets: 42 },
  { hour: "10 AM", revenue: 456000, tickets: 152 },
  { hour: "11 AM", revenue: 312000, tickets: 104 },
  { hour: "12 PM", revenue: 189000, tickets: 63 },
  { hour: "1 PM", revenue: 278000, tickets: 93 },
  { hour: "2 PM", revenue: 521000, tickets: 174 },
  { hour: "3 PM", revenue: 398000, tickets: 133 },
  { hour: "4 PM", revenue: 612000, tickets: 204 },
  { hour: "5 PM", revenue: 489000, tickets: 163 },
  { hour: "6 PM", revenue: 721000, tickets: 240 },
  { hour: "7 PM", revenue: 543000, tickets: 181 },
  { hour: "8 PM", revenue: 412000, tickets: 137 },
];

export const WEEKLY_REVENUE = [
  { day: "Mon", revenue: 2840000, tickets: 947 },
  { day: "Tue", revenue: 3120000, tickets: 1040 },
  { day: "Wed", revenue: 2690000, tickets: 897 },
  { day: "Thu", revenue: 3450000, tickets: 1150 },
  { day: "Fri", revenue: 5210000, tickets: 1737 },
  { day: "Sat", revenue: 7890000, tickets: 2630 },
  { day: "Sun", revenue: 8340000, tickets: 2780 },
];

export const SEAT_TYPE_REVENUE = [
  { name: "Recliner", value: 1820000, count: 182, color: "#E94560" },
  { name: "Premium", value: 1240000, count: 413, color: "#0F3460" },
  { name: "Gold", value: 890000, count: 593, color: "#FFC107" },
  { name: "Silver", value: 450000, count: 900, color: "#28A745" },
];

export const NOTIFICATIONS = [
  { id: "n1", type: "booking", title: "New Booking Confirmed", body: "SS-20260418-X7K2 — Pushpa 2 IMAX — ₹8,000", time: "2 min ago", read: false },
  { id: "n2", type: "housefull", title: "Show Housefull! 🎉", body: "Pushpa 2 • IMAX • 10:00 AM is now housefull", time: "5 min ago", read: false },
  { id: "n3", type: "booking", title: "New Booking Confirmed", body: "SS-20260418-M3P9 — Stree 2 Dolby — ₹4,500", time: "8 min ago", read: false },
  { id: "n4", type: "settlement", title: "Settlement Credited 💰", body: "₹2,34,560 credited for Apr 11–17 period", time: "1 hour ago", read: true },
  { id: "n5", type: "cancellation", title: "Booking Cancelled", body: "SS-20260418-N2B7 refunded — Fighter 2D — ₹800", time: "2 hours ago", read: true },
  { id: "n6", type: "booking", title: "New Booking Confirmed", body: "SS-20260418-T5W6 — Pushpa 2 IMAX — ₹6,000", time: "3 hours ago", read: true },
];

export const REVIEWS = [
  { id: "rv_1", movie: "Pushpa 2", customer: "Rahul M.", rating: 5, comment: "Fantastic IMAX experience! The sound quality was mind-blowing.", show: "IMAX • 18 Apr", time: "1 hour ago", flagged: false },
  { id: "rv_2", movie: "Stree 2", customer: "Priya S.", rating: 4, comment: "Great movie, good seats. AC could be a bit stronger.", show: "Dolby • 17 Apr", time: "3 hours ago", flagged: false },
  { id: "rv_3", movie: "Kalki 2898-AD", customer: "Arjun K.", rating: 3, comment: "Movie was okay. Popcorn machine queue was too long.", show: "2D • 17 Apr", time: "5 hours ago", flagged: false },
  { id: "rv_4", movie: "Fighter", customer: "Anonymous", rating: 1, comment: "This is completely inappropriate and wrong!", show: "2D • 16 Apr", time: "1 day ago", flagged: true },
  { id: "rv_5", movie: "Pushpa 2", customer: "Sneha P.", rating: 5, comment: "Best cinema experience ever! Recliner seats are worth every penny.", show: "IMAX • 16 Apr", time: "1 day ago", flagged: false },
];

export const formatINR = (paise) => {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rupees);
};

export const formatINRFromRupees = (rupees) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rupees);
};

export const generateSeatLayout = (rows, seatsPerRow) => {
  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const seats = [];
  for (let r = 0; r < rows; r++) {
    for (let s = 1; s <= seatsPerRow; s++) {
      const rand = Math.random();
      let status = 'available';
      if (rand < 0.55) status = 'booked';
      else if (rand < 0.65) status = 'locked';
      else if (rand < 0.70) status = 'blocked';
      
      let type = 'Silver';
      if (r < 2) type = 'Recliner';
      else if (r < 5) type = 'Premium';
      else if (r < 8) type = 'Gold';
      
      seats.push({
        id: `${rowLabels[r]}${s}`,
        row: rowLabels[r],
        number: s,
        type,
        status,
        price: type === 'Recliner' ? 1000 : type === 'Premium' ? 600 : type === 'Gold' ? 400 : 200,
      });
    }
  }
  return seats;
};