/**
 * Validação e compressão de imagens do LogoUploader — tudo no navegador,
 * antes do upload. (Lembrete: o backend DEVE revalidar tipo/tamanho; a
 * validação aqui é experiência, não segurança.)
 */

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

export interface ImageValidationRules {
  /** Menor lado mínimo, em px (não se aplica a SVG, que é vetorial). */
  minEdge: number;
  /** Maior lado usado na compressão — acima disso a imagem é reduzida. */
  maxEdge: number;
}

export type ImageValidationError =
  | { code: "type"; message: string }
  | { code: "size"; message: string }
  | { code: "resolution"; message: string }
  | { code: "unreadable"; message: string };

function isAcceptedType(type: string): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

/** Carrega dimensões reais do arquivo (via objectURL, revogado ao final). */
function readDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable"));
    };
    img.src = url;
  });
}

/**
 * Valida tipo, tamanho e resolução mínima. Retorna `null` quando o arquivo é
 * aceitável; caso contrário, um erro com mensagem pronta para o usuário.
 */
export async function validateImageFile(
  file: File,
  rules: ImageValidationRules,
): Promise<ImageValidationError | null> {
  if (!isAcceptedType(file.type)) {
    return { code: "type", message: "Use uma imagem PNG, JPG, WebP ou SVG." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { code: "size", message: "A imagem deve ter no máximo 2 MB." };
  }
  if (file.type === "image/svg+xml") return null; // vetorial: sem resolução

  try {
    const { width, height } = await readDimensions(file);
    if (Math.min(width, height) < rules.minEdge) {
      return {
        code: "resolution",
        message: `Resolução mínima: ${rules.minEdge}px no menor lado.`,
      };
    }
  } catch {
    return { code: "unreadable", message: "Não foi possível ler esta imagem." };
  }
  return null;
}

/**
 * Reduz imagens raster grandes antes do upload (canvas → WebP). SVGs e
 * imagens já pequenas passam intactos. Se o navegador falhar na conversão,
 * devolve o arquivo original — comprimir é otimização, nunca bloqueio.
 */
export async function compressImage(file: File, maxEdge: number): Promise<File> {
  if (file.type === "image/svg+xml") return file;

  try {
    const { width, height } = await readDimensions(file);
    if (Math.max(width, height) <= maxEdge) return file;

    const scale = maxEdge / Math.max(width, height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("unreadable"));
        el.src = url;
      });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } finally {
      URL.revokeObjectURL(url);
    }

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  }
}
