import { cn } from "@/utils/cn";

/**
 * Marca "OdontoPrime": glifo de dente dourado + wordmark. Reutilizado na
 * sidebar, na sidebar mobile e no login para manter a identidade consistente.
 */

interface LogoMarkProps {
  /** Tamanho do glifo em px (quadrado). */
  size?: number;
  className?: string;
}

/** Apenas o glifo (dente) dentro do quadrado grafite. */
export function LogoMark({ size = 36, className }: LogoMarkProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-graphite-900 shadow-ring",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        width={Math.round(size * 0.56)}
        height={Math.round(size * 0.56)}
        viewBox="0 0 32 32"
        fill="none"
      >
        <path
          d="M16 6c-3.6 0-6 1.6-6 4.6 0 2 .8 3.6 1.5 6.2.6 2.3.8 5.6 1.8 7.4.4.7 1.4.7 1.7-.1.5-1.3.6-3.2 1-3.2s.5 1.9 1 3.2c.3.8 1.3.8 1.7.1 1-1.8 1.2-5.1 1.8-7.4.7-2.6 1.5-4.2 1.5-6.2C22 7.6 19.6 6 16 6z"
          fill="#cda63f"
        />
      </svg>
    </span>
  );
}

interface LogoProps {
  /** Tom do texto — "light" para fundos escuros, "dark" para fundos claros. */
  tone?: "light" | "dark";
  size?: number;
  className?: string;
}

/** Marca completa: glifo + nome + tagline. */
export function Logo({ tone = "dark", size = 36, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={size} />
      <div className="leading-tight">
        <p
          className={cn(
            "text-sm font-semibold tracking-tight",
            tone === "light" ? "text-white" : "text-ink",
          )}
        >
          Odonto<span className="text-gold-400">Prime</span>
        </p>
        <p
          className={cn(
            "text-[11px]",
            tone === "light" ? "text-graphite-300" : "text-ink-mute",
          )}
        >
          Gestão odontológica
        </p>
      </div>
    </div>
  );
}
