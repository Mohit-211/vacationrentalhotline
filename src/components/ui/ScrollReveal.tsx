"use client";

import { useEffect } from "react";

/**
 * Fades in the page's [data-reveal] elements as they scroll into view, once
 * (styles in globals.css). Elements already on screen when the page loads are
 * left as they are, so nothing flashes. Render it once on a page.
 */
export function ScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "scroll");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    for (const element of document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-revealed])")) {
      if (element.getBoundingClientRect().top < window.innerHeight) element.setAttribute("data-revealed", "instant");
      else observer.observe(element);
    }
    // Only now hide what's still below the fold: it's off screen, so no flash.
    const root = document.documentElement;
    root.classList.add("reveal-ready");
    return () => {
      observer.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);
  return null;
}
