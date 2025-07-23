import React from 'react'
import './globals.css'

export const metadata = {
  description: 'MCS',
  title: 'MCS Operations',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main className="w-full">{children}</main>
      </body>
    </html>
  )
}
