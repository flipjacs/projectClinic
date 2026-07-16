# Settings services

Camada de acesso a APIs do módulo de Configurações. A UI nunca chama Axios
diretamente — componentes usam hooks (`../hooks/`), hooks usam estes services.

## Arquivos

- `settings-api.ts` — contrato da API da Clínica (`GET/PUT /settings/clinic`,
  `POST/DELETE /settings/clinic/logo`), DTO em snake_case + mappers para o
  shape do formulário. **O backend ainda não implementa estes endpoints**: o
  GET trata 404 como "nada salvo" (a tela abre com os padrões) e o PUT/upload
  falham com mensagem amigável até o backend chegar. Quando os endpoints
  existirem, nada acima desta camada muda.
- `cep-api.ts` — consulta de CEP (ViaCEP direto do navegador). Quando houver
  um proxy no backend, troca-se apenas a implementação de `lookupCep`.

## Regras da casa

- URL base sempre via `@/lib/api` (nunca hardcoded).
- Nenhum segredo ou token manipulado aqui — papel do interceptor de auth.
- O backend DEVE revalidar tudo (dados e uploads); a validação do frontend é
  experiência, não segurança.
