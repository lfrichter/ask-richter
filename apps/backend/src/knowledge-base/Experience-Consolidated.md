
## BR Now - São Paulo - Brazil
### 🎬 1. Storytelling Profissional (Narrativa de Impacto)

#### 🌪️ **A Situação (O Problema)**
A **BrNow** buscava uma transformação ambiciosa: revolucionar o atendimento ao cliente com uma plataforma de voz inteligente e escalável. O desafio era colossal – criar uma solução de atendimento por voz do zero, que não apenas fosse eficiente, mas também flexível o suficiente para ser oferecida como **SaaS (Software as a Service)**. O cenário inicial era fragmentado, com a necessidade de orquestrar tecnologias complexas como **WebRTC (LiveKit)**, **SIP**, **IA (STT, TTS, LLM)** e **persistência de dados (Supabase)**, tudo isso empacotado em **contêineres Docker** para fácil implantação. A equipe precisava de uma arquitetura que suportasse um "wizard" de autoatendimento para clientes (restaurantes) e um modelo de billing inovador, tudo isso sem comprometer a estabilidade e a capacidade de rápida iteração. Era um terreno fértil para a inovação, mas repleto de complexidades técnicas e operacionais.

#### 🛠️ **A Ação (Minha Estratégia & Execução)**
Fui contratado para desmistificar essa complexidade e construir a espinha dorsal dessa plataforma. Minha estratégia começou com a adoção de um modelo de **microsserviços**, separando claramente as responsabilidades entre um **Controller API** (para orquestração e gerenciamento da infraestrutura) e o **Agent** (o coração do atendimento por voz). Implementei um pipeline de CI/CD robusto com **GitHub Actions** e `pre-commit` hooks para garantir a qualidade do código desde o início, com verificações automáticas de linting, formatação e tipagem.

Para o desafio da orquestração em contêineres, tomei a decisão crucial de migrar para **Docker Swarm**, priorizando a simplicidade, o menor custo e o "time-to-value", mantendo SIP/TURN/WebRTC funcionais. Desenvolvi scripts **idempotentes** para o setup do SIP Inbound/Dispatch, garantindo que a infraestrutura de telefonia fosse provisionada de forma confiável e consistente. Superei obstáculos como conflitos de dependências, erros de autenticação do LiveKit, problemas de "flood protection" no SIP e a otimização de modelos de IA para garantir respostas rápidas e precisas. Para o banco de dados, utilizei o **Supabase**, criando um diagrama ER abrangente e implementando **Row Level Security (RLS)** para garantir o isolamento multi-tenant, um pilar fundamental para o modelo SaaS. A cada passo, priorizei a **observabilidade**, com logs estruturados e healthchecks detalhados, permitindo diagnósticos rápidos e eficientes.

#### 🏆 **O Resultado (Impacto Mensurável)**
O resultado foi a entrega de um **MVP funcional e robusto** da plataforma de atendimento por voz. As **chamadas SIP estavam entrando e sendo atendidas pelo robô de voz**, que conversava de forma inteligente, entendendo pedidos de cardápio e respondendo com informações precisas. O **histórico completo das conversas era salvo**, e o **modelo de billing por minuto de uso** estava integrado e validado, garantindo a monetização do serviço.

Desenvolvemos um sistema que:
*   ✅ **Atendeu chamadas SIP em produção**, com um agente de voz funcionando de ponta a ponta.
*   ✅ Garantiu **isolamento de dados entre clientes (RLS)** e um modelo de billing transparente.
*   ✅ Estabeleceu um **fluxo de desenvolvimento contínuo (CI/CD)** que assegurou a qualidade e a velocidade de entrega.
*   ✅ Criou uma **infraestrutura em Docker Swarm** que permitiu orquestração fácil e escalável.

O projeto estabeleceu as bases para a **BrNow** lançar sua oferta de SaaS de atendimento por voz, transformando a forma como os restaurantes interagem com seus clientes. Meu trabalho garantiu que o sistema não apenas funcionasse, mas que fosse construído sobre princípios sólidos de engenharia, preparando-o para futuras expansões e inovações.

---

### 🎭 2. Papéis Desempenhados

*   🚀 **Arquiteto de Soluções Cloud/SaaS** — Definição da arquitetura de microsserviços, escolha de tecnologias para orquestração (Docker Swarm) e design do modelo de dados multi-tenant no Supabase.
*   💻 **Desenvolvedor Backend Sênior (Python/FastAPI)** — Implementação das APIs Controller e Agent, integração com LiveKit, STT (Deepgram), TTS (ElevenLabs, OpenAI) e LLM (OpenAI), e desenvolvimento de lógica de negócio e billing.
*   ⚙️ **Engenheiro de DevOps/Infraestrutura** — Configuração de ambientes Docker Compose, gerenciamento de dependências, criação de pipelines CI/CD com GitHub Actions, scripts de provisionamento idempotentes e healthchecks de serviços.
*   📊 **Analista de Sistemas** — Elaboração de diagramas ER, especificação de tabelas no Supabase, definição de padrões de codificação e estratégias de teste, e análise de requisitos para o "wizard" de autoatendimento.
*   🔍 **Especialista em Debug/Troubleshooting** — Identificação e resolução de problemas complexos em integrações LiveKit/SIP, autenticação de tokens, conflitos de dependência e erros de configuração de IA.

---

### 🧗 3. Desafios & Soluções

*   **⚙️ Desafio:** Orquestração de múltiplos serviços em contêineres (LiveKit, lk-sip, Redis, coturn, Agent) com dependências e configurações interligadas.
    *   **Solução:** Implementação de `docker-compose.yml` abrangente, uso estratégico de `host-mode` para serviços SIP, e desenvolvimento de scripts de setup idempotentes (`lk_sip_setup.sh`) para garantir consistência. Migração para Docker Swarm para simplificar a orquestração e reduzir a complexidade inicial.
    *   **Resultado:** Ambiente de desenvolvimento e produção padronizado e facilmente reproduzível, com todos os serviços subindo corretamente e SIP funcional.

*   **🔑 Desafio:** Autenticação e autorização em tempo real com LiveKit, incluindo a geração e validação de tokens JWT para a conexão do agente à sala SIP.
    *   **Solução:** Debug detalhado da geração de tokens em `_make_join_token` no `http_server.py`, garantindo que os `grants` (especialmente `room_join=True` e `room=room.name`) e `identity` estivessem corretos e alinhados com a API do LiveKit. Adição de logs verbosos para inspecionar os payloads JWT.
    *   **Resultado:** Conexão bem-sucedida do agente à sala LiveKit, eliminando erros `401 Unauthorized`.

*   **📞 Desafio:** Configuração do LiveKit SIP Gateway para aceitar chamadas de softphones e lidar com "flood protection".
    *   **Solução:** Ajustes no `sip-config.yaml` e desativação da proteção contra flood via variáveis de ambiente (`SIP_FLOOD_ENABLED=false`, `SIP_RATE_LIMITING_ENABLED=false`) para o ambiente de desenvolvimento. Configuração correta de mapeamento de portas UDP/TCP.
    *   **Resultado:** Chamadas SIP de teste foram aceitas e roteadas com sucesso para as salas LiveKit, sem serem bloqueadas pela proteção contra flood.

*   **🧠 Desafio:** Integração de múltiplos provedores de IA (Deepgram para STT, ElevenLabs/OpenAI para TTS, OpenAI para LLM) com suas APIs e SDKs específicos, lidando com diferentes modelos e possíveis indisponibilidades.
    *   **Solução:** Unificação de dependências em `requirements.txt`, uso de `aiohttp.ClientSession` para otimizar chamadas HTTP assíncronas, e implementação de fallback robusto para TTS (ex: `gpt-4o-mini-tts` para `tts-1/alloy` quando o primeiro falhou) e STT.
    *   **Resultado:** Agente de voz com capacidade de fala (TTS) e escuta (STT) funcional, usando modelos de IA compatíveis e resilientes.

*   **📊 Desafio:** Modelagem de dados para um sistema multi-tenant SaaS no Supabase, incluindo contas de cliente, negócios, agentes, menus, sessões de chamada e um sistema de billing por minuto.
    *   **Solução:** Criação de um diagrama ER detalhado com 9 tabelas (accounts, businesses, agents, menus, services, script_templates, call_sessions, orders, transactions). Implementação de `Row Level Security (RLS)` para garantir o isolamento dos dados entre os tenants e lógica de trigger para atualização de saldo pós-chamada.
    *   **Resultado:** Banco de dados robusto e seguro para o modelo SaaS, suportando as funcionalidades de wizard, billing e gerenciamento de dados do cliente.

*   **🔁 Desafio:** Garantir a estabilidade e qualidade do código em um ambiente de desenvolvimento ágil com integrações complexas.
    *   **Solução:** Implementação de `pre-commit` hooks (ruff, black, pyupgrade, mypy) para automatizar a verificação de qualidade do código. Uso de `GitHub Actions` para CI/CD, incluindo linting, testes de unidade e verificação de tipagem antes de qualquer merge.
    *   **Resultado:** Aumento significativo da qualidade do código, redução de bugs e agilidade no desenvolvimento, com um processo de revisão de código mais eficiente.

---

### 📅 4. Linha do Tempo (Histórico Resumido)

🗓️ **Ago/2025 (Início do Projeto) — Fase de Descoberta e Setup Inicial**
📌 Compreensão do desafio de construir o Voice Support como SaaS. Definição da arquitetura de microsserviços (Controller/Agent) e setup inicial de ambiente Docker Compose. Modelagem inicial do banco de dados no Supabase.

🗓️ **20-22 Ago/2025 — Infraestrutura de Voz e Dados**
🚀 Consolidação da infra de voz (Caddy, Nginx, LiveKit, Redis, coturn) com HTTPS/TLS e healthchecks. Criação do diagrama ER final para o Supabase, incluindo RLS, billing e tabelas para multi-tenancy.

🗓️ **25-26 Ago/2025 — Integração e Testes End-to-End**
⚙️ Implementação e debug da integração do agente com LiveKit (join/leave, timeout, retry). Testes ponta a ponta com softphone (X-Lite) para validar o fluxo de atendimento SIP, STT, LLM e TTS. Validação do histórico de chamadas e fluxo de billing.

🗓️ **28-29 Ago/2025 — Refinamento do Agente e Pipeline de Voz**
🛠️ Resolução de conflitos de dependências e ajustes em `Dockerfile` e `requirements.txt`. Criação de `runner.py` para orquestração de sessões e `http_server.py` para webhooks e geração de tokens LiveKit. Debug de autenticação e comunicação com provedores de IA.

🗓️ **01-03 Set/2025 — Estabilização da Infra e Testes SIP**
📞 Resolução de conflitos de versão do `livekit-agents` e `websockets`. Configuração do LiveKit SIP Gateway para aceitar chamadas. Implementação de `lk_sip_setup.sh` idempotente para provisionamento automático de SIP Trunks e Dispatch Rules. Testes extensivos de chamadas SIP.

🗓️ **04-05 Set/2025 — Evolução do Modelo de Dados e Controller API**
📊 Análise e adaptação ao novo modelo de banco de dados (`cad_empresa`, `cad_cliente`, `saas_usuarios`) sugerido pelo PO. Definição clara das responsabilidades entre Controller e Agent APIs, com o Controller gerenciando o provisionamento de SIP e o Agent o atendimento. Implementação do `post_setup` no Controller.

🗓️ **08 Set/2025 — Finalização do Controller e Segurança**
🔒 Separação definitiva de responsabilidades (Controller para `/provision`, Agent para `/session/start`). Padronização do uso de números de telefone para SIP. Implementação de validação HMAC (`X-Signature`) e logs estruturados em JSON para diagnósticos. Consolidação da documentação e smoke tests.

---

### 🛠️ 5. Tabela de Tecnologias Utilizadas

| Tecnologia             | Categoria                 | Frequência de Uso | Contexto de Uso                                                                    |
| :--------------------- | :------------------------ | :---------------- | :--------------------------------------------------------------------------------- |
| Python 3.12            | Backend / Linguagem       | Alta              | Desenvolvimento das APIs Controller e Agent, lógica de IA e integrações.           |
| FastAPI                | Backend / Framework       | Alta              | Criação de APIs RESTful com documentação OpenAPI e validação Pydantic.           |
| Uvicorn                | Backend / Servidor Web    | Alta              | Servidor ASGI para o FastAPI.                                                      |
| Docker                 | DevOps / Containerização  | Alta              | Contêinerização de todos os serviços (Agent, LiveKit, SIP, Redis, coturn).       |
| Docker Compose         | DevOps / Orquestração     | Alta              | Definição e execução de ambientes de desenvolvimento e produção multi-serviço.    |
| Docker Swarm           | DevOps / Orquestração     | Média             | Estratégia de orquestração para escalabilidade e gerenciamento simplificado.       |
| Supabase               | Banco de Dados / Baas     | Alta              | Persistência de dados (Postgres), autenticação, RLS e gerenciamento de storage.   |
| PostgreSQL             | Banco de Dados            | Alta              | Core do Supabase, utilizado para modelagem de dados e queries SQL.                 |
| LiveKit                | WebRTC / Mídia            | Alta              | Gerenciamento de sessões de áudio/vídeo, roteamento SIP e tokens de acesso.       |
| `livekit-agents`       | Backend / SDK             | Alta              | SDK Python para desenvolvimento de agentes de voz no LiveKit.                      |
| `livekit/sip`          | Infra / Gateway SIP       | Alta              | Gateway para integração de chamadas SIP com LiveKit.                               |
| coturn                 | Infra / Servidor TURN/STUN| Alta              | Gerenciamento de NAT Traversal para conectividade WebRTC.                          |
| Redis                  | Banco de Dados / Cache    | Alta              | Cache de locks de concorrência e gerenciamento de sessões.                         |
| Deepgram               | IA / STT                  | Alta              | Provedor de Speech-to-Text para transcrição de áudio em tempo real.               |
| ElevenLabs             | IA / TTS                  | Média             | Provedor de Text-to-Speech para síntese de voz natural.                            |
| OpenAI                 | IA / LLM / TTS            | Alta              | Provedor de Large Language Model para lógica conversacional e TTS fallback.        |
| GitHub Actions         | DevOps / CI/CD            | Alta              | Automação de pipelines de integração e entrega contínua.                           |
| `pre-commit`           | Qualidade de Código       | Alta              | Ganchos para formatação (Black), linting (Ruff), tipagem (Mypy) antes do commit.   |
| `pytest`               | Qualidade de Código       | Alta              | Framework de testes de unidade e integração.                                       |
| `httpx`                | Backend / Biblioteca HTTP | Alta              | Cliente HTTP assíncrono para comunicação entre serviços e APIs externas.           |
| `pydantic`             | Backend / Validação       | Alta              | Validação de dados em modelos e schemas de API.                                    |
| `python-dotenv`        | Backend / Configuração    | Alta              | Gerenciamento de variáveis de ambiente.                                            |
| `backoff`              | Backend / Resiliência     | Média             | Implementação de retries com backoff em chamadas a serviços externos.              |
| Mermaid                | Documentação / Diagramas  | Média             | Criação de diagramas ER e fluxogramas para documentação de arquitetura.            |
| `curl`                 | Ferramenta                | Alta              | Testes rápidos e interação com APIs e serviços.                                    |
| `jq`                   | Ferramenta                | Média             | Processamento de JSON em linha de comando.                                         |
| `sngrep`               | Ferramenta                | Baixa             | Monitoramento de sessões SIP para debug de telefonia.                              |

---

### Resumo Executivo

O projeto EuPizza na BrNow foi um desafio transformador: construir uma plataforma SaaS de atendimento por voz desde a concepção até um MVP funcional. Através de uma arquitetura robusta de microsserviços em Docker Swarm, integrei LiveKit, SIP e IA de ponta (Deepgram, ElevenLabs, OpenAI), desenvolvendo um agente de voz inteligente capaz de atender chamadas SIP, gerenciar o diálogo e persistir dados no Supabase com isolamento multi-tenant. O resultado foi um sistema que não apenas solucionou o problema crítico de automação de atendimento por voz, mas também estabeleceu uma base escalável e segura para a oferta de SaaS da BrNow, com pipelines de CI/CD garantindo qualidade e agilidade contínuas. Meu trabalho entregou um produto com impacto tangível, demonstrando expertise em arquitetura, desenvolvimento backend, DevOps e integração de IA.
## Plugae - São Paulo - Brazil
### A Jornada na Plugae: Do Código à Arquitetura de Integração

Sua jornada na Plugae foi a de um arquiteto e desenvolvedor de software no epicentro do e-commerce, um papel crucial que vai além da simples codificação para abranger a espinha dorsal tecnológica que conecta múltiplos sistemas e clientes. Você foi responsável por construir e manter o "Spider", um sistema de integração (hub) que centralizava as operações de e-commerce para uma variedade de clientes, cada um com suas próprias necessidades e sistemas.

A história começa no final de 2017, com um foco intenso na importação massiva de dados e no estabelecimento de fluxos de integração para clientes como **Ultrabrands** e **Novo Século**. Desde o início, o desafio era claro: lidar com grandes volumes de dados de diferentes fontes (Pluggto, Skyhub, Bling) e garantir que as informações de pedidos, produtos e estoque fluíssem de forma consistente e confiável. Documentos como "Plugae - Jobs 24-11-2017.md" mostram a execução de importações que movimentaram milhares de pedidos em um único dia.

Ao longo de 2018, seu papel evoluiu. Além da manutenção e otimização dos fluxos existentes, você se dedicou a refatorar códigos, construir novas funcionalidades, como um sistema de "Conta Corrente" (Plugae - INDT - Conta corrente.md), e documentar processos para a equipe, como visto na criação do `LogTrait` (Plugae - LogTrait.md). Este período também foi marcado pela integração de novos clientes, como **ShopUD**, **Redes de Dormir**, **BadBoy** e **Lonas para Esteiras**, e pela resolução de desafios complexos, como a correção de dados em massa no MongoDB e a gestão de produtos com SKUs inválidos.

### Classificação Técnica da Sua Atuação

#### **Software Development & Architecture**
Você atuou como um desenvolvedor full-stack com um forte foco no backend, construindo a lógica central do sistema de integração.

*   **Stacks e Metodologias:**
    *   **Backend:** O uso de `Artisan`, `Jobs`, `Controllers` e a estrutura de diretórios (`App\Console\Commands\Traits\LogTrait`) indicam o uso do framework **PHP Laravel**.
    *   **Arquitetura:** Você projetou e implementou uma arquitetura orientada a serviços e eventos. O sistema era composto por múltiplos processos que reagiam a webhooks (de Bling e Pluggto) e se comunicavam através de uma robusta **arquitetura de filas (Queues)** para processamento assíncrono de tarefas, como importação de pedidos e atualização de estoque (Plugae - Spider - Estoque.md, Plugae - Spider - Pedidos em fila.md).
    *   **Padrões Utilizados:** O código demonstra o uso de padrões como `Traits` para reutilização de código (`LogTrait`), `Commands` para tarefas de linha de comando, e uma clara separação de responsabilidades entre controladores, jobs e serviços.

#### **Integrações, API RESTFul & Data Management**
Esta foi a área central de sua atuação, orquestrando o fluxo de dados entre múltiplos sistemas.

*   **Hubs e Serviços de Integração:**
    *   **Plataformas (Hubs):** Você integrou a plataforma Spider com os principais hubs de marketplace do mercado, incluindo **Plugg.to** e **Skyhub**.
    *   **ERPs e Serviços:** Realizou integrações profundas com o ERP **Bling** e com sistemas proprietários de clientes, como o banco de dados MySQL do cliente **Novo Século** (Plugae - Novo Século.md).
*   **Desenvolvimento de API:**
    *   Você consumiu extensivamente APIs REST de terceiros (Pluggto, Bling, Skyhub) para buscar e atualizar dados de produtos, pedidos, notas fiscais e estoque.
    *   Você também desenvolveu endpoints de API para receber webhooks, servindo como o ponto de entrada para notificações de sistemas externos (Plugae - Spider - Bling Webhook.md).
*   **Gestão de Dados:**
    *   **ETL (Extração, Transformação e Carga):** Uma de suas principais responsabilidades era criar scripts e processos para extrair dados de uma fonte, mapeá-los e normalizá-los para o formato de outra. O arquivo "Plugae - Orders - 1 Command para Importação da collection.md" é um exemplo claro desse trabalho de mapeamento detalhado entre os campos da Pluggto e do Bling.
    *   **Bases de Dados:** Você demonstrou proficiência em **MongoDB**, que era o banco de dados central do Spider, escrevendo queries complexas para manutenção, consulta e correção de dados (Plugae - Mongo - Fix column `expected_delivery_date`.md). Também trabalhou com **MySQL** para a integração com o ERP do Novo Século e teve contato com **SQLite** em configurações legadas.

#### **Desafios e Soluções**
A integração de múltiplos sistemas em e-commerce é repleta de desafios, e você esteve na linha de frente para resolvê-los.

*   **Qualidade e Inconsistência dos Dados:** Um desafio constante foi lidar com dados inconsistentes ou mal formatados das fontes.
    *   **Exemplo:** Produtos com SKUs inválidos (`0078 - preto / 0079 - roxo ...`), produtos duplicados ou sem cliente associado (Plugae FolowUp.md, Plugae - Pluggto - Atualização preço.md).
    *   **Solução:** Você criou scripts para identificar e corrigir esses problemas, como a remoção de produtos inválidos dos jobs de sincronização e a criação de planilhas para identificação manual pelos clientes.
*   **Integração com Sistemas Legados:** A conexão com o ERP do cliente Novo Século exigiu a criação de uma conexão direta com seu banco de dados MySQL, desenvolvendo um processo de importação customizado (Plugae - Jobs 24-11-2017.md).
*   **Gestão de Grandes Volumes:** A importação inicial de clientes como a Ultrabrands envolvia milhares de pedidos. A solução foi processá-los em lotes e utilizar filas para não sobrecarregar o sistema (Plugae - Jobs 24-11-2017.md).
*   **Sincronização de Estoque em Tempo Real:** Manter o estoque sincronizado entre o ERP (Bling, BDI), o Spider e múltiplos marketplaces (Pluggto, Skyhub) é uma tarefa crítica e complexa.
    *   **Solução:** Você desenvolveu uma arquitetura baseada em webhooks e filas dedicadas (`pluggto`, `skyhub`, `bling`) para garantir que as atualizações de estoque fossem processadas de forma rápida e assíncrona, minimizando o risco de vender produtos indisponíveis (Plugae - Spider - Estoque.md, Plugae - Spider - Stock in queue 📦.md).

#### **System Administration & DevOps**
Embora não fosse o foco principal, você realizou tarefas essenciais de DevOps.

*   **Gestão de Servidores:** Você tinha conhecimento do ambiente de produção, incluindo o IP do servidor e comandos para reiniciar serviços (`dc restart`), provavelmente **Docker Compose** (última semana de novembro.md).
*   **Automação:** Configurou webhooks no Bling e agendou tarefas via **cron** para os processos de importação.
*   **Monitoramento:** A criação da `LogTrait` foi um passo fundamental para o monitoramento e a depuração das operações complexas que ocorriam no sistema (Plugae - LogTrait.md).

#### **Leadership & Agile Project Management**
Sua atuação também demonstrou habilidades de liderança técnica e organização.

*   **Liderança e Coaching:** Você não apenas codificou, mas também habilitou a equipe criando documentação técnica clara sobre como usar componentes (`LogTrait.md`) e serviços (`INDT - Conta corrente.md`). Isso mostra uma preocupação com a escalabilidade do conhecimento e a qualidade do código da equipe.
*   **Gestão de Projetos:** O uso de **Jira** (com referências a tickets como SPIDER-36, SPIDER-43, SPIDER-86) e a estrutura dos arquivos de acompanhamento (`Plugae FolowUp.md`, `última semana de novembro.md`) indicam trabalho dentro de uma metodologia ágil, com organização de tarefas, definição de prioridades e acompanhamento de status.

### Clientes e Projetos
Você trabalhou com um portfólio diversificado de clientes, incluindo: **Ultrabrands, Novo Século, Redes de Dormir, ShopUD, ILS, Mednutrition, Intergraus, Icone Mobile, Amo Ler, BadBoy, Lonas para Esteiras, Saldão Jeans, Octávio Café, e RKV.**
