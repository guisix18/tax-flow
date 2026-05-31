---
instituicao: Centro Universitário União das Américas Descomplica
curso: Ciência da Computação
disciplina: Projeto de Extensão V
titulo: "Tax Flow — lembrete e controle de emissão de notas fiscais para PJ/MEI/ME"
aluno: Guilherme Silva
semestre: 2026/1
---

# Tax Flow
## Lembrete e controle de emissão de notas fiscais para PJ/MEI/ME

**Instituição:** Centro Universitário União das Américas Descomplica
**Curso:** Ciência da Computação
**Disciplina:** Projeto de Extensão V
**Aluno:** Guilherme Silva
**Semestre:** 2026/1

> Este documento é um **documento vivo**: ele acompanha a evolução do projeto e é atualizado a cada mudança relevante no código (ver §15 Changelog). A estrutura segue o roteiro oficial do Projeto de Extensão V.

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

A decisão de tornar a aplicação **multi-tenant desde o início** — e não ferramenta interna para um único usuário — amplia o impacto social do projeto, que deixa de ser uma solução individual e passa a ser um produto utilizável pela comunidade de pequenos empreendedores. Essa escolha arquitetural alinha-se diretamente ao princípio de **inclusão digital e alfabetização tecnológica** presente nas diretrizes da extensão universitária em Computação (cf. ASSUNÇÃO & OLIVEIRA, 2016).

## 2. Objetivo Geral

Desenvolver uma aplicação web multi-tenant de lembrete e acompanhamento de emissão de notas fiscais, acessível a profissionais PJ/MEI/ME, validada por meio de um piloto real com um beneficiário da comunidade.

## 3. Objetivos Específicos

- Permitir que qualquer usuário se cadastre e autentique com segurança (e-mail + senha, com senha armazenada como hash).
- Permitir que cada usuário cadastre suas empresas (uma ou mais CNPJs) e as ordens de serviço associadas, com controle de valor, data de vencimento e status.
- Permitir marcar uma ordem como "nota emitida", registrando o fato e reduzindo a lista de pendências.
- Disponibilizar um endpoint/painel de **ordens pendentes** mostrando o que precisa ser emitido em uma janela configurável (ex.: próximos 7 dias).
- Enviar lembretes automáticos por e-mail antes do vencimento, com base nos campos `notified`, `notification_count` e `last_notification_at` já presentes no banco de dados.
- Validar a solução com o piloto (amigo PJ), coletando feedback qualitativo e ajustando a proposta conforme a realidade observada.

## 4. Público-alvo e Comunidade Envolvida

**Público-alvo:** profissionais autônomos formalizados como PJ, MEI ou ME que realizam a própria gestão de emissão de notas fiscais de serviço, em especial aqueles que não contam com suporte contábil contínuo.

**Comunidade envolvida no piloto:** amigo do aluno, que atua como PJ prestador de serviços de tecnologia. Sua rotina envolve emissão regular de notas fiscais para múltiplos clientes, com datas de vencimento distintas a cada mês. A ausência de uma ferramenta centralizada faz com que ele controle esses prazos informalmente, sujeito a esquecimentos. Ele é o beneficiário direto da execução preliminar e sua experiência de uso fornecerá os parâmetros para calibrar e ajustar a ferramenta.

> [Caracterização quantitativa a completar após a primeira conversa de validação com o piloto: volume mensal de notas, número de empresas cadastradas, canal preferido de lembrete (e-mail, notificação push ou ambos).]

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

- **E-mail** — para lembretes ativos próximo ao vencimento. O envio é feito via **Resend API** (serviço de e-mail transacional), que utiliza HTTPS em vez de SMTP direto — evitando restrições de portas impostas por provedores de nuvem. A base de dados já possui os campos `notified`, `notification_count`, `last_notification_at` no modelo `ServiceOrder` para suportar múltiplas notificações por ordem.
- **In-app** — painel web (pacote de frontend a ser criado) listando as ordens pendentes. A primeira versão desse painel é servida pelo endpoint `GET /service-orders/upcoming`.

### 5.4 Plano de ação por etapas

| # | Etapa | Status |
|---|-------|--------|
| 1 | Modelagem inicial (`Company`, `ServiceOrder`, enum `ServiceStatus`) | Concluída |
| 2 | CRUD básico: criar/listar empresas, criar/listar/obter/atualizar ordens | Concluída |
| 3 | Marcação de nota emitida (`PATCH /service-orders/:id/mark-issued`) | Concluída |
| 4 | **Multi-tenancy**: modelo `User`, auth JWT, escopo de todas as rotas existentes | Concluída |
| 5 | **Listagem de pendentes** (`GET /service-orders/upcoming?days=N`) | Concluída |
| 6 | Envio real de e-mail (Resend API) e endpoint de disparo manual | Concluída |
| 7 | Job agendado varrendo ordens próximas do vencimento e disparando e-mail | Concluída |
| 8 | Frontend mínimo funcional consumindo os endpoints autenticados | Concluída |
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
- **Mailjet API** para envio de e-mail transacional via HTTPS (sem SDK — chamada REST nativa)
- **Vitest** para testes unitários
- **Turbo** para orquestração do monorepo

### Recursos de infraestrutura

- Conta no **Mailjet** (mailjet.com) para envio de e-mail transacional — plano gratuito cobre 200 e-mails/dia e 6.000/mês, suficiente para o piloto. Não exige domínio próprio nem endereço de empresa.
- Provedor de hospedagem para o backend: **Render** (plano gratuito em uso durante o piloto).

### Variáveis de ambiente

- `DATABASE_URL` — string de conexão Postgres.
- `JWT_SECRET` — segredo para assinar tokens JWT.
- `MAILJET_API_KEY` e `MAILJET_SECRET_KEY` — credenciais da API Mailjet.
- `MAILJET_FROM_EMAIL` — endereço remetente validado no painel Mailjet (ex.: email do desenvolvedor).
- `MAILJET_FROM_NAME` — nome exibido como remetente (ex.: `Tax Flow`).

### Recursos humanos

- Aluno-desenvolvedor (Guilherme Silva).
- Beneficiário do piloto (amigo PJ).

## 7. Cronograma de Execução

| Etapa | Atividade | Responsável | Prazo |
|-------|-----------|-------------|-------|
| 1–3 | Modelagem e CRUD básico | Aluno | Concluído em 07/02/2026 |
| 4 | Multi-tenancy + auth JWT | Aluno | Concluído em 13/04/2026 |
| 5 | Listagem de pendentes | Aluno | Concluído em 13/04/2026 |
| 6 | E-mail + disparo manual | Aluno | Concluído em 13/04/2026 |
| 7 | Job agendado de lembretes | Aluno | Concluído em 21/05/2026 |
| 8 | Frontend mínimo funcional | Aluno | Concluído em 21/05/2026 |
| 9 | Cadastro e uso contínuo pelo piloto | Aluno + piloto | Jul/2026 |
| 10 | Coleta de feedback + ajustes finais | Aluno + piloto | Jul–Ago/2026 |

## 8. Indicadores e Avaliação

### Indicadores quantitativos

- Número de usuários cadastrados no sistema (meta mínima: 1 — o piloto).
- Número de ordens de serviço cadastradas pelo piloto durante o período de validação.
- Proporção de ordens marcadas como emitidas **antes** do vencimento sobre o total de ordens com vencimento no período.
- Número de e-mails de lembrete enviados com sucesso.

### Indicadores qualitativos

- Feedback do piloto sobre clareza da interface e utilidade dos lembretes.
- Percepção do piloto sobre redução de esquecimentos e melhoria do controle financeiro.
- Sugestões de melhoria coletadas durante o uso real.

### Forma de avaliação

- Durante a execução: contato periódico com o piloto após cada nova feature entregue.
- Ao final: entrevista semiestruturada com o piloto registrada em depoimento textual, mais análise dos indicadores quantitativos extraídos do banco.

---

## 9. Descrição das Atividades

Esta seção narra, em ordem cronológica, o que foi desenvolvido ao longo do projeto — para leitores não necessariamente técnicos. Os detalhes de código encontram-se no §15 (Changelog).

### 9.1 Fevereiro/2026 — Fundação do sistema

O projeto teve início com a identificação e discussão do problema junto ao beneficiário-piloto: um profissional PJ que precisava controlar datas de emissão de notas fiscais sem perder prazos. A partir desse diagnóstico, foram tomadas duas decisões estruturantes logo no começo:

1. A aplicação seria **multi-tenant** desde o primeiro dia — ou seja, qualquer pessoa poderia criar uma conta e usar o sistema, não apenas o piloto. Isso amplia o impacto potencial do projeto sem aumentar a complexidade de forma proibitiva.
2. O modelo de dados central seria composto de **empresa** (`Company`) e **ordem de serviço** (`ServiceOrder`), com um campo `due_date` para o prazo de emissão e um campo `note_issued` para registrar se a nota foi emitida.

Com essa base definida, foram implementados:

- A estrutura do banco de dados (tabelas, tipos, relações) via migrações Prisma.
- As operações básicas de criação e listagem de empresas e ordens de serviço (CRUD).
- A ação de **marcar uma nota como emitida** (`mark-issued`), que é o gesto central de uso da ferramenta.
- Paginação nas listagens para comportar volumes de dados maiores no futuro.

Ainda em fevereiro, foram introduzidos dois refinamentos no banco de dados: um **enum** para padronizar o status de cada ordem (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`) e um **índice composto** nas colunas `note_issued` e `due_date`, antecipando a performance da consulta de pendências que viria em seguida.

### 9.2 Abril/2026 — Multi-tenancy, autenticação e painel de pendências

Com a base funcional, chegou o momento de abrir o sistema para múltiplos usuários com segurança. Foi criado o modelo `User` (nome, e-mail, senha) e toda a infraestrutura de autenticação:

- **Registro e login** com e-mail e senha, usando hash bcrypt para nunca armazenar a senha em texto claro.
- **Tokens JWT** gerados no login e exigidos em todas as rotas de dados — garantindo que cada usuário veja apenas suas próprias empresas e ordens.

Para verificar que o isolamento funcionava de fato, foram criados dois usuários de teste (A e B): o usuário B foi incapaz de acessar ou modificar qualquer dado pertencente a A, e vice-versa. Esse teste manual confirmou que a barreira multi-tenant estava correta antes de avançar.

Na mesma etapa, foi entregue o **painel de pendências**: um endpoint (`GET /service-orders/upcoming`) que retorna, para o usuário autenticado, todas as ordens ainda não emitidas cujo prazo vence dentro de um número configurável de dias (padrão: 7). As ordens são retornadas ordenadas por urgência (data de vencimento crescente), exatamente como o piloto precisaria visualizá-las.

### 9.3 Abril/2026 — Lembretes por e-mail e pipeline de integração contínua

Com o painel de pendências pronto, o próximo passo natural foi habilitar o aviso **fora da aplicação**: o lembrete por e-mail. Foi integrada a biblioteca nodemailer configurada para envio via Gmail (SMTP com STARTTLS), e criado um endpoint que, ao ser chamado, envia ao usuário um e-mail em português com todas as informações da ordem — nome do serviço, empresa, valor em reais e data de vencimento formatada.

Além de enviar o e-mail, o sistema registra a notificação no banco: marca a ordem como notificada, incrementa o contador de notificações e salva o horário do último envio. Essa estrutura prepara o terreno para a etapa seguinte, em que o disparo ocorrerá automaticamente por um job agendado, sem intervenção manual.

Também nessa etapa foi configurado um **pipeline de integração contínua** no GitHub Actions: a cada novo código enviado para o repositório, o sistema executa automaticamente a verificação de tipos TypeScript e todos os testes unitários. Isso protege a base de código contra regressões à medida que novas funcionalidades são adicionadas.

---

## 10. Resultados Alcançados

### 10.1 Resultados técnicos

Ao término das etapas concluídas até esta versão do relatório (06/2026), o backend da aplicação Tax Flow apresenta:

- **12 endpoints REST** implementados, autenticados e documentados interativamente via Scalar API Reference (acessível em `/docs` quando o servidor está em execução).
- **26 testes unitários** cobrindo os serviços de autenticação, gestão de empresas, ordens de serviço e paginação — todos passando no pipeline de CI a cada commit.
- **Arquitetura multi-tenant** com isolamento de dados verificado: usuários só acessam recursos próprios, garantido por JWT e filtros no banco de dados.
- **Pipeline de CI/CD** automatizado via GitHub Actions, rodando typecheck e testes em cada push para a branch principal.
- **Envio de e-mail** localizado (pt-BR) com rastreamento de notificações por ordem.

### 10.2 Resultados funcionais

Do ponto de vista do usuário final, o sistema já é capaz de:

- Permitir que qualquer PJ/MEI/ME crie uma conta segura e faça login.
- Cadastrar uma ou mais empresas (com validação de CNPJ).
- Registrar ordens de serviço com valor, prazo de emissão e status.
- Marcar notas como emitidas, removendo-as do painel de pendências.
- Consultar um painel de pendências que mostra o que precisa ser emitido nos próximos N dias, ordenado por urgência.
- Receber um e-mail de lembrete com os detalhes completos da ordem.

### 10.3 Próximos resultados esperados

- **Frontend mínimo funcional**: interface simples (navegador) que permita ao piloto PJ usar todas as funcionalidades acima sem precisar de ferramentas técnicas.
- **Job agendado**: disparo automático de lembretes nos dias anteriores ao vencimento, eliminando a necessidade do endpoint manual.
- **Validação com o piloto**: uso real do sistema por pelo menos 30 dias, com coleta de feedback qualitativo e análise dos indicadores quantitativos.

---

## 11. Desafios Enfrentados

### 11.1 Isolamento multi-tenant retroativo

Ao decidir adicionar o modelo `User` e o campo `user_id` às tabelas já existentes, foi necessário criar uma migration que alterasse a estrutura do banco sem perder dados. O desafio estava em tornar a coluna obrigatória (`NOT NULL`) em uma tabela que já continha registros — o que exigiria um valor padrão para linhas existentes. A solução foi aplicar a migration em ambiente de desenvolvimento limpo e documentar que, em produção, o banco deve ser inicializado apenas após a aplicação completa das migrations.

### 11.2 Coerção de datas no formato JSON

O protocolo HTTP transmite dados no formato JSON, que não possui um tipo nativo para datas. As datas chegam ao servidor como strings no padrão ISO 8601 (ex.: `"2026-04-20T00:00:00.000Z"`). O validador Zod, configurado inicialmente com `z.date()`, rejeitava essas strings com o erro `expected date, received string`. A solução foi substituir por `z.coerce.date()`, que converte automaticamente a string para o objeto `Date` do JavaScript antes de validar. O problema só foi detectado durante testes manuais de criação de ordens via HTTP — evidenciando a importância dos testes de integração, ainda ausentes.

### 11.3 Isolamento de testes com Prisma

A instância do Prisma Client, ao ser importada, tenta ler a variável de ambiente `DATABASE_URL` e encerra o processo se ela não existir. Isso impedia a execução dos testes unitários, que não deveriam depender de um banco de dados real. A solução adotada foi mockar o módulo `@/lib/prisma` em todos os arquivos de teste — garantindo que o Prisma nunca seja instanciado de verdade durante a suíte de testes.

### 11.4 Configuração do SMTP Gmail e posterior migração para Resend

A primeira implementação de envio de e-mail usou **nodemailer** com SMTP direto ao Gmail (`smtp.gmail.com:587`, STARTTLS). Em ambiente de desenvolvimento local, o envio funcionava corretamente. Em produção no Render, porém, todas as tentativas de conexão falhavam silenciosamente — sem erro explícito, pois a Promise do `transporter.sendMail()` não era aguardada (`await` faltando), fazendo com que rejeições desaparecessem sem rastreamento.

Após adicionar o `await` e o tratamento de erro, o log revelou a causa real: `ENETUNREACH 2607:f8b0:400e:c0d::6c:587` — o Render tentava conectar via **IPv6** ao Gmail, mas não tinha rota de saída disponível para esse protocolo. A tentativa de forçar IPv4 via `dns.setDefaultResultOrder("ipv4first")` do Node.js não surtiu efeito, pois esse mecanismo atua na resolução de nomes mas não na seleção da interface de rede usada pelo socket TCP.

A primeira tentativa de solução foi migrar para a **Resend API** (HTTPS, porta 443). O envio passou a funcionar tecnicamente, mas o plano gratuito do Resend impõe uma restrição: sem um domínio próprio verificado, só é possível enviar para o e-mail cadastrado na conta do desenvolvedor — inviável para enviar lembretes ao e-mail do piloto.

A segunda tentativa foi o **Brevo** (antigo Sendinblue), descartado por exigir endereço de empresa no cadastro.

A solução adotada foi o **Mailjet**: serviço de e-mail transacional que (a) usa HTTPS, (b) permite validar um endereço de e-mail individual como remetente sem exigir domínio, e (c) tem cadastro sem dados de empresa. O `mailer.ts` foi reescrito usando a API REST do Mailjet via `fetch` nativo do Node.js — sem adicionar nenhuma dependência ao projeto. As variáveis `SMTP_USER`/`SMTP_PASS` foram substituídas por `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `MAILJET_FROM_EMAIL` e `MAILJET_FROM_NAME`.

**Limitação conhecida — entrega na caixa de spam:** e-mails enviados via Mailjet com um endereço Gmail como remetente (`@gmail.com`) tendem a ser classificados como spam pelos servidores de destino. A razão é técnica: o registro SPF do Gmail autoriza apenas os servidores do próprio Google a enviar e-mails como `@gmail.com`; quando o Mailjet envia em nome desse endereço, a verificação SPF falha e o filtro de spam do destinatário penaliza a mensagem. A mitigação para o período de piloto é pedir ao beneficiário que marque o primeiro e-mail como "não é spam" e adicione o remetente aos contatos — ação que treina o filtro local. A solução definitiva é usar um domínio próprio com registros SPF e DKIM configurados apontando para o Mailjet.

Esse episódio ilustra uma limitação frequente de plataformas de hospedagem gratuitas: o bloqueio de saída SMTP é uma prática padrão para prevenir abuso de spam. Serviços de e-mail transacional (Mailjet, Resend, SendGrid) existem precisamente para contornar essa barreira, mas exigem algum nível de configuração de domínio para garantir entregabilidade plena.

### 11.5 Ausência de testes de integração

A suíte de testes atual cobre apenas a camada de serviços com mocks. Não existem testes que exercitem o fluxo completo HTTP → rota → serviço → banco de dados. Isso significa que problemas na camada de rotas (validação de parâmetros, autenticação, serialização de resposta) só são descobertos durante testes manuais com a ferramenta Scalar. Esse gap foi mitigado pela prática de testar manualmente cada nova rota, mas representa uma dívida técnica a resolver.

### 11.6 Conflito de versões React em monorepo npm workspaces

Ao instalar `react-router-dom@^6.28.0` no pacote frontend, o npm (v11, modo workspaces com hoisting padrão) auto-instalou React 19.2.4 como peer dependency, enquanto o frontend declarava `react@^18.3.1`. O resultado foi duas instâncias do React convivendo no mesmo `node_modules`: a 18.3.1 declarada pelo frontend e a 19.2.4 puxada pelo roteador. Esse é o cenário clássico que gera `Invalid hook call` e comportamento intermitente em componentes com estado — raiz provável da maioria dos "bugs inexplicáveis" relatados na fase inicial de testes do frontend.

O diagnóstico foi feito com `npm ls react`, que exibiu a árvore completa de dependências e revelou a duplicidade. A tentativa de corrigir via campo `overrides` no `package.json` raiz (`"react": "18.3.1"`) não surtiu efeito no npm 11, pois overrides não se aplicam a peer dependencies auto-instaladas quando há um lockfile pré-existente conflitante. A solução definitiva foi adicionar `.npmrc` com `legacy-peer-deps=true` na raiz do monorepo — essa flag restaura o comportamento do npm v6, onde peer dependencies **não** são auto-instaladas, deixando o controle de versões inteiramente para as declarações explícitas de cada pacote. Após deletar o `package-lock.json` e reinstalar, `npm ls react` passou a mostrar uma única entrada: `react@18.3.1`.

Aprendizado: em monorepos npm workspaces, o comportamento de auto-instalação de peer dependencies pode criar conflitos silenciosos de versão entre pacotes do ecossistema React. O arquivo `.npmrc` com `legacy-peer-deps=true` é uma mitigação pragmática quando o upgrade de todos os pacotes para a versão mais recente não é viável.

### 11.7 Contrato de mensagens de erro entre backend e frontend

O padrão `Result<T>` com `DomainError` discriminado por `type` funciona bem internamente no backend: o switch exaustivo em `domainErrorToHttp.ts` mapeia cada tipo a um status HTTP e o TypeScript garante que novos erros sejam tratados. O problema emergiu na fronteira backend–frontend: o `sendResult` enviava apenas `{ type: "USER_ALREADY_EXISTS_ERROR" }` como corpo da resposta, mas o cliente HTTP do frontend tentava exibir `body.message` — campo que não existia. O resultado era que o usuário via "Erro 409" ou "Erro 400" em vez de mensagens inteligíveis como "E-mail já cadastrado" ou "CNPJ inválido".

A correção introduziu um mapa `Record<DomainError["type"], string>` em `domainErrorMessages.ts` com traduções pt-BR para cada tipo de erro de domínio. O `sendResult` passou a incluir o campo `message` na resposta de erro (`{ ...result.error, message }`), mantendo o `type` para integrações programáticas e adicionando `message` para exibição direta. O frontend, que já tentava ler `body?.message`, passou a exibir mensagens corretas sem nenhuma alteração no código cliente.

Esse caso ilustra uma decisão clássica de design de API: separar **identificadores estáveis** (o campo `type`, ideal para tratamento programático e logs) de **strings localizadas** (o campo `message`, ideal para exibição). Sistemas que tentam usar o mesmo campo para ambos os propósitos inevitavelmente comprometem um dos dois.

### 11.8 Coerção de datas e o problema do fuso horário no `<input type="date">`

O input HTML `type="date"` emite valores no formato `"YYYY-MM-DD"` sem informação de hora ou fuso. Quando esse valor é passado diretamente ao construtor `new Date("2026-05-27")`, o JavaScript o interpreta como **UTC midnight** (meia-noite no fuso zero). Ao chamar `.toISOString()` em um ambiente no fuso BR (-3), o resultado é `"2026-05-26T21:00:00.000Z"` — ou seja, o dia anterior no UTC. O backend, ao receber essa string e convertê-la com `z.coerce.date()` seguida da validação `validateFutureDate` (que compara com `new Date()` no servidor), rejeitava a ordem como tendo data de vencimento no passado.

Esse é o segundo caso do projeto envolvendo coerção de datas (o primeiro foi documentado em §11.2). A correção foi padronizar a construção da data com meio-dia local: `new Date(fDueDate + "T12:00:00").toISOString()`. Ao adicionar o sufixo `"T12:00:00"` sem designador de fuso, o JS interpreta como **horário local** (meio-dia). Em qualquer fuso brasileiro (UTC-2 a UTC-5), o `.toISOString()` resultante recua no máximo 5 horas — ainda dentro do mesmo dia calendário. O mesmo padrão foi aplicado ao formulário de edição de ordem de serviço.

O acúmulo de dois incidentes com datas no mesmo projeto indica que um helper centralizado (ex.: `localDateToISOString(dateInputValue: string): string`) seria a abstração correta para eliminar a repetição e documentar a invariante em um só lugar.

### 11.9 Validação de token só no servidor leva a UX quebrada

O componente `PrivateRoute` original verificava a presença de um token no `localStorage` para decidir se o usuário estava autenticado. Esse controle é puramente local: um token expirado ou forjado passava pela guarda sem qualquer verificação de assinatura ou validade. O ciclo de vida resultante era: (1) usuário abre a aplicação com token expirado, (2) `PrivateRoute` o deixa entrar, (3) os componentes fazem requisições ao backend, (4) o backend retorna `401 Unauthorized`, (5) o frontend exibia genéricamente "Erro 401" sem nenhuma ação de logout — o usuário ficava preso em uma tela funcional mas incapaz de carregar dados.

A correção foi tratar o status 401 **globalmente** na função `apiFetch` do cliente HTTP: ao receber qualquer resposta 401, o código remove o token do `localStorage`, redireciona para `/login` via `window.location.href` e lança um erro. Essa abordagem cobre todos os endpoints sem precisar duplicar lógica em cada componente. O aprendizado: invariantes que dependem de estado externo (a validade de um token, verificada pelo servidor) não podem ser garantidas apenas por verificações locais na entrada da rota. O tratamento global de 401 é o complemento indispensável de qualquer sistema de autenticação baseado em token.

### 11.10 Endpoints expostos no backend mas não consumidos no frontend

Durante a auditoria cruzada entre a documentação Scalar (`/docs`) e o código do frontend, foram identificados três endpoints completamente implementados no backend que não tinham botão ou chamada correspondente na interface:

- `PATCH /service-orders/:id` — edição de nome, valor e data de vencimento
- `POST /service-orders/send-reminder` — disparo manual de lembrete por e-mail
- `GET /service-orders/:id` — detalhamento de uma ordem

A ausência do endpoint de edição criava uma barreira prática: um erro de digitação no nome do serviço ou um valor incorreto só podiam ser corrigidos via chamada direta à API (usando Scalar ou curl), o que é inviável para o piloto PJ não-técnico. O botão "Enviar lembrete" também havia sido planejado como alternativa ao job automático, mas nunca exposto na UI.

A correção implementou o botão "Lembrete" inline em cada ordem pendente (com feedback de "E-mail enviado!" por 3 segundos) e um formulário de edição inline (abre no lugar do card, com os campos pré-preenchidos). Ambos foram adicionados ao `ServiceOrders.tsx` consumindo os métodos já disponíveis em `lib/api.ts` — o `sendReminder` já existia, e o `update` foi adicionado como novo método.

O episódio evidenciou que o pacote frontend amadureceu sem revisão sistemática contra o catálogo de endpoints do backend. A lição prática: cada nova rota adicionada ao backend deve gerar um item de tarefa explícito no lado do cliente ("expor na UI"), para que o gap não se acumule silenciosamente.

### 11.11 Estado obsoleto e silenciamento de erros em formulários

Dois antipadrões foram identificados na auditoria do frontend e corrigidos:

**Estado obsoleto em Dashboard.tsx:** quando a requisição `GET /service-orders/upcoming` falhava (por token expirado, rede ou erro no servidor), o hook de carregamento chamava `setError(...)` mas deixava o array `orders` intocado. O resultado era uma tela que renderizava simultaneamente a mensagem de erro e os dados antigos da requisição anterior — o usuário via uma lista possivelmente desatualizada acompanhada de um banner de erro, sem saber se os dados eram confiáveis. A correção adicionou `setOrders([])` dentro do bloco `catch`, garantindo que uma falha always produza um estado limpo: só o erro, sem dados residuais.

**Silenciamento de erro em `loadCompanies`:** a função que carregava a lista de empresas para o `<select>` do formulário de nova ordem usava `catch { /* silently ignore */ }`. Se a chamada falhasse, o `<select>` ficava vazio sem qualquer feedback — o formulário parecia funcional, mas o campo obrigatório "Empresa" não tinha opções selecionáveis. A correção substituiu o silêncio por `setError(...)` com mensagem orientativa, e o botão "Nova ordem" foi desabilitado enquanto a lista de empresas estiver vazia, com tooltip explicativo.

A regra consolidada por esses dois casos: ao falhar, **limpar o estado dependente** e **mostrar mensagem inline visível**. Estado parcialmente atualizado com erro visível é quase sempre pior do que estado limpo com erro visível.

### 11.12 Acoplamento implícito de versão entre tooling do monorepo

Ao longo do desenvolvimento, o `vitest` no backend puxou `vite@7.3.2` como dependência interna, enquanto o frontend usava `vite@6.4.2` explicitamente. Ambos coexistiram sem causar bug de runtime, pois o npm os instalou em escopos de pacote isolados e o Vite é uma ferramenta de build/dev, não uma biblioteca incluída no bundle final. No entanto, a situação representa uma inconsistência de tooling: se uma funcionalidade do Vite 7 fosse usada inadvertidamente no `vite.config.ts` do frontend, o build falharia apenas na máquina de outro desenvolvedor que resolvesse com a versão diferente.

O caso não exigiu correção imediata, mas serve como registro do risco. Em monorepos, versões de ferramentas de build devem ser alinhadas explicitamente — seja por declaração na raiz do workspace, seja por `overrides` com versão exata. A divergência silenciosa entre Vite 6 e 7 é menos crítica do que a do React (§11.6), mas segue o mesmo padrão: dependências transitivas introduzindo versões inesperadas sem alerta visível.

### 11.13 Deploy em Railway: cadeia de erros em ambiente de produção

O processo de colocar o sistema em produção na plataforma Railway concentrou, em poucas horas, uma sequência de problemas encadeados. Cada erro só aparecia após o anterior ser resolvido — o que é característico de deploy em plataforma nova, onde as suposições do ambiente de desenvolvimento não se traduzem diretamente para produção. Os erros abaixo são registrados em ordem cronológica de ocorrência.

**a) Versão do Node.js não declarada — Railway escolheu Node 18**

O Railway usa o nixpacks para detectar automaticamente a stack e a versão do Node. Sem o campo `engines` no `package.json`, ele escolheu Node 18 como padrão. Prisma 7, Fastify 5, Vite 6 e vários outros pacotes do projeto exigem Node 20+. O Prisma, especificamente, tem um script de pré-instalação que aborta com mensagem explícita ao detectar versão incompatível. A correção foi adicionar `"engines": { "node": ">=20" }` tanto no `package.json` raiz quanto no `packages/frontend/package.json`, garantindo que o nixpacks de cada serviço lesse a restrição correta.

**b) `noEmit: true` no tsconfig impede build de produção**

O tsconfig do backend tinha `"noEmit": true` — uma configuração válida para projetos que usam `tsx` em desenvolvimento, onde o TypeScript serve apenas como typechecker e nunca precisa emitir arquivos. Em produção, porém, `node dist/server.js` precisa de JS compilado. A primeira tentativa de remover `noEmit` e usar `NodeNext` como `moduleResolution` resultou em erros em cascata: TypeScript no modo `NodeNext` exige extensões `.js` explícitas em todos os imports relativos, e o projeto tinha dezenas de imports sem extensão. A solução adotada foi manter o tsconfig com `noEmit: true` para typecheck e adicionar o `tsup` como bundler de produção — o tsup usa esbuild internamente, que resolve path aliases (`@/*`) e imports relativos sem exigir extensões, gerando um único `dist/server.js` de ~38KB.

**c) Binário nativo do Rollup não instalado no Linux**

O `package-lock.json` foi gerado no macOS, que registra os binários opcionais da plataforma macOS (`@rollup/rollup-darwin-arm64`). Ao buildar no Railway (Linux x64), o npm tem um bug antigo onde não instala binários opcionais de plataforma diferente que estão apenas registrados no lockfile — ele simplesmente pula. O Vite depende do Rollup para o bundle de produção, e sem o binário Linux o build do frontend falhava com `Cannot find module @rollup/rollup-linux-x64-gnu`. A correção foi declarar `"@rollup/rollup-linux-x64-gnu"` explicitamente em `optionalDependencies` do `packages/frontend/package.json`, forçando o npm a instalá-lo independente da plataforma.

**d) Working directory errado no monorepo — `prisma migrate deploy` não achava o schema**

O Railway executa os comandos de start a partir do diretório raiz do repositório, mas o schema do Prisma e o `dist/server.js` ficam em `packages/backend/`. O `startCommand` original (`npx prisma migrate deploy && node dist/server.js`) procurava `prisma/schema.prisma` na raiz e falhava. A solução foi mover o `prisma migrate deploy` para dentro do script `start` do próprio `package.json` do backend (`"start": "prisma migrate deploy && node dist/server.js"`) e configurar o Railway para executar `npm run start --workspace=@tax-flow/backend` — o npm workspace command altera o cwd para `packages/backend/` antes de executar o script, resolvendo o problema de diretório.

**e) Variável de ambiente `VITE_API_URL` ausente no build — URL bakeada errada**

O Vite injeta variáveis de ambiente no bundle **em tempo de build**, não em runtime. Na primeira tentativa de deploy, o serviço do frontend foi criado sem a variável `VITE_API_URL` configurada. O build usou o fallback (`http://localhost:3333`) e o bundle foi gerado com essa URL hardcoded. Após configurar a variável no Railway, foi necessário disparar um novo deploy para o Vite recompilar o bundle com a URL correta. Esse comportamento contrasta com variáveis de ambiente em aplicações server-side, onde a var é lida em runtime. Para qualquer variável que começa com `VITE_`, a regra é: ela precisa estar configurada **antes** do build, não antes do start.

**f) `VITE_API_URL` sem protocolo tratada como caminho relativo**

Mesmo após o redeploy com a variável correta, o usuário havia configurado o valor sem o prefixo `https://` (ex: `tax-flowbackend-production.up.railway.app` em vez de `https://tax-flowbackend-production.up.railway.app`). O browser interpretou a string como um caminho relativo e a concatenou ao domínio do próprio frontend, gerando requisições para `https://tax-flowfrontend.../tax-flowbackend.../auth/register`. O servidor do frontend respondeu com o `index.html` (status 200), e o `res.json()` tentou parsear HTML como JSON — gerando a mensagem críptica "The string did not match the expected pattern" do parser JSON do Safari, sem qualquer indicação do problema real. A mitigação foi adicionar lógica no `apiFetch` para auto-prefixar `https://` se a URL não contiver `://`, tornando o comportamento robusto a erros de configuração.

**g) Backend retornando 502 por variável de ambiente ausente**

Após todos os fixes acima, o backend retornava 502 (Application failed to respond). A causa: o plugin de autenticação JWT lança um erro explícito na inicialização se `JWT_SECRET` não estiver definida — e esse erro derruba o processo Fastify antes de ele começar a escutar na porta. O Railway, sem receber resposta no health check, marca o deploy como falho. A correção operacional foi configurar `JWT_SECRET` (e as demais variáveis obrigatórias) no painel antes do próximo redeploy. O aprendizado arquitetural: variáveis obrigatórias de inicialização devem ser validadas logo no boot com mensagens de erro claras — o que o projeto já fazia, mas a mensagem ficou nos logs e não foi imediatamente associada ao 502.

A sequência completa ilustra um padrão recorrente em deploys: erros de configuração de ambiente se manifestam como erros de aplicação, e cada camada resolvida revela a próxima. Monorepos adicionam complexidade extra porque os paths e os contextos de execução raramente coincidem com os de desenvolvimento local.

> **Nota:** após os ajustes iniciais no Railway, o projeto foi migrado para o **Render** (render.com), onde o backend e o frontend são hospedados gratuitamente. A migração não exigiu mudanças no código — apenas a configuração das variáveis de ambiente no novo painel e a atualização de `VITE_API_URL` no frontend para apontar para o domínio Render do backend.

---

## 12. Conclusões

O desenvolvimento do Tax Flow até o presente momento demonstra que é viável construir, como projeto de extensão universitária, uma aplicação web multi-tenant funcional e segura que atende a uma necessidade real de profissionais autônomos brasileiros.

A principal decisão arquitetural do projeto — adotar multi-tenancy desde o início, em vez de construir uma ferramenta para uso exclusivo do piloto — mostrou-se acertada: o custo de implementar autenticação e isolamento de dados foi concentrado em uma única etapa (abril/2026) e eliminou qualquer retrabalho futuro para escalar o produto além do piloto.

O sistema está funcionalmente completo e em produção: o piloto criou sua conta, cadastrou sua empresa e suas ordens de serviço, e recebeu lembretes por e-mail confirmando que o fluxo funciona de ponta a ponta. O frontend — intencionalmente simples, focado em funcionalidade e usabilidade básica — cumpriu seu papel de tornar o sistema acessível a um usuário não-técnico sem fricção.

A próxima fase é a coleta estruturada de feedback após pelo menos 30 dias de uso contínuo. É nessa etapa que a proposta será validada ou redirecionada com base na experiência concreta de quem enfrenta o problema todos os meses. Esse ciclo — construir, entregar, observar, ajustar — é o coração do projeto de extensão e o que distingue uma solução técnica de uma solução com impacto comunitário real.

---

## 13. Execução Preliminar (Piloto)

O piloto é o amigo PJ do aluno, prestador de serviços de tecnologia. A execução preliminar seguiu estas etapas:

1. ✅ **Validação do plano** — apresentação da proposta ao piloto, confirmação das necessidades e canais preferidos de lembrete.
2. ✅ **Entrega do frontend** — desenvolvimento da interface mínima para que o piloto possa usar o sistema sem conhecimento técnico.
3. ✅ **Cadastro real** — o piloto criou sua conta no sistema, cadastrou sua empresa e registrou ordens de serviço reais.
4. ✅ **Recebimento de lembretes** — o piloto recebeu e-mails de lembrete via disparo manual (`POST /service-orders/send-reminder`), confirmando o fluxo completo de ponta a ponta.
5. 🔄 **Uso contínuo** — o piloto utiliza o painel de pendências e marca notas como emitidas conforme o ciclo mensal.
6. ⏳ **Coleta de feedback estruturada** — ao final de um ciclo completo (mínimo 30 dias), entrevista com o piloto para registrar aprendizados e avaliar os indicadores.

> [Prints de tela do piloto utilizando o sistema serão adicionados aqui em versão futura deste documento.]

### Limitação conhecida: hibernação do Render no plano gratuito

O job cron de lembretes automáticos (`0 8 * * *`) **está implementado** e funciona corretamente — ao ser disparado, varre todas as ordens pendentes próximas do vencimento e envia os e-mails. O problema é de infraestrutura: o plano gratuito do Render suspende o processo após 15 minutos sem requisições HTTP. Se o servidor estiver hibernado às 08:00, o processo Node.js não está em execução e o cron simplesmente não dispara.

Para validar o funcionamento em produção sem depender do horário fixo das 08:00 (que poderia coincidir com a hibernação do servidor), o schedule foi temporariamente alterado para `*/5 * * * *` (a cada 5 minutos) durante a sessão de testes com o piloto. O teste confirmou que o job disparou corretamente, varreu as ordens pendentes e enviou os e-mails. Após a validação, o schedule foi restaurado para `0 8 * * *`.

Para o período de piloto, o disparo manual pelo botão "Lembrete" na interface supre essa limitação. A solução definitiva para produção plena é migrar para um plano pago do Render (que não hiberna) ou externalizar o agendamento para um serviço de cron externo (ex.: cron-job.org), que faz uma requisição HTTP periódica mantendo o servidor ativo.

## 14. Documentação e Reflexão sobre o Processo

Esta seção é atualizada ao final de cada iteração relevante. Registra:

- O que foi executado de forma preliminar.
- Resultados ou aprendizados obtidos com a aplicação prática.
- Aspectos da proposta que precisaram ser ajustados após o piloto.
- Como essas mudanças fortalecem a viabilidade da execução futura.

**Execução preliminar concluída (maio/2026):** o piloto criou sua conta, cadastrou empresa e ordens reais, e recebeu lembretes por e-mail via disparo manual. O fluxo completo — cadastro → painel de pendências → lembrete por e-mail → marcar como emitida — foi validado em ambiente de produção (Render + PostgreSQL). Feedback inicial positivo: o piloto considerou a interface direta e o lembrete por e-mail útil para o controle mensal de notas.

**Ajuste identificado:** o job cron automático está implementado e funciona corretamente, mas o plano gratuito do Render hiberna o servidor em períodos de inatividade — se o processo estiver suspenso às 08:00, o disparo não ocorre. Para o ciclo atual do piloto, o disparo é feito manualmente via botão na interface. Esse ponto será revisado antes de uma abertura mais ampla do sistema.

> [Depoimento formal do piloto e prints de tela serão adicionados aqui ao final do ciclo de uso de 30 dias.]

---

## 15. Changelog do código

Registro, em ordem cronológica reversa, das alterações de código relevantes para a entrega acadêmica. Cada entrada explica **o quê**, **onde** e **por quê**.

### 2026-05-28 — Migração de nodemailer para Resend + refatoração do endpoint de lembrete

**O quê:**
- Substituição completa do **nodemailer** (SMTP direto) pelo **Resend SDK** no módulo `mailer.ts`. A interface pública (`sendMail(payload)`) foi preservada — sem impacto nas camadas de serviço ou nos testes.
- Correção do `await` faltando em `transporter.sendMail()`: a Promise era descartada silenciosamente, e qualquer falha de rede ou autenticação desaparecia sem log. Com `await`, erros agora propagam corretamente.
- Adição de `.catch()` no disparo fire-and-forget de `sendServiceOrderReminder`, garantindo que falhas de envio sejam registradas nos logs sem bloquear a resposta ao cliente (que recebe `204` imediatamente).
- Refatoração do endpoint de lembrete: de `POST /service-orders/:id/send-reminder` (id na URL) para `POST /service-orders/send-reminder` (id no body `{ id: number }`). Motivação: evitar o erro `Body cannot be empty when content-type is set to 'application/json'` em clientes que enviavam body vazio para uma rota que não esperava body.
- Frontend atualizado para consumir o novo contrato: `sendReminder(id)` passa a enviar `body: JSON.stringify({ id })` em vez de interpolar o id na URL.
- Testes ajustados: mock de `sendMail` passa a retornar `Promise.resolve(undefined)` por padrão (em vez de `undefined` puro) para suportar o `.catch()` no caller; o caso de teste de propagação de erro foi reescrito para refletir o comportamento fire-and-forget.

**Arquivos afetados (modificados):**
- `packages/backend/src/lib/mailer.ts` — reescrito com Resend SDK; remove imports de nodemailer e SMTPTransport.
- `packages/backend/src/routes/serviceOrder/serviceOrder.routes.ts` — rota `POST /service-orders/send-reminder` com `body: sendReminderBodySchema`.
- `packages/backend/src/routes/serviceOrder/schemas.ts` — novo `sendReminderBodySchema = z.object({ id: z.number().int().positive() })`.
- `packages/backend/src/__tests__/services/serviceOrder/sendServiceOrderReminder.test.ts` — mock e caso de erro atualizados.
- `packages/frontend/src/lib/api.ts` — `sendReminder` usa body JSON em vez de URL param.
- `packages/backend/.env.example` — `SMTP_USER`/`SMTP_PASS` substituídas por `RESEND_API_KEY`/`RESEND_FROM`.
- `packages/backend/package.json` — remove `nodemailer` e `@types/nodemailer`; adiciona `resend`.

**Motivação:** o Render (e a maioria dos provedores PaaS) bloqueia conexões SMTP de saída para prevenir spam. A tentativa de forçar IPv4 via `dns.setDefaultResultOrder` não resolveu, pois o bloqueio ocorre na camada de rede, não na resolução DNS. O Resend utiliza HTTPS (porta 443), sempre disponível, e oferece plano gratuito compatível com as necessidades do piloto.

**Variáveis de ambiente alteradas:** `SMTP_USER` e `SMTP_PASS` removidas; introduzidas `RESEND_API_KEY` (depois substituída — ver entrada seguinte) e, na versão final, `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `MAILJET_FROM_EMAIL` e `MAILJET_FROM_NAME`.

### 2026-05-28 (cont.) — Troca de Resend → Brevo → Mailjet para envio de e-mail

**O quê:** após o Resend bloquear envios a destinatários externos no plano gratuito sem domínio verificado, e o Brevo exigir endereço de empresa no cadastro, o projeto migrou para o **Mailjet**, que aceita cadastro simples e validação de remetente por e-mail individual. O `mailer.ts` foi simplificado para uma função pura sem estado usando `fetch` nativo — eliminando qualquer dependência de SDK de terceiros para envio de e-mail. Os testes continuam passando sem alteração, pois mockam `@/lib/mailer` como uma caixa-preta.

**Limitação registrada:** e-mails enviados com remetente `@gmail.com` via Mailjet podem cair em spam por falha de SPF. Workaround para o piloto: marcar uma vez como "não é spam". Solução definitiva: domínio próprio com SPF/DKIM configurado.

**Arquivos afetados:**
- `packages/backend/src/lib/mailer.ts` — reescrito com fetch nativo para a API REST do Mailjet.
- `packages/backend/.env.example` — atualizado com as quatro variáveis do Mailjet.

---

### 2026-05-26 — Auditoria crítica do frontend + alinhamento de contratos

**O quê:**
- Correção do conflito React 18/19 em monorepo npm workspaces via `.npmrc` com `legacy-peer-deps=true`.
- Padronização do contrato de erros backend→frontend: novo mapa `domainErrorMessages.ts` com traduções pt-BR; `sendResult` passa a enviar `{ type, message }` em vez de apenas `{ type }`.
- Correção do bug de fuso horário na criação e edição de ordens: substituição de `new Date(fDueDate).toISOString()` por `new Date(fDueDate + "T12:00:00").toISOString()`.
- Tratamento global de 401 em `apiFetch`: token removido do localStorage e redirecionamento para `/login` automático.
- Botão "Lembrete" inline em cada ordem pendente (feedback "E-mail enviado!" por 3s) consumindo `POST /service-orders/:id/send-reminder`.
- Formulário de edição inline em cada ordem pendente consumindo `PATCH /service-orders/:id`.
- Paginação corrigida em `ServiceOrders.tsx` e `Companies.tsx`: usa `total_pages` retornado pelo backend em vez de inferir por `rows.length < 20`.
- Estado limpo em falhas: `setOrders([])` no catch do Dashboard; erro visível no lugar do silêncio em `loadCompanies`.
- `alert()` substituído por banners inline (`actionError`) em Dashboard e ServiceOrders.
- Refatoração de `useEffect` com dependências via `useCallback`, removendo todos os comentários `eslint-disable-line`.

**Arquivos afetados (criados):**
- `packages/backend/src/errors/domainErrorMessages.ts` — mapa `Record<DomainError["type"], string>` com mensagens pt-BR.
- `.npmrc` — `legacy-peer-deps=true` para resolver conflito React 18/19.

**Arquivos afetados (modificados):**
- `packages/backend/src/lib/sendResult.ts` — inclui campo `message` na resposta de erro.
- `packages/frontend/src/lib/api.ts` — interceptor 401 + método `serviceOrders.update`.
- `packages/frontend/src/pages/ServiceOrders.tsx` — timezone fix, lembrete, edição inline, paginação correta, erros inline.
- `packages/frontend/src/pages/Dashboard.tsx` — estado limpo em erro, erro inline, useCallback.
- `packages/frontend/src/pages/Companies.tsx` — paginação correta, useCallback.

**Motivação:** auditoria sistemática revelou múltiplos pontos de falha na comunicação frontend–backend que tornavam o sistema aparentemente funcional mas praticamente inutilizável para o piloto não-técnico. Todos os bugs bloqueadores foram corrigidos antes da entrega acadêmica de 2026-05-29.

### 2026-05-21 — Job agendado de lembretes + frontend React

**O quê:**
- Job cron diário (`0 8 * * *`) que varre automaticamente todas as ordens de serviço não emitidas com vencimento dentro do horizonte configurável (`REMINDER_DAYS_AHEAD`, padrão 3 dias) e envia o e-mail de lembrete sem intervenção manual.
- Criação do pacote `@tax-flow/frontend` no monorepo: aplicação React 18 + Vite + Tailwind CSS, com roteamento via React Router v6.
- Páginas implementadas: Login, Cadastro, Dashboard (pendências com seletor de horizonte e botão "Emitida"), Empresas (listagem + criação inline) e Ordens de Serviço (listagem com filtro por empresa + criação via formulário + marcação de emitida).
- Client HTTP tipado (`lib/api.ts`) com injeção automática de Bearer token.
- Proxy Vite apontando `/api` para `localhost:3333`, eliminando CORS em desenvolvimento.

**Arquivos afetados (criados):**
- `packages/backend/src/services/serviceOrder/getServiceOrdersForReminder.ts` — consulta global (todos os usuários) para o job.
- `packages/backend/src/jobs/sendRemindersJob.ts` — lógica do cron com `node-cron`.
- `packages/frontend/` — pacote completo (package.json, tsconfig, vite.config, tailwind, index.html, src/).

**Arquivos afetados (modificados):**
- `packages/backend/package.json` — nova dep `node-cron` + `@types/node-cron`.
- `packages/backend/src/server.ts` — registra `registerSendRemindersJob()` após `app.listen()`.

**Motivação:** com o job agendado, o piloto PJ não precisa acionar o lembrete manualmente — o sistema age de forma autônoma antes do vencimento. O frontend fecha o ciclo: o piloto passa a ter uma interface acessível para cadastrar empresas, ordens e acompanhar o painel de pendências, sem precisar de ferramentas técnicas.

**Variável de ambiente nova (opcional):** `REMINDER_DAYS_AHEAD` (padrão `3`) — controla com quantos dias de antecedência o lembrete é enviado.

### 2026-04-13 — CI no GitHub Actions + envio de lembrete por e-mail

**O quê:**
- Workflow de CI em `.github/workflows/ci.yml` que roda `typecheck` (`tsc --noEmit`) e `vitest` em cada push para `main` e PRs para `main`, usando Node 24 LTS.
- Feature de envio de lembrete de emissão de nota fiscal por **e-mail SMTP**, via `nodemailer`. Destinatário: e-mail do `User` dono da ordem.
- Endpoint manual `POST /service-orders/:id/send-reminder` (autenticado, escopo multi-tenant), que envia o e-mail e atualiza os campos `notified`, `notification_count` e `last_notification_at` do `ServiceOrder`.
- Regras de negócio: 404 se a ordem não pertence ao usuário; 409 se a nota já foi emitida (`SERVICE_ORDER_ALREADY_ISSUED_ERROR`).
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

Baseado nas diretrizes do **Projeto de Extensão V — Cursos de Ciência da Computação** do Centro Universitário União das Américas Descomplica. Bibliografia:

- ASSUNÇÃO, R. M., & OLIVEIRA, J. P. (2016). *Inclusão digital e alfabetização tecnológica: um estudo de caso.* Salvador: EDUFBA.
- PRESSMAN, R. S. (2019). *Engenharia de software: uma abordagem profissional.* 8. ed. Porto Alegre: AMGH.
- SOMMERVILLE, I. (2011). *Engenharia de Software.* 9. ed. São Paulo: Pearson.
