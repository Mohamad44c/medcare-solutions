import React from 'react'
import './globals.css'
import Providers from './providers'

export const metadata = {
  description: 'MCS',
  title: 'MCS Operations',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <Providers>
          <main className="w-full">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
