"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMobile) return null;

  const navItems = [
    { label: "Discover", icon: "🔍", path: "/" },
    { label: "Bookings", icon: "📅", path: "/my-bookings" },
    { label: "Favorites", icon: "❤️", path: "/favorites" },
    { label: "Profile", icon: "👤", path: "/profile" },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '75px',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0, 0, 0, 0.05)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 1000,
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -5px 20px rgba(0, 0, 0, 0.03)'
    }}>
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link 
            key={item.label} 
            href={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              gap: '4px',
              transition: 'transform 0.1s'
            }}
          >
            <span style={{ 
              fontSize: '1.4rem', 
              opacity: isActive ? 1 : 0.4,
              transform: isActive ? 'scale(1.1)' : 'scale(1)'
            }}>
              {item.icon}
            </span>
            <span style={{ 
              fontSize: '0.65rem', 
              fontWeight: 800, 
              color: isActive ? '#000' : '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
