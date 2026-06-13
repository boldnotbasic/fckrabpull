"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export default function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    // Start fade-out at ~3.6s, fully hidden at 4.0s total
    const t1 = setTimeout(() => setFadingOut(true), 3600)
    const t2 = setTimeout(() => setVisible(false), 4000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-center justify-center bg-[#12060a] transition-opacity duration-500 ease-in-out ${fadingOut ? "opacity-0" : "opacity-100"}`}
    >
      <div className={`transition-all duration-700 ease-in-out ${fadingOut ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
        <Image
          src="/Logo%20ZVC.png"
          alt="FC Krabpull"
          width={280}
          height={280}
          priority
          className="rounded-2xl shadow-2xl"
        />
      </div>
    </div>
  )
}
