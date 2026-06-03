import {
  BarChart3,
  Bell,
  CalendarClock,
  FileSpreadsheet,
  History,
  Package,
  PackageMinus,
  ShieldCheck,
  TrendingDown,
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Uma funcionalidade planejada exibida no card do módulo. */
export interface ModuleFeature {
  icon: LucideIcon;
  title: string;
  text: string;
}

/** Configuração de uma tela de módulo que ainda será construída. */
export interface ModuleConfig {
  title: string;
  description: string;
  /** Rótulo da ação principal (desabilitada por enquanto). */
  cta: string;
  features: ModuleFeature[];
}

/**
 * Mapa de módulos ainda não implementados. Cada um descreve, de forma concreta,
 * o que aquela área fará — para que a tela pareça parte do produto real, e não
 * um "em construção" genérico.
 */
export const MODULE_PLACEHOLDERS: Record<string, ModuleConfig> = {
  inventory: {
    title: "Estoque",
    description: "Controle de materiais, entradas, saídas e validade.",
    cta: "Movimentar estoque",
    features: [
      { icon: Package, title: "Itens e níveis", text: "Cadastre materiais e defina o estoque mínimo de cada um." },
      { icon: PackageMinus, title: "Movimentar estoque", text: "Registre entradas e saídas de forma rastreável." },
      { icon: Bell, title: "Alertas de validade", text: "Avisos de estoque baixo e itens próximos do vencimento." },
    ],
  },
  reports: {
    title: "Relatórios",
    description: "Indicadores e relatórios gerenciais da clínica.",
    cta: "Gerar relatório",
    features: [
      { icon: BarChart3, title: "Atendimentos", text: "Volume de consultas, conclusões, faltas e cancelamentos." },
      { icon: TrendingDown, title: "Financeiro", text: "Faturamento, recebimentos e inadimplência por período." },
      { icon: FileSpreadsheet, title: "Exportação", text: "Baixe relatórios para análises externas." },
    ],
  },
  users: {
    title: "Usuários",
    description: "Equipe, perfis de acesso e permissões do sistema.",
    cta: "Novo usuário",
    features: [
      { icon: UserPlus, title: "Cadastrar equipe", text: "Adicione dentistas, recepção e administradores." },
      { icon: UserCog, title: "Perfis e permissões", text: "Defina o que cada perfil pode ver e fazer." },
      { icon: History, title: "Trilha de auditoria", text: "Acompanhe ações sensíveis registradas pelo sistema." },
    ],
  },
  settings: {
    title: "Configurações",
    description: "Preferências e dados gerais da clínica.",
    cta: "Editar configurações",
    features: [
      { icon: Users, title: "Dados da clínica", text: "Nome, endereço e informações de contato." },
      { icon: CalendarClock, title: "Horários de atendimento", text: "Configure a grade de funcionamento e os profissionais." },
      { icon: ShieldCheck, title: "Segurança", text: "Políticas de acesso e parâmetros do sistema." },
    ],
  },
};
