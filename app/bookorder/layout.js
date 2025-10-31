"use client";
import "../globals.css";
// import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "../utils/ThemeProvider";

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Kameron:wght@400..700&family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Kameron:wght@400..700&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap"
            rel="stylesheet"
          />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true"></link>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet"></link>
          <link href="https://fonts.googleapis.com/css2?family=Anek+Gujarati:wght@100..800&display=swap" rel="stylesheet"></link>
        </head>
      </head>
      <body
        className={`antialiased `}
      >
        <ThemeProvider>
          {/* <Sidebar/> */}
          {children}
          </ThemeProvider>
      </body>
    </html>
  );
}
