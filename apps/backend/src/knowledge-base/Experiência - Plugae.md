---
status: permanent
tags: 
date: 2025-08-09
project: "[[Project - Spider - Integration Engineer]]"
related: 
prompt:
---
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
