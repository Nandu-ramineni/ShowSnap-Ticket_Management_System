-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for theatre owners and staff)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Theatres table
CREATE TABLE IF NOT EXISTS theatres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  city VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  opening_time TIME,
  closing_time TIME,
  is_active BOOLEAN DEFAULT true,
  commission_percentage DECIMAL(5, 2) DEFAULT 10.00,
  refund_policy_days INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screens table
CREATE TABLE IF NOT EXISTS screens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theatre_id UUID NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
  screen_name VARCHAR(100) NOT NULL,
  screen_type VARCHAR(50) CHECK (screen_type IN ('2D', '3D', 'IMAX')),
  total_seats INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seat types
CREATE TABLE IF NOT EXISTS seat_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theatre_id UUID NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
  type_name VARCHAR(100) NOT NULL,
  base_price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seats
CREATE TABLE IF NOT EXISTS seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  screen_id UUID NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  seat_row VARCHAR(1),
  seat_number INTEGER,
  seat_type_id UUID REFERENCES seat_types(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(screen_id, seat_row, seat_number)
);

-- Movies
CREATE TABLE IF NOT EXISTS movies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theatre_id UUID NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  genre VARCHAR(100),
  duration INTEGER,
  rating VARCHAR(20),
  language VARCHAR(50),
  poster_url VARCHAR(500),
  description TEXT,
  release_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shows
CREATE TABLE IF NOT EXISTS shows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  screen_id UUID NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  show_date DATE NOT NULL,
  show_time TIME NOT NULL,
  capacity INTEGER,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Show seat pricing
CREATE TABLE IF NOT EXISTS show_seat_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  seat_type_id UUID NOT NULL REFERENCES seat_types(id),
  price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_id UUID NOT NULL REFERENCES shows(id),
  booking_reference VARCHAR(50) UNIQUE,
  total_seats INTEGER,
  total_amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'pending')),
  payment_status VARCHAR(50) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'failed')),
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking seats
CREATE TABLE IF NOT EXISTS booking_seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id),
  status VARCHAR(50) DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2),
  payment_method VARCHAR(50),
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transaction_id VARCHAR(100) UNIQUE,
  status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2),
  reason VARCHAR(255),
  refund_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'rejected')),
  processed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theatre_id UUID NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(theatre_id, user_id)
);

-- Theatre settings
CREATE TABLE IF NOT EXISTS theatre_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theatre_id UUID NOT NULL REFERENCES theatres(id) ON DELETE CASCADE,
  setting_key VARCHAR(255) NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(theatre_id, setting_key)
);

-- Create indexes
CREATE INDEX idx_theatres_owner_id ON theatres(owner_id);
CREATE INDEX idx_screens_theatre_id ON screens(theatre_id);
CREATE INDEX idx_movies_theatre_id ON movies(theatre_id);
CREATE INDEX idx_shows_movie_id ON shows(movie_id);
CREATE INDEX idx_shows_screen_id ON shows(screen_id);
CREATE INDEX idx_bookings_show_id ON bookings(show_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_refunds_booking_id ON refunds(booking_id);
CREATE INDEX idx_staff_theatre_id ON staff(theatre_id);
CREATE INDEX idx_theatre_settings_theatre_id ON theatre_settings(theatre_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE theatres ENABLE ROW LEVEL SECURITY;
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE theatre_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Theatres: Owner can access only their theatres
CREATE POLICY theatres_owner_policy ON theatres
  FOR ALL USING (owner_id = auth.uid());

-- Screens: User can access if they own the theatre
CREATE POLICY screens_access_policy ON screens
  FOR ALL USING (EXISTS (
    SELECT 1 FROM theatres WHERE theatres.id = screens.theatre_id AND theatres.owner_id = auth.uid()
  ));

-- Shows, Movies, Bookings: Similar access control
CREATE POLICY movies_access_policy ON movies
  FOR ALL USING (EXISTS (
    SELECT 1 FROM theatres WHERE theatres.id = movies.theatre_id AND theatres.owner_id = auth.uid()
  ));

CREATE POLICY shows_access_policy ON shows
  FOR ALL USING (EXISTS (
    SELECT 1 FROM screens 
    JOIN theatres ON screens.theatre_id = theatres.id 
    WHERE screens.id = shows.screen_id AND theatres.owner_id = auth.uid()
  ));

CREATE POLICY bookings_access_policy ON bookings
  FOR ALL USING (EXISTS (
    SELECT 1 FROM shows
    JOIN screens ON shows.screen_id = screens.id
    JOIN theatres ON screens.theatre_id = theatres.id
    WHERE shows.id = bookings.show_id AND theatres.owner_id = auth.uid()
  ));

CREATE POLICY payments_access_policy ON payments
  FOR ALL USING (EXISTS (
    SELECT 1 FROM bookings
    JOIN shows ON bookings.show_id = shows.id
    JOIN screens ON shows.screen_id = screens.id
    JOIN theatres ON screens.theatre_id = theatres.id
    WHERE bookings.id = payments.booking_id AND theatres.owner_id = auth.uid()
  ));

CREATE POLICY refunds_access_policy ON refunds
  FOR ALL USING (EXISTS (
    SELECT 1 FROM bookings
    JOIN shows ON bookings.show_id = shows.id
    JOIN screens ON shows.screen_id = screens.id
    JOIN theatres ON screens.theatre_id = theatres.id
    WHERE bookings.id = refunds.booking_id AND theatres.owner_id = auth.uid()
  ));

CREATE POLICY staff_access_policy ON staff
  FOR ALL USING (theatre_id IN (
    SELECT id FROM theatres WHERE owner_id = auth.uid()
  ));

CREATE POLICY theatre_settings_access_policy ON theatre_settings
  FOR ALL USING (theatre_id IN (
    SELECT id FROM theatres WHERE owner_id = auth.uid()
  ));
