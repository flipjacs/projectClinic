/**
 * Identificação amigável da sessão atual a partir do próprio navegador —
 * dado local e verdadeiro (nunca inventado). IP e sessões remotas só
 * aparecem quando o backend os fornecer.
 */

export interface CurrentSessionInfo {
  browser: string;
  os: string;
}

export function describeCurrentSession(userAgent: string): CurrentSessionInfo {
  const ua = userAgent.toLowerCase();

  let browser = "Navegador desconhecido";
  if (ua.includes("edg/")) browser = "Microsoft Edge";
  else if (ua.includes("opr/") || ua.includes("opera")) browser = "Opera";
  else if (ua.includes("chrome/")) browser = "Google Chrome";
  else if (ua.includes("firefox/")) browser = "Firefox";
  else if (ua.includes("safari/")) browser = "Safari";

  let os = "Sistema desconhecido";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("mac os")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";

  return { browser, os };
}
