import {
  BellRing,
  Building2,
  DatabaseBackup,
  MonitorCog,
  Palette,
  Plug,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import type { SettingsCategory } from "./types/settings";

/**
 * Registro central das categorias de Configurações. A ordem aqui é a ordem dos
 * cards no hub. Adicionar uma categoria nova = adicionar uma entrada aqui + a
 * página correspondente em `pages/` + a rota no router.
 */
export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    key: "clinic",
    label: "Clínica",
    description: "Identidade, endereço, contato e horários de atendimento.",
    path: "/settings/clinic",
    icon: Building2,
    // "attention" até os dados da clínica serem preenchidos e persistidos.
    status: "attention",
    count: 26,
    keywords: ["logo", "endereco", "telefone", "horario", "fuso", "cnpj", "dados"],
  },
  {
    key: "users",
    label: "Usuários e permissões",
    description: "Equipe, perfis de acesso e o que cada um pode fazer.",
    path: "/settings/users",
    icon: UsersRound,
    status: "configured",
    count: 4,
    keywords: ["equipe", "perfil", "acesso", "papel", "dentista", "recepcao", "admin"],
  },
  {
    key: "security",
    label: "Segurança",
    description: "Senhas, sessões, autenticação em duas etapas e auditoria.",
    path: "/settings/security",
    icon: ShieldCheck,
    status: "soon",
    count: 5,
    keywords: ["senha", "sessao", "2fa", "auditoria", "privacidade", "lgpd"],
  },
  {
    key: "notifications",
    label: "Notificações",
    description: "Lembretes de consulta, cobranças e alertas de estoque.",
    path: "/settings/notifications",
    icon: BellRing,
    status: "soon",
    count: 5,
    keywords: ["email", "sms", "lembrete", "alerta", "aviso", "cobranca"],
  },
  {
    key: "integrations",
    label: "Integrações",
    description: "Google Agenda, WhatsApp, e-mail e conexões externas.",
    path: "/settings/integrations",
    icon: Plug,
    status: "soon",
    count: 4,
    keywords: ["google", "calendar", "agenda", "whatsapp", "api", "webhook"],
  },
  {
    key: "appearance",
    label: "Aparência",
    description: "Tema, densidade da interface, idioma e acessibilidade.",
    path: "/settings/appearance",
    icon: Palette,
    status: "soon",
    count: 5,
    keywords: ["tema", "cor", "densidade", "idioma", "escuro", "acessibilidade"],
  },
  {
    key: "backup",
    label: "Backup",
    description: "Cópias de segurança, restauração e exportação de dados.",
    path: "/settings/backup",
    icon: DatabaseBackup,
    status: "attention",
    count: 4,
    keywords: ["copia", "restaurar", "exportar", "banco", "dados", "seguranca"],
  },
  {
    key: "system",
    label: "Sistema",
    description: "Versão, ambiente, status da API e saúde do sistema.",
    path: "/settings/system",
    icon: MonitorCog,
    status: "configured",
    count: 6,
    keywords: ["versao", "ambiente", "log", "atualizacao", "api", "saude", "status"],
  },
];
