import "./globals.css";

export const metadata = {
  title: "Tachi Publisher Dashboard",
  description: "Onboard to the Tachi pay-per-crawl protocol",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
