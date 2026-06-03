import {
  BarChart3,
  Bell,
  CalendarClock,
  ClipboardList,
  Coins,
  FileSpreadsheet,
  History,
  Package,
  PackageMinus,
  Receipt,
  ShieldCheck,
  Stethoscope,
  TrendingDown,
  UserCog,
  UserPlus,
  Users,
  Wallet,
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
  procedures: {
    title: "Procedimentos",
    description: "Catálogo de procedimentos, valores e tempo médio de execução.",
    cta: "Novo procedimento",
    features: [
      { icon: Stethoscope, title: "Catálogo de procedimentos", text: "Cadastre os procedimentos oferecidos pela clínica." },
      { icon: Coins, title: "Tabela de valores", text: "Defina preços de referência para orçamentos e cobranças." },
      { icon: ClipboardList, title: "Vínculo com atendimentos", text: "Associe procedimentos às consultas e ao prontuário." },
    ],
  },
  finance: {
    title: "Financeiro",
    description: "Orçamentos, pagamentos e fluxo de caixa da clínica.",
    cta: "Registrar pagamento",
    features: [
      { icon: Receipt, title: "Orçamentos", text: "Monte orçamentos a partir dos procedimentos do paciente." },
      { icon: Wallet, title: "Registrar pagamento", text: "Lance recebimentos e acompanhe pendências em aberto." },
      { icon: TrendingDown, title: "Fluxo de caixa", text: "Visão de entradas e saídas por período." },
    ],
  },
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
