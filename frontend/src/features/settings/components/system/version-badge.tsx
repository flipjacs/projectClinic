/**
 * Versão do frontend em badge monoespaçada — o valor vem do `define` do
 * Vite (build), não de arquivos embutidos no bundle.
 */
export function VersionBadge({ version = __APP_VERSION__ }: { version?: string }) {
  return (
    <span className="rounded-md bg-surface-muted px-2 py-1 font-mono text-xs text-ink-soft ring-1 ring-inset ring-line">
      v{version}
    </span>
  );
}
