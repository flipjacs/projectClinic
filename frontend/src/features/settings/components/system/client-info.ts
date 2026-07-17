import { version as reactVersion } from "react";

import { describeCurrentSession } from "../security/session-info";

/**
 * Informações técnicas coletadas do próprio ambiente de execução — todas
 * reais (React, navegador, SO, fuso, idioma). Ajudam o suporte a reproduzir
 * problemas sem pedir nada ao usuário.
 */
export interface ClientTechInfo {
  reactVersion: string;
  browser: string;
  os: string;
  timezone: string;
  locale: string;
}

export function collectClientInfo(): ClientTechInfo {
  const session = describeCurrentSession(navigator.userAgent);
  return {
    reactVersion,
    browser: session.browser,
    os: session.os,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language,
  };
}
