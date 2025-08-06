---
status: permanent
tags:
  - particular/Curriculo/History
  - AI/Gemini25Pro
---

### Gerenciador de Tarefas Conversacional via E-mail  📥  Postmark Challenge
*Junho de 2025 – Junho de 2025*
Desenvolvi este projeto como uma entrada para o **Postmark Challenge da Dev.to**, com o objetivo de resolver um problema comum de produtividade: a transferência manual de tarefas que surgem em e-mails para uma lista de afazeres separada. A solução transforma a caixa de e-mail em uma interface de gestão, permitindo ao usuário criar, atualizar e concluir tarefas simplesmente enviando ou respondendo e-mails com comandos simples (ex: `#prioridade`).

**Principais realizações técnicas:**

- **Processamento de E-mails com Webhooks:** Utilizei **Postmark Inbound Webhooks** para receber e interpretar e-mails em tempo real. Cada e-mail recebido aciona um evento na aplicação Laravel, iniciando o fluxo de processamento da tarefa.
- **Motor de Comandos Customizado:** Criei um processador de comandos em Laravel que analisa o corpo do e-mail em busca de "hashtags" de ação (`#comentario`, `#concluir`), executando a lógica de negócio correspondente e mantendo o histórico da tarefa como uma "conversa" via e-mail.
- **Frontend Reativo com Livewire:** Desenvolvi a interface web para visualização das tarefas com **Livewire** e **Tailwind CSS**, permitindo a atualização dinâmica dos componentes sem a necessidade de uma SPA pesada, oferecendo uma experiência de usuário rápida e moderna.
- **Qualidade e Testes com Pest:** Garanti a robustez e a confiabilidade do processador de comandos e das regras de negócio com uma suíte de testes completa escrita em **Pest**.

🎬 **Apresentação:** https://www.youtube.com/watch?v=NDFgcH2X1ZI

**Tecnologias:** Laravel | Livewire | Tailwind CSS | Pest | Postmark API | Webhooks | Arquitetura Orientada a Eventos

---
### Cache Semântico de Alta Performance para Otimização de LLMs 🗄️ (PoC) 

*Junho de 2025 – Junho de 2025*

Desenvolvi uma Prova de Conceito (PoC) de um cache semântico de alta performance para otimizar interações com Modelos de Linguagem Grandes (LLMs). O objetivo era reduzir drasticamente a latência e os custos computacionais ao reutilizar respostas para perguntas semanticamente equivalentes, com uma arquitetura 100% local e sem dependências de APIs externas.

**Principais realizações técnicas:**

- **Busca Vetorial de Alta Velocidade:** Utilizei a biblioteca **FAISS** (Facebook AI Similarity Search) para criar um índice vetorial em memória, permitindo buscas por similaridade semântica em altíssima velocidade, próximas do instantâneo.
- **Geração de Embeddings 100% Local:** Integrei o **Ollama** para gerar os embeddings (vetores) das perguntas localmente, eliminando a necessidade de APIs externas, o que garante a privacidade dos dados e zera os custos de requisição.
- **Lógica de Cache Inteligente (Hit/Miss):** Implementei o núcleo do sistema que, com base em um limiar de similaridade, decide se retorna uma resposta do cache (Cache Hit) ou aciona o LLM para uma nova resposta (Cache Miss), armazenando-a para uso futuro.
- **Resultado de Performance:** A PoC validou com sucesso a capacidade de acelerar drasticamente o tempo de resposta para perguntas recorrentes ou parafraseadas, melhorando a experiência do usuário e reduzindo o uso de recursos computacionais.

**Tecnologias:** Python | FAISS | Ollama | NumPy

---
### Twin Quest 🚀 Desafio Full-Stack com IA Generativa (Stack LVTPP)
*Maio de 2025 – Maio de 2025*

Desenvolvi o "Twin Quest" como um projeto de desafio pessoal para demonstrar a construção de uma aplicação moderna e integrada de ponta a ponta, utilizando o stack LVTPP (Laravel, Vue, TypeScript, Pinia, Pest) e explorando o uso de IA Generativa.

A aplicação utiliza IA Generativa para criar duas interpretações textuais únicas e criativas ("gêmeas") a partir de um tema inserido pelo usuário, explorando técnicas de Engenharia de Prompt para garantir resultados de alta qualidade.

**Principais realizações técnicas:**

- **Implementação Full-Stack Coesa:** Construí o backend com **Laravel**, servindo uma API RESTful, e o frontend com **Vue 3 (Composition API)**, utilizando **TypeScript** para garantir a tipagem e a segurança do código em toda a aplicação.
- **Gerenciamento de Estado Reativo:** Utilizei **Pinia** para um gerenciamento de estado centralizado e reativo no frontend, criando uma experiência de usuário fluida ao receber e exibir os dados da IA.
- **Qualidade e Testes Automatizados:** Garanti a confiabilidade da API e da lógica de negócio com uma suíte de testes robusta escrita com **Pest**, seguindo as melhores práticas de desenvolvimento orientado a testes (TDD).
- **Integração com IA:** Orquestrei a comunicação com a API de IA Generativa no backend, com foco em uma engenharia de prompts eficiente para gerar as duas respostas distintas e criativas que dão nome ao projeto.

🖇️ **Código-fonte:** [https://github.com/lfrichter/twin-quest](https://github.com/lfrichter/twin-quest)
🎬 **Apresentação:** [Assesment Twin Quest](http://www.youtube.com/watch?v=JKFs6_091-A)

**Tecnologias:** Laravel | Vue 3 (Composition API) | TypeScript | Pinia | Pest | Engenharia de Prompt | IA Generativa

---

### Air Combat 3D 🎮 Estudo de Caso sobre Produtividade com IAs de Desenvolvimento
*Abril de 2025 – Abril de 2025*

Este projeto foi um estudo de caso prático para mensurar o impacto de IDEs baseadas em IA (Cursor, Trae) na velocidade e eficiência do desenvolvimento full-stack. O objetivo não era apenas criar um jogo, mas validar como a IA pode acelerar a prototipagem, mantendo a qualidade do código e reduzindo o tempo de entrega.

O resultado da experimentação foi uma **redução de aproximadamente 40% no tempo de desenvolvimento** em comparação com um fluxo de trabalho tradicional.

**Prova de Conceito Desenvolvida:** Como resultado prático do estudo, entreguei um jogo 3D de combate aéreo multiplayer funcional, com as seguintes características implementadas com o auxílio da IA:

- **Renderização 3D Interativa:** Utilizei **Three.js** para criar o ambiente do jogo, renderizar os aviões e gerenciar a câmera e os controles.
- **Backend para Comunicação em Tempo Real:** Construí um servidor com **Node.js, Express e WebSockets** para gerenciar a lógica de matchmaking e sincronizar as ações de combate entre os jogadores.
- **Infraestrutura e Deploy Modernos:** Utilizei **Docker** para conteinerizar a aplicação e realizei o deploy na plataforma **Render.com**, completando o ciclo de desenvolvimento de ponta a ponta.

**Links e Demonstrações**
🕹️ Jogar online: https://air-combat-3d-game.onrender.com  

**Tecnologias & Metodologia:** JavaScript | Three.js | Node.js | Express | WebSocket | Docker | Render.com | IA Generativa (Cursor, Trae)

---
### Kpro After Sales: API para Otimização de Processos de Pós-Venda
*Associado à Full Comms*
*Novembro de 2021 – Maio de 2022*

Atuando como desenvolvedor backend e em colaboração com o Arquiteto de Soluções, desenvolvi a camada de API RESTful para otimizar e centralizar todo o fluxo de pós-venda da Kpro, abrangendo programas de aluguel, vendas e compras compartilhadas. A API serviu como o núcleo central para gerenciar checklists, documentos e o ciclo de vida de equipamentos.

**Principais realizações técnicas:**

- **Otimização de Performance em 30%:** Realizei a otimização de consultas (query tuning) e implementei estratégias de cache, resultando em uma **melhoria de aproximadamente 30%** no tempo de resposta dos endpoints críticos da aplicação.

- **Alta Cobertura de Testes (~80%):** Garanti a estabilidade da aplicação e a redução de regressões ao desenvolver uma suíte de testes automatizados com PHPUnit que atingiu **cerca de 80% de cobertura** do código.

- **Documentação e Onboarding Acelerado:** Elaborei a documentação completa da API utilizando o padrão Swagger/OpenAPI, o que **acelerou a integração e o onboarding da equipe de frontend** que desenvolvia a interface em Vue.js.

- **Desenvolvimento da API em Laravel Lumen:** Construí os endpoints, implementei as regras de negócio e realizei a integração com serviços externos, seguindo as melhores práticas de design de APIs para garantir uma solução robusta e escalável.


**Time e Colaboração:**
- Aníbal – Arquiteto de Soluções  
- Martin Glover e Amar Jit Attri – Frontend em Vue.js

**Tecnologias:** Laravel Lumen | PHP | MySQL | PHPUnit | Swagger (OpenAPI)

---
### Shosales Review 🏠Otimização de Performance (10x) e Testes E2E

Associado a: Full Comms (Abril de 2021 – Agosto de 2021)

Atuei na modernização de uma aplicação legada de avaliações de imóveis, com foco em duas frentes principais: otimização radical de performance e a implementação de uma suíte robusta de testes automatizados de ponta a ponta (E2E) para garantir a qualidade e a estabilidade do sistema.

**Principais realizações técnicas:**

- **Otimização de Performance (10x):** Aumentei em **10 vezes a velocidade** da página de imóveis, reduzindo o tempo de carregamento de ~5s para ~0.5s. Isso foi alcançado através da **redução do número de queries de 37 para apenas 4**, criação de índices e ajustes finos no ORM. _(Veja a prova gráfica: [Antes](https://i.imgur.com/E5qvKDq.png) vs. [Depois](https://i.imgur.com/cGmz1Aq.png)).

- **Suíte de Testes E2E Multi-plataforma:** Desenvolvi um conjunto completo de testes automatizados com **Laravel Dusk**, garantindo a cobertura dos fluxos de usuário mais críticos. Os testes eram executados em paralelo em múltiplos navegadores e dispositivos (via **CrossBrowserTesting**).
- 
- **Integração Contínua (CI/CD) e Qualidade de Código:** Integrei a suíte de testes ao pipeline de CI/CD (**GitHub Actions / Jenkins**) para execução automática a cada build. Isso eliminou regressões em produção e permitiu que a equipe refatorasse o código legado com muito mais segurança.

**Tecnologias:** Laravel (PHP) | MySQL | Redis | Laravel Dusk | CrossBrowserTesting | GitHub Actions | Jenkins

---
### Huktup 💳 Plataforma de Agendamento e Gestão para Provedores de Serviço

Associado a: Evoke Mobile (Agosto de 2020 – Abril de 2021)

Desenvolvi o backend e os principais fluxos de uma plataforma completa que permite a provedores de serviço gerenciar agendamentos, ofertas de produtos e a comunicação com clientes. A solução centraliza desde a reserva e o pagamento até a análise de resultados em um dashboard interativo.

**Principais realizações técnicas:**

- **API Robusta e Dashboard Analítico:** Construí a API RESTful em **Laravel** como o núcleo da plataforma e desenvolvi um dashboard analítico com **Vue.js** e **Chart.js**. O painel exibia gráficos de faturamento, reservas e aquisição de clientes com filtros dinâmicos e drill-down.
  
- **Comunicação Automatizada via SMS (Twilio):** Implementei a integração com a **Twilio** para criar fluxos de conversa automatizados, enviando lembretes de agendamento, alertas transacionais e coletando feedback dos clientes via SMS.
  
- **Autenticação e Gestão de Provedores:** Integrei o **Firebase Authentication** para um processo de onboarding seguro com gerenciamento de usuários e Single Sign-On (SSO). Desenvolvi também o portal administrativo para a gestão completa dos provedores de serviço.
  
- **Qualidade e Colaboração com as Equipes:** Trabalhei em estreita colaboração com a profissional de QA (Lauren Mather) para definir cenários de teste e validar correções. Elaborei a documentação da API com **Swagger** para acelerar a integração do time de frontend.

**Tecnologias:** Laravel (PHP) | Vue.js | Chart.js | MySQL | Twilio API | Firebase Authentication | Docker

---

### Toot 🚘 Otimização de Geodata (30x) e API para Market Intelligence

Associado a: Evoke Mobile (Março de 2020 – Março de 2021)

Como desenvolvedor backend da equipe, fui responsável por desenvolver as APIs em Laravel para uma plataforma de Market Intelligence com dashboards e mapas geoespaciais. Meu principal desafio e realização foi identificar e resolver um gargalo crítico de performance ao carregar mais de 200.000 pontos em mapas interativos.

**Principais realizações técnicas:**

- **Otimização de Performance Geoespacial (30x):** Aumentei em **30 vezes a velocidade** de interação com os mapas (zoom/pan), reduzindo o tempo de resposta de ~15s para ~0.5s. Isso foi possível após uma investigação técnica que levou à implementação da biblioteca **Superfetch** para carregamento progressivo e renderização inteligente dos dados.
  
- **API para Análise de Dados e BI:** Desenvolvi os endpoints em Laravel/MySQL que replicavam a complexa lógica de filtragem de relatórios do **PowerBI**, fornecendo a base de dados para o frontend em React. A API foi documentada com **Swagger** para facilitar a integração.
  
- **Colaboração Full-Stack e Entrega Contínua:** Trabalhei em estreita colaboração com os desenvolvedores React (Raúl Sáez, Aditya Bevoor) e a equipe de QA (Lauren Mather), utilizando pipelines de CI para garantir a entrega contínua de uma plataforma estável e com alta usabilidade.

**Demonstrações**
- Power BI Scaffold: https://youtu.be/seU3VySGN9M  
- Market Intelligence Platform: https://youtu.be/qs2nnbvytbg  

**Tecnologias:** Laravel (PHP) | MySQL | React | Google Maps API | Superfetch | PowerBI (integração) | PHPUnit | Swagger | CI/CD

---
### Fanoty ⚽  Modernização de Backend e Otimização de API para App de Esportes

Associado a: Evoke Mobile (Maio de 2019 – Maio de 2020)

Atuei como o principal desenvolvedor backend na modernização da API que suportava o aplicativo iOS "Fanoty". Trabalhando em sprints semanais com o Desenvolvedor iOS (Alex Jackson) e a Gerente de Projetos (Emma Fairlie), meu foco foi em otimizar a integração de dados de esportes, aumentar a estabilidade do sistema e implementar um pipeline de CI/CD.

**Principais realizações técnicas:**

- **Otimização da Integração de Dados (50% mais rápido):** Reescrevi completamente o processo de importação de dados da **API da OPTA Sports**, reduzindo o tempo de ingestão em **aproximadamente 50%** e eliminando inconsistências nos placares e estatísticas em tempo real.

- **Automação de Deploy com CI/CD:** Configurei um pipeline de entrega e implantação contínua com **GitHub Actions** e **Docker**. Isso automatizou os testes e os deploys, garantindo entregas mais rápidas e seguras, com a possibilidade de rollback imediato.

- **Aumento da Confiabilidade da API:** Resolvi bugs críticos que causavam falhas na sincronização de placares e em endpoints de estatísticas, aumentando significativamente a estabilidade e a confiança dos usuários no aplicativo.

- **Modernização e Segurança do Framework:** Realizei a atualização do backend de **Laravel 5.0 para 5.1**, aplicando as melhores práticas de segurança e performance da nova versão e facilitando a manutenção futura do código.

**Tecnologias:** Laravel 5.1 | PHP | MySQL | OPTA Sports API | GitHub Actions | Docker | PHPUnit


---
###
### Toot 🚘 Arquitetura Assíncrona para Processamento de Jornadas (500x Mais Rápido)

Associado a: Evoke Mobile (Maio de 2019 – Agosto de 2019)

Desenvolvi a arquitetura de backend para uma aplicação móvel que analisa rotas de motoristas em tempo real para pontuar eventos de direção (velocidade, frenagem, etc.). O desafio principal era processar um volume massivo de eventos por jornada de forma escalável e com latência mínima para o usuário.

**Principais realizações técnicas:**

- **Otimização de Performance (500x):** Migrei o processamento de síncrono para assíncrono utilizando filas (queues) com Redis, o que resultou em respostas para os dispositivos móveis (iOS e Android) até **500 vezes mais rápidas**, garantindo uma experiência de usuário fluida e sem bloqueios.
- **Arquitetura de Processamento com Micro-Jobs:** Reestruturei o núcleo de cálculo em jobs independentes para cada etapa (chamadas a APIs do Google Maps/Overpass, cálculos de pontuação). Utilizei **Laravel Horizon** para monitorar e gerenciar as filas em tempo real, permitindo alta capacidade de processamento.
- **Escalabilidade para Alto Volume de Dados:** A arquitetura assíncrona permitiu o processamento paralelo de **centenas de milhares de eventos por jornada**, garantindo a escalabilidade do sistema para uma grande base de usuários.
- **Qualidade e Automação em CI/CD:** Criei testes unitários e de integração para cada job e endpoint, integrados a um pipeline de CI/CD com **GitHub Actions** e **Docker**, assegurando a confiabilidade e a entrega segura de cada nova funcionalidade.

**Tecnologias:** Laravel (PHP) | Redis | Laravel Horizon | Google Maps API | Overpass API | PHPUnit/Pest | GitHub Actions | Docker


---

### Grappl 👺 Modernização de API e Entrega Rápida de Funcionalidades

Associado a: Evoke Mobile (Junho de 2019 – Julho de 2019)

Em um projeto focado de curta duração (2 meses), atuei diretamente com o CEO da Evoke Mobile (Dave Brown) para modernizar a API e entregar novas funcionalidades críticas para a plataforma "Grappl", voltada para fãs de wrestling. Meu papel foi executar rapidamente as melhorias necessárias no backend e em features do site.

**Principais realizações técnicas:**

- **Otimização da API Principal e da Home:** Recriei o endpoint da API da Home em **Laravel**, implementando consultas otimizadas para garantir um carregamento mais rápido e uma melhor experiência para o usuário na tela principal da plataforma.

- **Funcionalidade de Busca Avançada:** Desenvolvi uma nova página de busca avançada com filtros customizados, permitindo que os fãs encontrassem lutas e conteúdos específicos de forma muito mais eficiente e engajadora.

- **Módulo de Anúncios no CMS:** Implementei um módulo no sistema de gerenciamento de conteúdo (CMS) para que a equipe de negócios pudesse gerenciar a veiculação de anúncios na plataforma, criando uma nova frente de monetização.

- **Implementação de Gestão de Sessão:** Construí o sistema de gerenciamento de sessão dos usuários, um componente fundamental para a segurança e personalização da experiência na plataforma.

**Tecnologias:** Laravel | PHP | MySQL | Otimização de Queries

---

### Plataforma de Simulados para Exames de Especialidade Médica 👨‍⚕️ (MVP)

Em um projeto de ciclo rápido (2 meses), fui responsável pelo desenvolvimento completo do Produto Mínimo Viável (MVP) de uma plataforma para simulados de exames de especialidade médica. Sob a gerência de Miguel, meu trabalho abrangeu a construção do backend, a integração de pagamentos e a configuração da infraestrutura de deploy.

**Principais realizações técnicas:**

- **Backend para Gestão de Simulados:** Construí em **Laravel** todo o sistema de backend para gerenciar o ciclo de vida dos simulados: desde a criação de questões e sessões de prova até a correção e o monitoramento dos resultados dos usuários.

- **Integração com Gateway de Pagamento:** Implementei a integração com o gateway português **EuPago.pt**, permitindo a cobrança e a gestão de faturamento dos simulados, tornando o produto comercialmente viável desde o primeiro dia.

- **Infraestrutura e Deploy Automatizado (CI/CD):** Configurei toda a infraestrutura do servidor e criei um pipeline de implantação contínua (CI/CD) com **Docker**, garantindo que o MVP pudesse ser atualizado de forma rápida, segura e consistente.

**Tecnologias:** Laravel | PHP | MySQL | EuPago.pt API | Docker | CI/CD
  
---

### Sisporta 🏬 Sistema de Orçamentos com Integração de Dados Assíncrona

Associado a: ALFASOFT.PT (Mar 2018 – Mai 2018)

Para viabilizar um novo sistema de orçamentos, projetei e implementei um pipeline de dados para sincronizar informações de um ERP legado (SQL Server), que não podia ser modificado, com uma nova aplicação em nuvem (Laravel/MySQL), sem sobrecarregar os servidores.

**Principais realizações:**

- **Pipeline de Dados Assíncrono:** Criei um script em Python que extraía dados do ERP, os formatava em JSON e os enviava de forma segura para uma API em Laravel.

- **Processamento de Alta Performance:** Orquestrei o processamento dos dados em lotes de 100 registros utilizando jobs e o Laravel Horizon, garantindo que a sincronização não gerasse gargalos de performance.

- **Consistência e Limpeza:** Desenvolvi rotinas para identificar e remover automaticamente registros que não existiam mais na carga de dados, mantendo a consistência entre os sistemas.

- **Qualidade e Automação:** Assegurei a confiabilidade da integração com testes unitários e de ponta a ponta, além de configurar um pipeline de CI/CD com Bitbucket para automatizar testes e deployments.

**Tecnologias:** Python | Laravel (PHP) | SQL Server | MySQL | Laravel Horizon | Bitbucket Pipelines

---

### Spider 🛒
*Novembro de 2017 - Fevereiro de 2018*
*(Associado à Plugae)*

Desenvolvi a arquitetura de uma plataforma para unificar pedidos de múltiplos hubs de marketplace (Skyhub, Pluggto, B2W) e automatizar a comunicação com o ERP Bling, resolvendo a complexidade de gerenciar canais de venda descentralizados.

**Principais realizações:**

- **Centralização de Marketplaces:** Construí integrações para consolidar pedidos de diversos canais em uma plataforma única com banco de dados MongoDB, criando uma fonte de verdade para as operações de venda.

- **Sincronização com ERP:** Implementei a integração com o ERP Bling utilizando webhooks, automatizando o fluxo de dados e permitindo a gestão de faturamento e estoque de forma mais eficiente.

- **Processamento Assíncrono e Escalável:** Utilizei Laravel Horizon com Redis para gerenciar as integrações em filas, garantindo o processamento de um alto volume de pedidos sem gargalos e simplificando o monitoramento de falhas.

- **Arquitetura Robusta:** Defini e utilizei um stack tecnológico moderno e um fluxo de trabalho com Gitflow e Jira para garantir a qualidade, manutenção e evolução da plataforma.

**Tecnologias:** Laravel (PHP) | MongoDB | Redis | Laravel Horizon | Webhooks | Amazon S3 | Gitflow

A documentação das integrações está disponível em [https://cutt.ly/zMKyo3R](https://cutt.ly/zMKyo3R).

---

### Índicos 🛍️ Plataforma SaaS Multi-tenant para Marketing de Indicação
*Setembro de 2017 - Janeiro de 2018*

Criei uma plataforma SaaS (Software as a Service) multi-tenant para que empresas pudessem implementar e gerenciar seus próprios programas de marketing de indicação multinível. A solução permitia automatizar a distribuição de prêmios e comissões geradas a partir das compras de clientes indicados.

**Principais realizações:**

- **Arquitetura Multi-tenant Robusta:** Desenvolvi o sistema em Laravel com uma estrutura multi-tenant, permitindo que cada empresa cliente tivesse sua base de usuários, configurações e dados de forma totalmente isolada e segura dentro da mesma aplicação.

- **Lógica de Distribuição Multinível:** Implementei o algoritmo para o cálculo e a distribuição de comissões em múltiplos níveis, gerenciando a complexa árvore de indicações e garantindo a precisão dos valores repassados.

- **Plataforma Configurável por Cliente:** Projetei a aplicação para que cada "tenant" (empresa cliente) pudesse customizar suas próprias regras de premiação, produtos e configurações, tornando a solução flexível para diferentes negócios.

**Tecnologias:** Laravel (PHP) | MySQL | Arquitetura Multi-tenant | SaaS

---

### OnePush 🔔 Plataforma SaaS para Notificações Web Push**
*Março de 2017 - Setembro de 2017*
*(Associado à Pilha Digital)*

Desenvolvi uma plataforma SaaS completa que permitia a empresas se cadastrarem para enviar notificações web push aos seus usuários, criando um canal de comunicação direto para aumentar o engajamento e o retorno de visitantes.

**Principais realizações:**

- **Arquitetura Orientada a Eventos:** Projetei o sistema com uma arquitetura modular e orientada a eventos. Essa abordagem garantiu alta coesão, baixo acoplamento entre os módulos e facilitou a escalabilidade e manutenção da plataforma.

- **Integração com Serviços Externos:** Integrei a solução com a **OneSignal** como motor para o envio das notificações e com o gateway de pagamentos **Pagar.me** para automatizar todo o ciclo de cobrança das assinaturas dos clientes.

- **Painel Administrativo Completo:** Construí um sistema de administração robusto que incluía gestão de pagamentos, logs de atividade e um sistema de suporte. Destaque para a funcionalidade de "impersonation", que permitia ao suporte técnico acessar a conta de um usuário para solucionar problemas de forma ágil e segura.

**Tecnologias:** Laravel (PHP) | MySQL | Filas (Queues) | Arquitetura Orientada a Eventos | OneSignal API | Pagar.me API

---

### Startup Center 👨🏽‍💼 Ecossistema de Ferramentas para Apoio a Startups

(Fev 2017 – Set 2017)

Como único desenvolvedor do projeto, concebi, arquitetei e construí uma plataforma completa para apoiar o crescimento de startups, oferecendo um ecossistema de ferramentas integradas, desde a validação de ideias até a colaboração em tempo real.

**Principais realizações:**

- **Ferramenta de Networking e Reunião (StarCoffee):** Implementei um sistema de salas de conferência e chat, utilizando a API da **TokBox** (hoje Vonage) para videoconferência e **Pusher** para chamadas e sinalização em tempo real.

- **Sistema de Gamificação e Moeda Virtual:** Projetei e desenvolvi uma economia interna com a moeda virtual "StarCoin". Startups acumulavam pontos ("Seeder") por usar a plataforma e podiam trocar "StarCoins" por serviços, incentivando o engajamento e a colaboração.

- **Infraestrutura Multi-Cloud:** Realizei o deploy inicial da aplicação em **IBM Bluemix** e, posteriormente, migrei e gerenciei toda a infraestrutura na **AWS**, demonstrando flexibilidade e experiência com diferentes provedores de nuvem.

- **Suite de Utilidades e Pagamentos:** Desenvolvi módulos adicionais, como um sistema de pesquisas de opinião customizadas (StarIdea), e integrei o **PayPal Express Checkout** para a monetização de funcionalidades da plataforma.

**Tecnologias:** Laravel (PHP) | AWS | IBM Bluemix | TokBox (Vonage) API | Pusher API | PayPal API | MySQL

---

### ASO 🏥 Reconstrução e Modernização de Sistema de Gestão de Saúde

Associado a: ASO (Jan 2016 – Jan 2017)

Assumi o desafio de reconstruir uma aplicação legada de grande porte em PHP Orientado a Objetos, responsável pela gestão de hospitais, profissionais de saúde e pacientes. A missão envolveu desde a estabilização emergencial do sistema até sua completa modernização e migração para a nuvem.

**Principais realizações:**

- **Estabilização Emergencial em 15 Dias:** Em um prazo de duas semanas, diagnostiquei os problemas críticos do sistema legado e implementei correções emergenciais, colocando a aplicação novamente em estado operacional e garantindo a continuidade do serviço para os usuários.

- **Reconstrução Completa em 10 Meses:** Ao longo de 10 meses, liderei a reescrita e refatoração de todo o código, modernizando a arquitetura, corrigindo falhas estruturais profundas e implementando novas funcionalidades para que o sistema se tornasse totalmente funcional e estável.

- **Migração para a Nuvem AWS:** Planejei e executei o deploy de toda a aplicação na nuvem da **Amazon AWS**, configurando a infraestrutura para garantir escalabilidade, segurança e alta disponibilidade para o sistema de saúde.

**Tecnologias:** PHP (Orientado a Objetos) | MySQL | Amazon AWS (EC2, RDS, S3) | JavaScript | HTML5 | CSS3

---
### Sistema de Controle de Produção Editorial 📅 (Workflow)

Associado a: EDITORA FTD S/A _(Período do projeto, ex: 2010 - 2011)_

Desenvolvi uma aplicação web interna para a Editora FTD com o objetivo de otimizar e rastrear o complexo fluxo de produção editorial. A solução permitia cronometrar e monitorar a passagem de cada protótipo de livro por todos os departamentos, desde a edição até a aprovação final.

**Principais realizações:**

- **Mapeamento e Controle de Workflow:** Criei um sistema que registrava digitalmente cada etapa do processo produtivo, substituindo controles manuais e oferecendo visibilidade em tempo real sobre o status de cada projeto na linha de produção.

- **Geração de Indicadores de Performance:** A partir dos dados de tempo coletados, a aplicação gerava relatórios que ajudavam a gestão a identificar gargalos, medir a produtividade dos departamentos e otimizar o cronograma de lançamentos de novos livros.

- **Desenvolvimento Baseado em Componentes (CBD):** Estruturei a aplicação seguindo princípios de componentização, o que garantiu um código mais organizado, reutilizável e de fácil manutenção, mesmo utilizando o stack tecnológico da época.

**Tecnologias:** ColdFusion (Java Servlet) | SQL Server | Component-Based Development (CBD) | Windows Server | IIS

---

### Gerenciador Iconográfico 🖼️ Banco de Imagens / DAM

Associado a: EDITORA FTD S/A _(Período do projeto)_

Participei do desenvolvimento de um sistema de gestão de ativos digitais (DAM), ou banco de imagens, para a Editora FTD. O objetivo era centralizar e organizar o vasto acervo iconográfico da empresa (ilustrações, fotos, gráficos) para facilitar sua busca, reutilização e controle de direitos autorais.

**Principais realizações como membro da equipe:**

- **Catalogação Inteligente de Ativos:** Colaborei no desenvolvimento do módulo que permitia o cadastro de imagens associadas a metadados essenciais, como direitos autorais, licenças de uso, palavras-chave e outras informações vitais para a gestão do acervo.

- **Busca Avançada com Refinamento:** Fui responsável por implementar funcionalidades da busca avançada, que permitia aos usuários encontrar imagens com precisão através de múltiplos filtros, otimizando drasticamente o tempo de trabalho de designers e editores.

- **Arquitetura para Gestão de Conteúdo:** Contribuí para a construção de uma arquitetura robusta, baseada em componentes (CBD), capaz de gerenciar um grande volume de dados e arquivos de forma organizada e performática para múltiplos usuários.

**Tecnologias:** ColdFusion (Java Servlet) | SQL Server | Component-Based Development (CBD) | Windows Server | IIS

---
### Sistema de Gestão de Acessos para Conteúdo Educacional 📚

Associado a: EDITORA FTD S/A _(Período do projeto)_

Participei da concepção e desenvolvimento de um sistema interno distribuído para as 24 filiais da Editora FTD no Brasil. A plataforma permitia que administradores regionais gerenciassem o acesso de professores a materiais digitais exclusivos, com base nas coleções de livros adquiridas por suas escolas.

**Principais realizações e contribuições:**

- **Pioneirismo na Adoção de Novas Tecnologias:** Juntamente com a equipe, fui um dos responsáveis por analisar, recomendar e introduzir o ColdFusion na empresa, substituindo o stack legado em ASP. A mudança foi motivada e resultou em um ganho significativo de produtividade no desenvolvimento.

- **Estratégia de Dados e Migração de ERP:** Para superar a baixa performance de acesso direto ao ERP Progress via ODBC, projetei uma solução de extração e migração. Os dados relevantes para a aplicação foram movidos para um banco SQL Server dedicado, garantindo a alta performance e a estabilidade da aplicação web.

- **Arquitetura de Acesso Distribuído:** Colaborei diretamente com Felipe Richter no desenho da arquitetura e do funcionamento da aplicação, criando um modelo que suportava a gestão de permissões de forma descentralizada pelas filiais e garantia a lógica de acesso correta.

**Tecnologias:** ColdFusion | SQL Server | Progress DB (via ODBC) | ASP (legado) | JavaScript | Windows Server | IIS