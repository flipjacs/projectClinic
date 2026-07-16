import { AnimatePresence, m } from "framer-motion";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { EASE } from "@/lib/motion";
import { cn } from "@/utils/cn";
import type { LogoValue } from "../../schemas/clinic-schema";
import {
  ACCEPTED_IMAGE_TYPES,
  compressImage,
  validateImageFile,
  type ImageValidationRules,
} from "../../utils/image";

interface LogoUploaderProps {
  label: string;
  description: string;
  value: LogoValue | null;
  onChange: (value: LogoValue | null) => void;
  rules: ImageValidationRules;
  /** Proporção da área de preview. */
  shape?: "wide" | "square";
}

/**
 * Upload de logo com arrastar-e-soltar, pré-visualização instantânea,
 * validação (tipo, tamanho, resolução) e compressão automática de imagens
 * grandes — tudo antes de qualquer byte ir ao servidor.
 */
export function LogoUploader({
  label,
  description,
  value,
  onChange,
  rules,
  shape = "wide",
}: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Revoga o objectURL anterior quando o valor muda/desmonta (sem vazamento).
  const previewUrl = value?.kind === "local" ? value.previewUrl : null;
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFile(file: File | undefined) {
    if (!file || isProcessing) return;
    setError(null);
    setIsProcessing(true);
    try {
      const problem = await validateImageFile(file, rules);
      if (problem) {
        setError(problem.message);
        return;
      }
      const optimized = await compressImage(file, rules.maxEdge);
      onChange({
        kind: "local",
        file: optimized,
        previewUrl: URL.createObjectURL(optimized),
      });
    } finally {
      setIsProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files?.[0]);
  }

  const src = value?.kind === "local" ? value.previewUrl : value?.url;

  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-ink">{label}</p>
      <p className="mt-0.5 text-xs text-ink-mute">{description}</p>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0] ?? undefined)}
      />

      <AnimatePresence mode="wait" initial={false}>
        {value ? (
          <m.div
            key="preview"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.2, ease: EASE } }}
            exit={{ opacity: 0, transition: { duration: 0.12, ease: EASE } }}
            className="mt-3"
          >
            <div
              className={cn(
                "flex items-center justify-center overflow-hidden rounded-xl border border-line bg-graphite-50/60 p-3",
                shape === "square" ? "h-32 w-32" : "h-32",
              )}
            >
              <img
                src={src}
                alt={`Pré-visualização: ${label}`}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={isProcessing}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                Trocar imagem
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger-600 hover:bg-danger-50 active:bg-danger-100"
                onClick={() => {
                  setError(null);
                  onChange(null);
                }}
                disabled={isProcessing}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Remover
              </Button>
            </div>
          </m.div>
        ) : (
          <m.button
            key="dropzone"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2, ease: EASE } }}
            exit={{ opacity: 0, transition: { duration: 0.12, ease: EASE } }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            aria-describedby={`${inputId}-help`}
            className={cn(
              "mt-3 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-center",
              "transition-colors duration-200 ease-out-quint",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2",
              shape === "square" ? "h-32 w-32" : "h-32",
              isDragging
                ? "border-gold-400 bg-gold-50"
                : "border-line bg-graphite-50/40 hover:border-gold-300 hover:bg-gold-50/60",
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin text-gold-600" aria-hidden />
            ) : (
              <ImagePlus className="h-5 w-5 text-gold-600" aria-hidden />
            )}
            <span className="text-xs font-medium text-ink-soft">
              {isProcessing ? "Otimizando imagem…" : "Arraste ou clique para enviar"}
            </span>
            <span id={`${inputId}-help`} className="text-[11px] text-ink-mute">
              PNG, JPG, WebP ou SVG · até 2 MB
            </span>
          </m.button>
        )}
      </AnimatePresence>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
