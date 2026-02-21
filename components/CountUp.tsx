"use client";

import { useEffect, useState, useRef } from "react";

interface CountUpProps {
    end: number;
    duration?: number;
    className?: string;
}

const easeOutExpo = (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

export default function CountUp({ end, duration = 2000, className = "" }: CountUpProps) {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        // Reset when the target changes
        startTimeRef.current = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = timestamp - startTimeRef.current;

            // Calculate progress percentage (0 to 1)
            const percentage = Math.min(progress / duration, 1);

            // Apply easing function
            const easedProgress = easeOutExpo(percentage);

            // Calculate current value
            const currentCount = Math.floor(easedProgress * end);

            if (currentCount !== countRef.current) {
                countRef.current = currentCount;
                setCount(currentCount);
            }

            if (percentage < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                // Ensure we end on the exact number
                setCount(end);
                countRef.current = end;
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [end, duration]);

    return <span className={className}>{count.toLocaleString("th-TH")}</span>;
}
