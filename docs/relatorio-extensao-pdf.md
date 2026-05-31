# Tax Flow
## Lembrete e controle de emissão de notas fiscais para PJ/MEI/ME

**Instituição:** Centro Universitário União das Américas Descomplica  
**Curso:** Ciência da Computação  
**Disciplina:** Projeto de Extensão V  
**Aluno:** Guilherme Silva  
**Semestre:** 2026/1  

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

A decisão de tornar a aplicação **multi-tenant desde o início** amplia o impacto social do projeto, que deixa de ser uma solução individual e passa a ser um produto utilizável pela comunidade de pequenos empreendedores. Essa escolha alinha-se ao princípio de inclusão digital e alfabetização tecnológica presente nas diretrizes da extensão universitária em Computação (cf. ASSUNÇÃO & OLIVEIRA, 2016).

---

## 2. Objetivo Geral

Desenvolver uma aplicação web multi-tenant de lembrete e acompanhamento de emissão de notas fiscais, acessível a profissionais PJ/MEI/ME, validada por meio de um piloto real com um beneficiário da comunidade.

## 3. Objetivos Específicos

- Permitir que qualquer usuário se cadastre e autentique com segurança (e-mail e senha com hash criptográfico).
- Permitir que cada usuário cadastre suas empresas e as ordens de serviço associadas, com controle de valor, data de vencimento e status.
- Permitir marcar uma ordem como "nota emitida", registrando o fato e reduzindo a lista de pendências.
- Disponibilizar um painel de ordens pendentes mostrando o que precisa ser emitido em uma janela configurável.
- Enviar lembretes automáticos por e-mail antes do vencimento.
- Validar a solução com o piloto, coletando feedback qualitativo e ajustando a proposta conforme a realidade observada.

---

## 4. Público-alvo e Comunidade Envolvida

**Público-alvo:** profissionais autônomos formalizados como PJ, MEI ou ME que realizam a própria gestão de emissão de notas fiscais de serviço, em especial aqueles que não contam com suporte contábil contínuo.

**Comunidade envolvida no piloto:** amigo do aluno, que atua como PJ prestador de serviços de tecnologia. Sua rotina envolve emissão regular de notas fiscais para múltiplos clientes, com datas de vencimento distintas a cada mês. A ausência de uma ferramenta centralizada faz com que ele controle esses prazos informalmente, sujeito a esquecimentos. Ele é o beneficiário direto da execução preliminar e sua experiência de uso fornecerá os parâmetros para calibrar e ajustar a ferramenta.

---

## 5. Metodologia e Plano de Ação

### 5.1 Arquitetura do sistema

O backend é implementado em **Node.js com TypeScript** usando **Fastify** como framework HTTP e **Prisma ORM** sobre **PostgreSQL**. A arquitetura segue três camadas bem delimitadas:

1. **Rotas (HTTP)** — validam entrada com esquemas tipados e delegam para serviços.
2. **Serviços (regra de negócio)** — funções que recebem entrada tipada, acessam o banco via Prisma e retornam um tipo resultado que distingue sucesso de erro de domínio. Serviços não lançam exceções para erros esperados.
3. **Camada de dados** — Prisma Client conectado ao Postgres.

### 5.2 Multi-tenancy

A aplicação é multi-tenant por design:

- Existe um modelo de Usuário (nome, e-mail único, hash de senha).
- Cada Empresa pertence a exatamente um Usuário.
- Cada Ordem de Serviço pertence a uma Empresa, e por extensão a um Usuário.
- Todas as rotas de dados são autenticadas via token JWT; todas as consultas filtram pelo usuário autenticado.
- Senhas são armazenadas como hash bcrypt — nunca em texto claro.

### 5.3 Canais de lembrete

Dois canais estão previstos:

- **E-mail** — para lembretes ativos próximos ao vencimento. O envio é feito via Mailjet, serviço de e-mail transacional que utiliza HTTPS — evitando restrições de portas SMTP impostas por provedores de nuvem. O banco registra data e contador de notificações por ordem para suportar múltiplos lembretes.
- **In-app** — painel web listando as ordens pendentes, ordenadas por urgência (data de vencimento crescente).

### 5.4 Plano de ação por etapas

| Etapa | Descrição | Status |
|-------|-----------|--------|
| 1 | Modelagem inicial (Empresa, Ordem de Serviço, status) | Concluída |
| 2 | CRUD básico: criar/listar empresas e ordens | Concluída |
| 3 | Marcação de nota emitida | Concluída |
| 4 | Multi-tenancy: autenticação JWT, isolamento por usuário | Concluída |
| 5 | Painel de pendências por janela de dias | Concluída |
| 6 | Envio de e-mail via Mailjet e endpoint de disparo manual | Concluída |
| 7 | Job agendado varrendo ordens próximas e disparando e-mail | Concluída |
| 8 | Frontend React acessível ao piloto | Concluída |
| 9 | Cadastro real do piloto e uso contínuo | Em andamento |
| 10 | Coleta de feedback estruturado e ajustes finais | Planejada |

---

## 6. Recursos Necessários

### Recursos técnicos

- **Node.js 20+ e TypeScript 5** — runtime e tipagem estática do backend.
- **Fastify 5** — framework HTTP de alta performance.
- **Prisma 7 + PostgreSQL** — ORM e banco de dados relacional.
- **Zod** — validação de entrada com geração automática de documentação OpenAPI.
- **bcrypt** — hash de senhas.
- **Mailjet API** — envio de e-mail transacional via HTTPS (plano gratuito: 6.000 e-mails/mês).
- **Vitest** — testes unitários automatizados.
- **React 18 + Vite + Tailwind CSS** — frontend.
- **Turbo** — orquestração do monorepo.

### Recursos de infraestrutura

- **Render** — hospedagem gratuita de backend e frontend durante o piloto.
- **Mailjet** — serviço de e-mail transacional, sem exigência de domínio próprio, cadastro simples.
- **GitHub Actions** — pipeline de integração contínua com typecheck e testes a cada commit.

### Variáveis de ambiente (produção)

- `DATABASE_URL` — string de conexão Postgres.
- `JWT_SECRET` — segredo para assinar tokens de autenticação.
- `MAILJET_API_KEY` e `MAILJET_SECRET_KEY` — credenciais do serviço de e-mail.
- `MAILJET_FROM_EMAIL` e `MAILJET_FROM_NAME` — identidade do remetente.

### Recursos humanos

- Aluno-desenvolvedor (Guilherme Silva).
- Beneficiário do piloto (amigo PJ, prestador de serviços de tecnologia).

---

## 7. Cronograma de Execução

| Etapa | Atividade | Responsável | Prazo |
|-------|-----------|-------------|-------|
| 1–3 | Modelagem e CRUD básico | Aluno | Concluído em 07/02/2026 |
| 4 | Multi-tenancy + autenticação JWT | Aluno | Concluído em 13/04/2026 |
| 5 | Painel de pendências | Aluno | Concluído em 13/04/2026 |
| 6 | E-mail + disparo manual | Aluno | Concluído em 13/04/2026 |
| 7 | Job agendado de lembretes | Aluno | Concluído em 21/05/2026 |
| 8 | Frontend mínimo funcional | Aluno | Concluído em 21/05/2026 |
| 9 | Cadastro e uso contínuo pelo piloto | Aluno + piloto | Jun–Jul/2026 |
| 10 | Coleta de feedback + ajustes finais | Aluno + piloto | Jul–Ago/2026 |

---

## 8. Indicadores e Avaliação

### Indicadores quantitativos

- Número de usuários cadastrados (meta mínima: 1 — o piloto).
- Número de ordens de serviço cadastradas pelo piloto durante o período de validação.
- Proporção de ordens marcadas como emitidas antes do vencimento.
- Número de e-mails de lembrete enviados com sucesso.

### Indicadores qualitativos

- Feedback do piloto sobre clareza da interface e utilidade dos lembretes.
- Percepção do piloto sobre redução de esquecimentos e melhoria do controle financeiro.
- Sugestões de melhoria coletadas durante o uso real.

### Forma de avaliação

- Durante a execução: contato periódico com o piloto após cada nova funcionalidade entregue.
- Ao final: entrevista semiestruturada com o piloto registrada em depoimento textual, mais análise dos indicadores quantitativos extraídos do banco.

---

## 9. Descrição das Atividades

### 9.1 Fevereiro/2026 — Fundação do sistema

O projeto teve início com a identificação e discussão do problema junto ao beneficiário-piloto: um profissional PJ que precisava controlar datas de emissão de notas fiscais sem perder prazos. A partir desse diagnóstico, foram tomadas duas decisões estruturantes:

1. A aplicação seria **multi-tenant** desde o primeiro dia — qualquer pessoa poderia criar uma conta e usar o sistema, não apenas o piloto. Isso amplia o impacto potencial sem aumentar a complexidade de forma proibitiva.
2. O modelo de dados central seria composto de **empresa** e **ordem de serviço**, com um campo de prazo de emissão e um campo para registrar se a nota foi emitida.

Com essa base definida, foram implementados a estrutura do banco de dados via migrações, as operações básicas de criação e listagem de empresas e ordens (CRUD), a ação de marcar uma nota como emitida e a paginação nas listagens.

### 9.2 Abril/2026 — Multi-tenancy, autenticação e painel de pendências

Com a base funcional, chegou o momento de abrir o sistema para múltiplos usuários com segurança. Foi criado o modelo de Usuário e toda a infraestrutura de autenticação: registro e login com e-mail e senha (usando hash bcrypt), e tokens JWT exigidos em todas as rotas de dados — garantindo que cada usuário veja apenas suas próprias empresas e ordens.

Para verificar que o isolamento funcionava, foram criados dois usuários de teste: o usuário B foi incapaz de acessar ou modificar qualquer dado pertencente ao usuário A, e vice-versa. Esse teste manual confirmou que a barreira multi-tenant estava correta.

Na mesma etapa foi entregue o **painel de pendências**: retorna para o usuário autenticado todas as ordens ainda não emitidas cujo prazo vence dentro de um número configurável de dias (padrão: 7), ordenadas por urgência.

Também foi configurado o **pipeline de integração contínua** no GitHub Actions: a cada novo código enviado ao repositório, o sistema executa automaticamente verificação de tipos e todos os testes unitários — protegendo contra regressões.

### 9.3 Abril/2026 — Lembretes por e-mail

Com o painel de pendências pronto, o próximo passo foi habilitar o aviso fora da aplicação: o lembrete por e-mail. Foi criado um endpoint que, ao ser chamado, envia ao usuário um e-mail em português com todas as informações da ordem — nome do serviço, empresa, valor em reais e data de vencimento formatada. Além de enviar o e-mail, o sistema registra a notificação no banco: marca a ordem como notificada, incrementa o contador e salva o horário do último envio.

### 9.4 Maio/2026 — Job agendado e frontend

Foi implementado um **job agendado** (cron diário às 08:00) que varre automaticamente todas as ordens não emitidas com vencimento próximo e envia os lembretes sem intervenção manual. O job está implementado e funciona corretamente; durante os testes em produção, o schedule foi temporariamente configurado para disparar a cada 5 minutos — o que confirmou o funcionamento completo — e depois restaurado ao horário definitivo.

Em paralelo, foi criado o **frontend React**: uma interface web acessível que permite ao piloto PJ usar todas as funcionalidades sem nenhum conhecimento técnico. As páginas implementadas cobrem login, cadastro, painel de pendências, listagem de empresas e listagem de ordens de serviço com ações de edição, lembrete e marcação como emitida.

---

## 10. Resultados Alcançados

### 10.1 Resultados técnicos

- **12 endpoints REST** implementados, autenticados e documentados via documentação interativa acessível em produção.
- **26 testes unitários** cobrindo os serviços de autenticação, gestão de empresas, ordens de serviço e paginação — todos passando no pipeline de CI a cada commit.
- **Arquitetura multi-tenant** com isolamento de dados verificado: usuários só acessam recursos próprios, garantido por JWT e filtros no banco de dados.
- **Pipeline de CI/CD** automatizado via GitHub Actions, rodando typecheck e testes em cada push.
- **Envio de e-mail** localizado (pt-BR) com rastreamento de notificações por ordem.

### 10.2 Resultados funcionais

Do ponto de vista do usuário final, o sistema permite:

- Criar uma conta segura e fazer login.
- Cadastrar uma ou mais empresas com validação de CNPJ.
- Registrar ordens de serviço com valor, prazo de emissão e status.
- Marcar notas como emitidas, removendo-as do painel de pendências.
- Consultar um painel de pendências que mostra o que precisa ser emitido nos próximos N dias, ordenado por urgência.
- Receber um e-mail de lembrete com os detalhes completos da ordem.
- Editar dados de uma ordem já cadastrada.
- Disparar um lembrete manualmente a qualquer momento.

### 10.3 Validação com o piloto

O sistema foi validado em produção com o beneficiário real: o piloto criou sua conta, cadastrou sua empresa (Data Front) e registrou ordens de serviço reais. Recebeu e-mails de lembrete confirmando o fluxo completo de ponta a ponta. O feedback inicial foi positivo: a interface foi considerada direta e o lembrete por e-mail útil para o controle mensal de notas.

---

## 11. Principais Desafios Enfrentados

### 11.1 Envio de e-mail em produção

A primeira implementação usou nodemailer com SMTP direto ao Gmail. Em produção no Render, a conexão falhava silenciosamente: os logs revelaram que o servidor tentava conectar via IPv6 ao Gmail, mas não havia rota de saída disponível para esse protocolo. Diversas tentativas de contornar o problema (forçar IPv4, alterar porta) não surtiram efeito, pois a plataforma bloqueava conexões SMTP de saída para prevenir spam.

A solução foi migrar para o **Mailjet**, serviço de e-mail transacional que opera via HTTPS (porta 443, sempre disponível). Após a migração, o envio passou a funcionar de forma confiável em produção. O módulo de envio foi reescrito usando apenas recursos nativos do Node.js, sem adicionar nenhuma dependência ao projeto.

### 11.2 Coerção de datas e fuso horário

O protocolo HTTP transmite dados em JSON, que não possui tipo nativo para datas. As datas chegavam ao servidor como strings e precisavam ser convertidas. Além disso, o campo de data do navegador emite valores sem informação de fuso — ao construir uma data com hora zero, o JavaScript a interpretava como meia-noite UTC, que no fuso brasileiro (UTC-3) representa o dia anterior. Ordens com data para o dia seguinte eram rejeitadas como "data no passado".

A solução foi padronizar a construção da data com meio-dia local, garantindo que em qualquer fuso brasileiro o resultado UTC ainda represente o mesmo dia calendário.

### 11.3 Deploy em ambiente de produção

O processo de publicar o sistema concentrou uma cadeia de problemas encadeados: versão do Node.js não declarada (o servidor escolheu versão incompatível), bundler de produção ausente (o TypeScript estava configurado para não emitir arquivos), binário nativo do Rollup não instalado na plataforma Linux, diretório de trabalho errado no monorepo, variável de ambiente de build bakeada com valor incorreto e variáveis obrigatórias não configuradas antes do deploy. Cada erro só aparecia após o anterior ser resolvido — padrão característico de primeiro deploy em plataforma nova.

### 11.4 Limitação de infraestrutura gratuita

O plano gratuito do Render hiberna o servidor após 15 minutos de inatividade. O job cron agendado para as 08:00 não dispara se o servidor estiver suspenso nesse horário. A limitação foi mitigada para o período de piloto com o botão de disparo manual disponível na interface. A solução definitiva — plano pago ou serviço de cron externo que mantém o servidor ativo — está planejada antes de uma abertura mais ampla.

---

## 12. Conclusões

O desenvolvimento do Tax Flow demonstra que é viável construir, como projeto de extensão universitária, uma aplicação web multi-tenant funcional e segura que atende a uma necessidade real de profissionais autônomos brasileiros.

A principal decisão arquitetural — adotar multi-tenancy desde o início — mostrou-se acertada: o custo foi concentrado em uma única etapa e eliminou qualquer retrabalho futuro para escalar além do piloto.

O sistema está funcionalmente completo e em produção. O piloto criou sua conta, cadastrou sua empresa e suas ordens, e recebeu lembretes por e-mail — confirmando que o fluxo funciona de ponta a ponta. O frontend, intencionalmente simples e focado em usabilidade básica, cumpriu seu papel de tornar o sistema acessível a um usuário não-técnico sem fricção.

A próxima fase é a coleta estruturada de feedback após pelo menos 30 dias de uso contínuo. Esse ciclo — construir, entregar, observar, ajustar — é o coração do projeto de extensão e o que distingue uma solução técnica de uma solução com impacto comunitário real.

---

## 13. Execução Preliminar — Registros do Piloto

O piloto é prestador de serviços de tecnologia, atuando como PJ. A execução preliminar seguiu estas etapas:

1. **Validação do plano** — apresentação da proposta e confirmação das necessidades. ✅
2. **Entrega do frontend** — interface mínima para uso sem conhecimento técnico. ✅
3. **Cadastro real** — piloto criou conta, cadastrou empresa e ordens reais. ✅
4. **Recebimento de lembretes** — piloto recebeu e-mails de lembrete confirmando o fluxo completo. ✅
5. **Uso contínuo** — piloto utiliza o painel e marca notas como emitidas. Em andamento.
6. **Coleta de feedback estruturada** — ao final de 30 dias de uso. Planejada.

### Registros fotográficos

**Figura 1 — Tela de Empresas (estado inicial, sem empresas cadastradas)**

![Tela de empresas vazia](images/01-empresas-vazia.png)

**Figura 2 — Empresa cadastrada pelo piloto (Data Front)**

![Empresa cadastrada](images/02-empresa-cadastrada.png)

**Figura 3 — Tela de Ordens de Serviço (estado inicial)**

![Tela de ordens vazia](images/03-ordens-vazia.png)

**Figura 4 — Ordem de serviço cadastrada pelo piloto**

![Ordem cadastrada](images/04-ordem-cadastrada.png)

**Figura 5 — E-mail de lembrete recebido pelo piloto (disparo manual)**

![E-mail de lembrete recebido](images/05-email-lembrete-1.png)

**Figura 6 — Painel de Pendências exibindo a ordem próxima do vencimento**

![Painel de pendências](images/06-pendencias.png)

**Figura 7 — Segundo e-mail de lembrete recebido (job automático em teste)**

![Segundo e-mail de lembrete](images/07-email-lembrete-2.png)

### Observações sobre os registros

As figuras acima documentam o ciclo completo de uso: cadastro de empresa (Figuras 1 e 2), registro de ordem de serviço com valor e prazo (Figuras 3 e 4), recebimento do lembrete por e-mail na caixa de entrada do piloto (Figuras 5 e 7) e visualização da ordem no painel de pendências com indicação de urgência "Hoje/Amanhã" (Figura 6). Os e-mails foram enviados pela plataforma Tax Flow via Mailjet e chegaram à caixa de entrada do beneficiário identificados como "Tax Flow".

---

## 14. Documentação e Reflexão sobre o Processo

**Execução preliminar concluída (maio/2026):** o piloto criou sua conta, cadastrou empresa e ordens reais, e recebeu lembretes por e-mail via disparo manual e via job automático (testado em produção com schedule de 5 minutos). O fluxo completo — cadastro, painel de pendências, lembrete por e-mail, marcação como emitida — foi validado em ambiente de produção. Feedback inicial positivo: a interface foi considerada direta e o lembrete útil para o controle mensal de notas.

**Ajuste identificado:** o job cron automático funciona corretamente, mas o plano gratuito do Render hiberna o servidor em períodos de inatividade — se o processo estiver suspenso no horário programado, o disparo não ocorre. Para o ciclo atual, o piloto utiliza o botão de disparo manual disponível na interface. A solução definitiva está planejada antes de uma abertura mais ampla do sistema.

**Aprendizado central:** o principal desafio não foi técnico, mas de infraestrutura: plataformas de hospedagem gratuitas impõem restrições (bloqueio SMTP, hibernação de processos) que não existem em ambiente de desenvolvimento local. Essas restrições exigiram mudanças de abordagem — de SMTP para API HTTPS de e-mail transacional, de job interno para estratégia de manutenção do servidor ativo. Cada obstáculo forçou uma solução mais robusta e mais próxima do que seria adotado em um produto real.

---

## Referências

- ASSUNÇÃO, R. M., & OLIVEIRA, J. P. (2016). *Inclusão digital e alfabetização tecnológica: um estudo de caso.* Salvador: EDUFBA.
- PRESSMAN, R. S. (2019). *Engenharia de software: uma abordagem profissional.* 8. ed. Porto Alegre: AMGH.
- SOMMERVILLE, I. (2011). *Engenharia de Software.* 9. ed. São Paulo: Pearson.
