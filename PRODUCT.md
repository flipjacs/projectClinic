# Product

## Register

product

## Users

Equipe de uma clínica odontológica brasileira: administradores, dentistas e
recepcionistas. Pouca familiaridade com sistemas técnicos; usam o produto o dia
inteiro em desktop (recepção/consultório) e ocasionalmente em tablet/celular.
O trabalho é de fluxo contínuo: agendar, atender, cobrar, repor estoque.

## Product Purpose

OdontoPrime é o sistema de gestão da clínica: pacientes, agenda, prontuários,
procedimentos, financeiro, estoque, relatórios e administração (usuários,
configurações). Sucesso = a recepção e o consultório operarem sem fricção e o
administrador confiar nos números e controles.

## Brand Personality

Premium, calmo, confiável. A interface transmite competência silenciosa: nada
grita, tudo responde. Referências: Linear (foco e densidade certa), Stripe
Dashboard (confiança em áreas administrativas), Apple Settings (categorias
navegáveis e óbvias), Notion (calma visual).

## Anti-references

- Painel admin genérico (Bootstrap/AdminLTE): tabelas cinzas, forms crus.
- Material UI default: componentes reconhecíveis de kit, ripple, elevações duras.
- Dashboards "SaaS template": gradientes decorativos, hero-metrics, glassmorphism.
- Qualquer tela que exija manual para entender o que cada opção faz.

## Design Principles

1. **Óbvio antes de bonito.** Recepcionista entende a tela sem treinamento;
   hierarquia e rótulos fazem o trabalho, não tooltips.
2. **Confiança em áreas sensíveis.** Ações perigosas são visualmente distintas,
   reversibilidade é explícita, confirmação sempre precede destruição.
3. **Consistência sobre surpresa.** Mesmo vocabulário de componentes em todas as
   telas; o dourado marca ação/estado, nunca decoração.
4. **Nada parece inacabado.** Módulos futuros mostram concretamente o que farão,
   com a mesma linguagem visual do produto real.
5. **Motion comunica estado.** Entradas curtas (≤280ms, out-quint), hover com
   lift discreto; nada teatral, `prefers-reduced-motion` respeitado globalmente.

## Accessibility & Inclusion

- Alvo WCAG AA: contraste ≥4.5:1 em texto corrido (gold-500 é o mínimo sobre branco).
- Navegação completa por teclado com focus-visible dourado em tudo que é interativo.
- Significado nunca depende só de cor (badges sempre com rótulo textual).
- `prefers-reduced-motion` respeitado via MotionConfig global e fallbacks CSS.
- Idioma da interface: português brasileiro.
