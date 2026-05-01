import { User } from '@supabase/supabase-js'

export type UserRole = 'owner' | 'manager' | 'staff'

export interface TheatreOwner extends User {
  theatre_owner_id?: string
  role?: UserRole
  theatre_ids?: string[]
}

export interface AuthContextType {
  user: TheatreOwner | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, theatreName: string) => Promise<void>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}
