"use client";

import { useEffect, useRef } from "react";
import { throttle } from "@/lib/performance";

/**
 * Hook for smooth, optimized scroll behavior
 * Uses RequestAnimationFrame for better performance
 */
export function useSmoothScroll(ref: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let animationId: number | null = null;
    let isScrolling = false;

    const handleWheel = throttle((e: WheelEvent) => {
      if (!isScrolling) {
        isScrolling = true;

        const scrollAmount = e.deltaY > 0 ? 50 : -50;
        const startX = element.scrollLeft;
        const targetX = Math.max(
          0,
          Math.min(
            startX + scrollAmount,
            element.scrollWidth - element.clientWidth,
          ),
        );

        const distance = targetX - startX;
        const duration = 300;
        const startTime = performance.now();

        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Easing function for smooth animation
          const easeProgress =
            progress < 0.5
              ? 2 * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          element.scrollLeft = startX + distance * easeProgress;

          if (progress < 1) {
            animationId = requestAnimationFrame(animateScroll);
          } else {
            isScrolling = false;
          }
        };

        animationId = requestAnimationFrame(animateScroll);
      }
    }, 100);

    element.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      element.removeEventListener("wheel", handleWheel);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [ref]);
}

/**
 * Hook for lazy loading elements as they come into view
 */
export function useLazyLoad(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.style.opacity = "1";
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 },
    );

    element.style.opacity = "0";
    element.style.transition = "opacity 0.6s ease-in-out";
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);
}
