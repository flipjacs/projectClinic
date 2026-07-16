import { useEffect, useState } from "react";

/** Assina uma media query e retorna se ela casa no momento. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Abaixo do breakpoint `sm` do Tailwind (640px) — usado para bottom sheets. */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 639px)");
}
