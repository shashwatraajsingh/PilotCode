import React from 'react'
import { cn } from '@/lib/utils'

interface LogoProps extends React.SVGProps<SVGSVGElement> {
    className?: string
}

export function Logo({ className, ...props }: LogoProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("w-8 h-8", className)}
            {...props}
        >
            {/* Abstract Paper Plane / Cursor Shape */}
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
    )
}

export function LogoMinimal({ className, ...props }: LogoProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("w-8 h-8", className)}
            {...props}
        >
            {/* Sleek Abstract P / Wing */}
            <path d="M21 12L3 12" className="opacity-20" />
            <path d="M2 12L12 2L22 12L12 22L2 12Z" strokeWidth="1.5" />
            <path d="M12 2L12 22" strokeWidth="1.5" />
            <path d="M2 12L12 12" strokeWidth="1.5" />
        </svg>
    )
}

export function LogoGeometric({ className, ...props }: LogoProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            fill="none"
            className={cn("w-10 h-10", className)}
            {...props}
        >
            {/* Modern Geometric P + Code */}
            <path
                d="M30 20 L70 20 L85 50 L70 80 L30 80 L30 20"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinejoin="round"
            />
            <path
                d="M30 50 L70 50"
                stroke="currentColor"
                strokeWidth="8"
            />
            <circle cx="55" cy="50" r="12" fill="currentColor" />
        </svg>
    )
}
