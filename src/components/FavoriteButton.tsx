"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/[slug]/favoriteActions";
import { useRouter } from "next/navigation";

export default function FavoriteButton({ 
    tenantId, 
    initialIsFavorited 
}: { 
    tenantId: string; 
    initialIsFavorited: boolean 
}) {
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleFavorite(tenantId);
            if (result.success) {
                setIsFavorited(result.favorited || false);
                router.refresh();
            } else {
                alert(result.error);
            }
        });
    };

    return (
        <button 
            onClick={handleToggle}
            disabled={isPending}
            style={{
                background: 'none',
                border: 'none',
                cursor: isPending ? 'not-allowed' : 'pointer',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s ease',
                padding: '8px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                opacity: isPending ? 0.6 : 1
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
        >
            <span style={{ 
                color: isFavorited ? '#ff4444' : '#ccc',
                transition: 'color 0.2s ease'
            }}>
                {isFavorited ? '❤️' : '🤍'}
            </span>
        </button>
    );
}
