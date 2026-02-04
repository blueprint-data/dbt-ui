"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    unit?: string;
    statusText: string;
    statusColor: string;
    icon: React.ReactNode;
    className?: string;
    pulse?: boolean;
}

export function StatCard({
    title,
    value,
    unit,
    statusText,
    statusColor,
    icon,
    className,
    pulse = false,
}: StatCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePos({ x, y });
        cardRef.current.style.setProperty("--mouse-x", `${x}px`);
        cardRef.current.style.setProperty("--mouse-y", `${y}px`);
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            className={cn(
                "stat-card p-5 rounded-2xl flex flex-col gap-2 relative overflow-hidden group glass transition-all duration-300",
                className
            )}
        >
            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity text-sky-400 z-10">
                {icon}
            </div>

            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-600/80 z-10">
                {title}
            </span>

            <span className="text-3xl font-black tracking-tight text-slate-900 z-10 font-display">
                {value}
                {unit && <span className="text-lg text-slate-500 ml-0.5 font-sans">{unit}</span>}
            </span>

            <div className="flex items-center gap-2 mt-1 z-10">
                <div
                    className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        statusColor,
                        pulse && "animate-pulse"
                    )}
                />
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                    {statusText}
                </span>
            </div>
        </div>
    );
}
