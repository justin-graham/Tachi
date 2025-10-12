import '../styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import { Providers } from '../lib/providers'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Tachi Protocol Dashboard',
  description: 'Publisher dashboard for content monetization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}