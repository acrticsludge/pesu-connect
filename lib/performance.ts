// Performance optimization utilities

/**
 * Debounce function to optimize event handlers
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to optimize frequent event handlers
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Optimize images for Next.js
 */
export const imageOptimizationConfig = {
  formats: ["image/avif", "image/webp"],
  sizes: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  },
};

/**
 * Preload images for better performance
 */
export function preloadImage(src: string) {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Intersection Observer helper for lazy loading
 */
export function observeElement(
  element: HTMLElement | null,
  callback: (isInView: boolean) => void,
  options?: IntersectionObserverInit,
) {
  if (!element) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      callback(entry.isIntersecting);
    },
    {
      threshold: 0.1,
      ...options,
    },
  );

  observer.observe(element);
  return () => observer.disconnect();
}
