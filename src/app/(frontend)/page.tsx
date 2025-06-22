import { redirect } from 'next/navigation'
import './globals.css'

export default function HomePage() {
  // For the root route, we'll always redirect to login
  // The middleware will handle redirecting authenticated users to dashboard
  redirect('/login')
}
