import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://escwyzzedngsuglyrwvp.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzY3d5enplZG5nc3VnbHlyd3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjM4NDMsImV4cCI6MjA3NTUzOTg0M30.a6sridEG5CnA0uOcGvzsKfWFL7rf3y33cFvNsBtas8k'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Product {
  id: number
  name: string
  description: string
  price: number
  quantity: number
  category: string
  barcode?: string
  low_stock_threshold: number
  cost_price?: number
  selling_price?: number
  brand?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  status: string
  total_amount: number
  subtotal_amount: number
  pos_charge: number
  payment_mode: 'cash' | 'pos'
  tax_amount: number
  order_date: string
  notes?: string
  items?: OrderItem[]
}

export interface OrderItem {
  id?: number
  order_id?: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface User {
  id: number
  username: string
  email: string
  role: string
  created_at: string
}
