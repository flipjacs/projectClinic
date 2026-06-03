/**
 * Catálogo padrão de procedimentos da clínica. Usado pela ação "Adicionar
 * catálogo padrão" na página de Procedimentos, que cria os que ainda não
 * existem (sem preço definido — a clínica ajusta os valores depois).
 *
 * A lista é deduplicada: nomes repetidos foram unificados.
 */
export const DEFAULT_PROCEDURES: string[] = [
  // Cirurgia / exodontia
  "Exodontia de dente permanente",
  "Exodontia de dente decíduo",
  "Exodontia de terceiro molar",
  "Exodontia de resto radicular",
  // Dentística / restaurações
  "Restauração em resina composta",
  "Restauração em resina composta 2 faces",
  "Restauração em resina composta (cervical)",
  // Endodontia
  "Acesso + medicação e curativo",
  "Tratamento endodôntico unirradicular",
  "Tratamento endodôntico birradicular",
  "Tratamento endodôntico",
  // Prótese / implante
  "Prótese total",
  "Prótese parcial removível",
  "Provisório",
  "PSI - prótese sobre implante",
  "Implante",
  // Periodontia / preventivo
  "Raspagem + profilaxia",
  "Raspagem",
  "Profilaxia",
  "Aplicação tópica de flúor",
  "Manutenção",
  // Clareamento
  "Clareamento de consultório",
  "Clareamento caseiro",
  "Clareamento combinado",
];
