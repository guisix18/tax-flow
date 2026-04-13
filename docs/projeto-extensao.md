# Projeto de Extensão V — Tax Flow

**Curso:** Ciência da Computação — Centro Universitário União das Américas Descomplica
**Etapa:** Construção e Execução Preliminar do Projeto
**Aluno:** Guilherme
**Projeto:** Tax Flow — lembrete e controle de emissão de notas fiscais para PJ/MEI/ME

> Este documento é um **documento vivo**: ele acompanha a evolução do projeto e é atualizado a cada mudança relevante no código (ver §11 Changelog). A estrutura segue o roteiro oficial do Projeto de Extensão V.

---

## 1. Introdução e Justificativa

Profissionais que atuam como Pessoa Jurídica (PJ), Microempreendedor Individual (MEI) ou Microempresa (ME) e que cuidam da própria gestão fiscal — sem contador dedicado ou com apoio apenas ocasional — enfrentam rotineiramente três problemas correlatos:

- **Esquecimento de prazos** para emissão de notas fiscais de serviços já prestados, o que leva a cobranças tardias e atraso no recebimento.
- **Acúmulo de imposto** em meses específicos quando várias notas são emitidas de uma vez, gerando pressão no fluxo de caixa.
- **Ausência de um painel único** que mostre, de forma simples, o que está pendente de emissão e o que já foi feito, obrigando o profissional a improvisar controles em planilhas ou na memória.

A observação desse problema partiu do caso de um amigo PJ do aluno, que serve como beneficiário do piloto deste projeto. Esse contexto é representativo de uma parcela significativa de trabalhadores autônomos brasileiros que se formalizaram como PJ/MEI nos últimos anos.

A proposta **Tax Flow** é uma aplicação web **multi-tenant** (qualquer PJ/MEI/ME pode se cadastrar) que permite:

1. Registrar empresas e ordens de serviço com data de vencimento de emissão da nota.
2. Marcar ordens como "nota emitida" quando concluídas.
3. Receber lembretes por e-mail antes do vencimento.
4. Visualizar, em um painel in-app, as pendências ordenadas por urgência.

A decisão de tornar a aplicação **multi-tenant desde o início** — e não ferramenta interna para um único usuário — amplia o impacto social do projeto, que deixa de ser uma solução individual e passa a ser um produto utilizável pela comunidade de pequenos empreendedores. Essa escolha arquitetural alinha-se diretamente ao princípio de **inclusão digital e alfabetização tecnológica** presente nas diretrizes da extensão universitária em Computação (cf. Bibliografia do roteiro: ASSUNÇÃO & OLIVEIRA, 2016).

## 2. Objetivo Geral

Desenvolver uma aplicação web multi-tenant de lembrete e acompanhamento de emissão de notas fiscais, acessível a profissionais PJ/MEI/ME, validada por meio de um piloto real com um beneficiário da comunidade.

## 3. Objetivos Específicos

- Permitir que qualquer usuário se cadastre e autentique com segurança (e-mail + senha, com senha armazenada como hash).
- Permitir que cada usuário cadastre suas empresas (uma ou mais CNPJs) e as ordens de serviço associadas, com controle de valor, data de vencimento e status.
- Permitir marcar uma ordem como "nota emitida", registrando o fato e reduzindo a lista de pendências.
- Disponibilizar um endpoint/painel de **ordens pendentes** mostrando o que precisa ser emitido em uma janela configurável (ex.: próximos 7 dias).
- Enviar lembretes automáticos por e-mail antes do vencimento (próxima etapa; base de dados já preparada com `notified`, `notification_count`, `last_notification_at`).
- Validar a solução com o piloto (amigo PJ), coletando feedback qualitativo e ajustando a proposta conforme a realidade observada.

## 4. Público-alvo e Comunidade Envolvida

**Público-alvo:** profissionais autônomos formalizados como PJ, MEI ou ME que realizam a própria gestão de emissão de notas fiscais de serviço.

**Comunidade envolvida no piloto:** amigo do aluno, que atua como PJ e é o beneficiário direto da execução preliminar. Sua rotina de trabalho, principais dores e volume de emissões fornecem o parâmetro para calibrar a ferramenta.

> [Caracterização detalhada do beneficiário — perfil profissional, volume mensal de NFs, canais preferidos de lembrete, restrições — a preencher conforme conversa com o piloto.]

## 5. Metodologia e Plano de Ação

### 5.1 Arquitetura do sistema

O backend é implementado em **Node.js + TypeScript** usando **Fastify** como framework HTTP e **Prisma ORM** sobre **PostgreSQL**. A arquitetura segue três camadas bem delimitadas:

1. **Rotas (HTTP)** — validam entrada com **Zod** (esquemas que dobram como documentação OpenAPI via `@fastify/swagger` + Scalar) e delegam para serviços.
2. **Serviços (regra de negócio)** — funções puras que recebem entrada tipada, acessam o banco via Prisma e retornam um tipo `Result<T>` — uma união discriminada entre sucesso e erro de domínio (`DomainError`). Serviços **não lançam exceções** para erros esperados.
3. **Camada de dados** — Prisma Client gerado em `packages/backend/prisma/generated/`, conectado ao Postgres via adapter `@prisma/adapter-pg`.

Um único ponto de ponte (`sendResult`) traduz `Result<T>` em respostas Fastify, e um mapeamento exaustivo (`domainErrorToHttp`) garante que cada tipo de erro tem um status HTTP definido em compile-time.

### 5.2 Multi-tenancy

A aplicação é multi-tenant por design:

- Existe um modelo `User` (nome, e-mail único, hash de senha).
- Cada `Company` pertence a exatamente um `User` (via `user_id` obrigatório).
- `ServiceOrder` não tem `user_id` direto: o isolamento vem pela relação `serviceOrder → company → user`, garantindo uma única fonte de verdade.
- Todas as rotas de dados são autenticadas via **JWT** (`@fastify/jwt`); um plugin `auth` popula `request.user` com o `userId` do token, e todas as queries filtram por esse `userId`.
- Senhas são armazenadas como hash `bcrypt`.

### 5.3 Canais de lembrete

Dois canais estão previstos:

- **E-mail** — para lembretes ativos próximo ao vencimento. A base de dados já possui os campos `notified`, `notification_count`, `last_notification_at` no modelo `ServiceOrder` para suportar múltiplas notificações por ordem.
- **In-app** — painel web/mobile (pacote `@tax-flow/mobile` a ser criado) listando as ordens pendentes. A primeira versão desse painel é servida pelo endpoint `GET /service-orders/upcoming`.

### 5.4 Plano de ação por etapas

| # | Etapa | Status |
|---|-------|--------|
| 1 | Modelagem inicial (`Company`, `ServiceOrder`, enum `ServiceStatus`) | Concluída |
| 2 | CRUD básico: criar/listar empresas, criar/listar/obter/atualizar ordens | Concluída |
| 3 | Marcação de nota emitida (`PATCH /service-orders/:id/mark-issued`) | Concluída |
| 4 | **Multi-tenancy**: modelo `User`, auth JWT, escopo de todas as rotas existentes | Em andamento |
| 5 | **Listagem de pendentes** (`GET /service-orders/upcoming?days=N`) | Concluída |
| 6 | Envio real de e-mail (nodemailer + SMTP) e endpoint de disparo manual | Concluída |
| 7 | Job agendado varrendo ordens próximas do vencimento e disparando e-mail | Planejada |
| 8 | Frontend (pacote `@tax-flow/mobile`) consumindo os endpoints autenticados | Planejada |
| 9 | Cadastro real do piloto e coleta de feedback | Planejada |
| 10 | Ajustes pós-piloto e documentação final | Planejada |

## 6. Recursos Necessários

### Recursos técnicos (software)

- **Node.js** ≥ 20 e **TypeScript** 5.x
- **Fastify** 5 (+ `@fastify/cors`, `@fastify/swagger`, `@fastify/jwt`)
- **Prisma** 7 + adapter Postgres (`@prisma/adapter-pg`)
- **PostgreSQL** (via Docker Compose em ambiente de dev)
- **Zod** para validação + `fastify-type-provider-zod` para integrar com OpenAPI
- **Scalar API Reference** para documentação interativa em `/docs`
- **bcrypt** para hash de senha
- **cpf-cnpj-validator** para validar CNPJ
- **Vitest** para testes unitários
- **Turbo** para orquestração do monorepo

### Recursos de infraestrutura

- Conta em provedor SMTP (ex.: Gmail com App Password, Mailtrap em desenvolvimento, SendGrid/Resend em produção) — a definir na etapa 6.
- Provedor de hospedagem para o backend (ex.: Railway, Render, Fly.io) — a definir.

### Variáveis de ambiente

- `DATABASE_URL` — string de conexão Postgres.
- `JWT_SECRET` — segredo para assinar tokens JWT. Gerar com `openssl rand -hex 32`.
- `SMTP_USER` — e-mail Gmail (ex.: `conta@gmail.com`). Também é usado como `from` do envio.
- `SMTP_PASS` — App Password do Gmail (16 caracteres; gerada em https://myaccount.google.com/apppasswords).

> O host/porta estão fixos no código (`smtp.gmail.com:587`, STARTTLS). Para trocar de provedor no futuro, alterar `packages/backend/src/lib/mailer.ts`.

### Recursos humanos

- Aluno-desenvolvedor (Guilherme).
- Beneficiário do piloto (amigo PJ).

## 7. Cronograma de Execução

> [Datas específicas a preencher conforme calendário da disciplina e disponibilidade do piloto.]

| Etapa | Atividade | Responsável | Prazo |
|-------|-----------|-------------|-------|
| 1–3 | Modelagem e CRUD básico | Aluno | Concluído |
| 4 | Multi-tenancy + auth | Aluno | Abril/2026 |
| 5 | Listagem de pendentes | Aluno | Abril/2026 |
| 6 | E-mail + disparo manual | Aluno | [a definir] |
| 7 | Job agendado de lembretes | Aluno | [a definir] |
| 8 | Frontend mínimo | Aluno | [a definir] |
| 9 | Cadastro e uso pelo piloto | Aluno + piloto | [a definir] |
| 10 | Coleta de feedback + ajustes | Aluno + piloto | [a definir] |

## 8. Indicadores e Avaliação

### Indicadores quantitativos

- Número de usuários cadastrados no sistema (meta mínima: 1 — o piloto).
- Número de ordens de serviço cadastradas pelo piloto durante o período de validação.
- Proporção de ordens marcadas como emitidas **antes** do vencimento sobre o total de ordens com vencimento no período.
- Número de e-mails de lembrete enviados com sucesso (após etapa 6).

### Indicadores qualitativos

- Feedback do piloto sobre clareza da interface e utilidade dos lembretes.
- Percepção do piloto sobre redução de esquecimentos e melhoria do controle financeiro.
- Sugestões de melhoria coletadas durante o uso real.

### Forma de avaliação

- Durante a execução: reuniões curtas com o piloto após cada nova feature entregue.
- Ao final: entrevista semiestruturada com o piloto registrada em depoimento textual, mais análise dos indicadores quantitativos extraídos do banco.

## 9. Execução Preliminar (Piloto)

O piloto é o amigo PJ do aluno. A execução preliminar segue estas etapas:

1. **Validação do plano** — apresentação da proposta ao piloto, confirmação das necessidades e canais preferidos.
2. **Cadastro real** — o piloto cria sua conta no sistema, cadastra sua empresa (CNPJ real) e registra as ordens de serviço dos próximos meses.
3. **Uso contínuo** — o piloto passa a usar o painel in-app como referência única de pendências e marca cada nota como emitida.
4. **Recebimento de lembretes** — assim que a etapa 6 entrar em produção, os lembretes por e-mail são ativados para a conta do piloto.
5. **Coleta de feedback** — ao final de um ciclo de uso (mínimo 30 dias sugeridos), entrevista com o piloto para registrar aprendizados.

> [Esta seção será expandida com evidências — prints, depoimentos, métricas — conforme o piloto avançar.]

## 10. Documentação e Reflexão sobre o Processo

Esta seção é atualizada ao final de cada iteração relevante. Registra:

- O que foi executado de forma preliminar.
- Resultados ou aprendizados obtidos com a aplicação prática.
- Aspectos da proposta que precisaram ser ajustados após o piloto.
- Como essas mudanças fortalecem a viabilidade da execução futura.

> [A preencher a partir da primeira validação com o piloto.]

---

## 11. Changelog do código

Registro, em ordem cronológica reversa, das alterações de código relevantes para a entrega acadêmica. Cada entrada explica **o quê**, **onde** e **por quê**.

### 2026-04-13 — CI no GitHub Actions + envio de lembrete por e-mail

**O quê:**
- Workflow de CI em `.github/workflows/ci.yml` que roda `typecheck` (`tsc --noEmit`) e `vitest` em cada push para `main` e PRs para `main`, usando Node 24 LTS.
- Feature de envio de lembrete de emissão de nota fiscal por **e-mail SMTP**, via `nodemailer`. Destinatário: e-mail do `User` dono da ordem.
- Endpoint manual `POST /service-orders/:id/send-reminder` (autenticado, escopo multi-tenant), que envia o e-mail e atualiza os campos `notified`, `notification_count` e `last_notification_at` do `ServiceOrder`.
- Regras de negócio: 404 se a ordem não pertence ao usuário; 409 se a nota já foi emitida (`SERVICE_ORDER_ALREADY_ISSUED_ERROR` agora em uso).
- 4 novos testes unitários com `nodemailer` mockado cobrindo os caminhos felizes e de erro.

**Arquivos afetados (criados):**
- `.github/workflows/ci.yml`
- `packages/backend/src/lib/mailer.ts` — abstração SMTP (singleton de `Transporter`). Host/porta hardcoded para Gmail (`smtp.gmail.com:587`, STARTTLS); só `SMTP_USER` e `SMTP_PASS` vêm do `.env`.
- `packages/backend/src/services/serviceOrder/sendServiceOrderReminder.ts`
- `packages/backend/src/__tests__/services/serviceOrder/sendServiceOrderReminder.test.ts`

**Arquivos afetados (modificados):**
- `packages/backend/package.json` — novas deps `nodemailer` e `@types/nodemailer`.
- `packages/backend/src/routes/serviceOrder/serviceOrder.routes.ts` — nova rota `POST /:id/send-reminder`.
- `.gitignore` — ignora `.turbo/` e `.vscode/`.

**Motivação:** o sistema só entrega valor real quando o usuário recebe o lembrete no canal que ele usa (e-mail). Com o endpoint manual, o amigo PJ pode validar o fluxo completo desde já, e a próxima etapa (job agendado que dispara automaticamente próximo ao vencimento) reaproveita toda essa infraestrutura. O CI, por sua vez, protege `main` de regressões agora que o projeto já tem várias camadas (multi-tenancy, auth, e-mail) — qualquer PR futuro roda os 26 testes antes do merge.

**Variáveis de ambiente novas:** `SMTP_USER` e `SMTP_PASS` (host/porta fixos para Gmail no código). Para gerar a senha, é necessário ter 2FA ativo na conta Google e criar uma **App Password** em https://myaccount.google.com/apppasswords.

### 2026-04-13 — Multi-tenancy (auth JWT) + listagem de ordens pendentes

**O quê:** introdução da camada multi-tenant (modelo `User`, autenticação JWT, escopo por `user_id` em todas as rotas de dados existentes) e primeiro endpoint público-dependente de tenant: `GET /service-orders/upcoming`.

**Arquivos afetados (criados):**
- `packages/backend/src/plugins/auth.ts` — plugin Fastify que registra `@fastify/jwt` e expõe `app.authenticate`.
- `packages/backend/src/routes/auth/auth.routes.ts` + `schemas.ts` — rotas `POST /auth/register` e `POST /auth/login`.
- `packages/backend/src/services/auth/registerUser.ts` + `loginUser.ts` — lógica de criação de usuário e autenticação, padrão `Result<T>`.
- `packages/backend/src/services/serviceOrder/getUpcomingServiceOrders.ts` — lista ordens não-emitidas com vencimento dentro de `daysAhead` dias, escopadas por `userId`.
- `packages/backend/src/types/fastify.d.ts` — augmentation do Fastify para tipar `request.user`.
- `packages/backend/prisma/migrations/<timestamp>_add_user_and_tenant_scope/` — migration Postgres.
- Testes novos em `src/__tests__/services/auth/` e `src/__tests__/services/serviceOrder/getUpcomingServiceOrders.test.ts`.

**Arquivos afetados (modificados):**
- `packages/backend/prisma/schema.prisma` — modelo `User` + `user_id` em `Company`.
- `packages/backend/package.json` — novas dependências `@fastify/jwt`, `bcrypt`, `@types/bcrypt`.
- `packages/backend/src/server.ts` — registra plugin de auth, rotas de auth, e envolve rotas de domínio em preHandler autenticado.
- `packages/backend/src/errors/domains.errors.ts` + `domainErrorToHttp.ts` — novos erros `INVALID_CREDENTIALS_ERROR` (401) e `USER_ALREADY_EXISTS_ERROR` (409).
- Todos os serviços de `company/` e `serviceOrder/` — aceitam `userId` e filtram/setam por ele.
- Rotas de `company/` e `serviceOrder/` — propagam `request.user.sub` para os serviços.
- Testes existentes ajustados para refletir a nova assinatura.

**Motivação:** a decisão do usuário de tornar o produto **multi-tenant desde o início** impõe que qualquer endpoint de listagem respeite o isolamento por usuário — um `GET /service-orders/upcoming` sem essa fundação vazaria dados entre contas. Implementar auth + escopo *junto* com a listagem evita retrabalho futuro.

**Impacto no projeto extensionista:** habilita o cadastro real do piloto (com conta própria) e o painel de pendências que é o núcleo do valor percebido pelo beneficiário. Abre caminho para as próximas etapas (envio de e-mail e frontend) sem bloqueios arquiteturais.

**Validação fim-a-fim executada:** registro de dois usuários A e B; criação de empresa e três ordens (vencimentos +3d, +5d, +45d) na conta de A; `GET /service-orders/upcoming?days=7` retornou as 2 ordens próximas, `?days=60` retornou todas; `PATCH /:id/mark-issued` removeu a ordem da listagem corretamente; B sem dados próprios viu listas vazias e foi bloqueado (404) ao tentar acessar/marcar dados de A. Isolamento multi-tenant confirmado.

### 2026-04-13 — Fix: aceitar `due_date` como string ISO no body

**O quê:** trocar `z.date()` por `z.coerce.date()` em `createServiceOrderSchema` e `updateServiceOrderSchema`.
**Onde:** `packages/backend/src/routes/serviceOrder/schemas.ts`.
**Motivação:** JSON não tem tipo `Date` nativo — datas chegam como string ISO. Sem `coerce`, o `POST /service-orders` retornava `Validation error / expected date, received string`, impedindo qualquer criação de ordem via HTTP. Detectado durante o teste end-to-end da feature anterior.

### 2026-02-25 — Índice composto para consultas de pendências

**O quê:** adição de índice composto `(note_issued, due_date)` em `ServiceOrder`.
**Onde:** `packages/backend/prisma/migrations/20260225032743_adding_index_in_service_order_company_note_issued_and_due_date/`.
**Motivação:** antecipar a performance de consultas do tipo "ordens não emitidas com vencimento próximo" — padrão de acesso dominante do painel de pendências.

### 2026-02-11 — Enum `ServiceStatus`

**O quê:** introdução do enum `ServiceStatus { PENDING, IN_PROGRESS, COMPLETED, CANCELLED }` em `ServiceOrder`.
**Onde:** `packages/backend/prisma/migrations/20260211005116_adding_enum_service_status/`.
**Motivação:** padronizar o status da ordem e viabilizar filtros consistentes no painel.

### 2026-02-07 — Modelagem inicial

**O quê:** criação dos modelos `Company` e `ServiceOrder`, CRUD básico, rota `PATCH /service-orders/:id/mark-issued`.
**Onde:** `packages/backend/prisma/migrations/20260207223229_tax_flow_v1/` e `packages/backend/src/`.
**Motivação:** fundação do projeto.

---

## Referências

Baseado nas diretrizes do **Projeto de Extensão V — Cursos de Ciência da Computação** do Centro Universitário União das Américas Descomplica. Bibliografia sugerida pelo roteiro:

- ASSUNÇÃO, R. M., & OLIVEIRA, J. P. (2016). *Inclusão digital e alfabetização tecnológica: um estudo de caso.* Salvador: EDUFBA.
- PRESSMAN, R. S. (2019). *Engenharia de software: uma abordagem profissional.* 8. ed. Porto Alegre: AMGH.
- SOMMERVILLE, I. (2011). *Engenharia de Software.* 9. ed. São Paulo: Pearson.
