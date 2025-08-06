---
status: permanent
tags:
  - AI/Gemini25Pro
  - ai/tools/GoogleAIStudio
project: 
related: 
prompt: Com base nesses dados, crie um histórico detalhado das tarefas que realizei na Plugae relacionadas ao Spider, principalmente com foco nas Integrações. O importante é destacar as habilidades que desempenhei no papel de Engenheiro de integração
source: Folder Plugae
---
### **Histórico de Atividades como Engenheiro de Integração - Projeto Spider**

#### **Sumário Executivo**

Atuando como Engenheiro de Integração no projeto Spider, fui responsável por desenhar, desenvolver, implementar e manter o ecossistema de integrações que automatiza as operações de e-commerce para múltiplos clientes. Meu trabalho foi central para conectar sistemas de ERP (Bling, BDI), plataformas de marketplace (Plugg.to, Skyhub, B2W) e ferramentas de gestão interna, garantindo o fluxo contínuo e confiável de dados de produtos, estoque, preços e pedidos. Utilizando tecnologias como PHP/Laravel, MongoDB, e jobs em fila (Redis), construí soluções escaláveis para resolver desafios complexos de sincronização e processamento de dados em tempo real e em lote.

---

### **Principais Responsabilidades e Realizações**

#### **1. Arquitetura e Design de Integração**

Minha função ia além da simples codificação; participei ativamente do planejamento e da arquitetura de novas funcionalidades e fluxos de integração.

*   **Modelagem de Dados:** Colaborei no design de modelos de dados críticos no MongoDB, como o `checking_account` (Conta Corrente), para rastrear transações financeiras complexas (comissões, fretes, estornos) entre a Plugae, clientes e canais de venda.
*   **Definição de Fluxos de Processo:** Mapeei e documentei os fluxos de sincronização de estoque e pedidos, definindo o "owner" do estoque (ERP ou Spider) e as regras de negócio para atualização em diferentes cenários (compra no marketplace, atualização manual no ERP).
*   **Desenvolvimento Orientado a Eventos:** Projetei e implementei a arquitetura de webhooks para o Bling, permitindo que o Spider reagisse em tempo real a eventos de alteração de pedido, estoque e faturamento, substituindo processos de polling menos eficientes.
*   **Criação de Componentes Reutilizáveis:** Desenvolvi o `LogTrait`, uma ferramenta padronizada para logging de operações no MongoDB, melhorando a rastreabilidade e a capacidade de depuração em todos os processos de integração.

#### **2. Sincronização de Estoque e Preços Multi-plataforma**

Um dos pilares do meu trabalho foi garantir que o estoque e os preços dos produtos estivessem sempre consistentes em todos os canais de venda, evitando overselling e erros de precificação.

*   **Integração com ERPs:**
    *   **Bling:** Criei jobs (ex: `product:stockUpdate`) que se conectavam à API do Bling para obter o estoque de clientes como Ultrabrands, ILS e NewLux, comparando com o estoque no Spider e disparando atualizações para os marketplaces.
    *   **BDI (Banco de Dados do Cliente):** Desenvolvi integrações diretas com o banco de dados MySQL do cliente Novo Século para sincronizar estoque e preços com a Skyhub e a Plugg.to.
*   **Integração com Marketplaces:**
    *   **Plugg.to:** Implementei a lógica para enviar atualizações de estoque e preço para a Plugg.to, tratando tanto produtos simples quanto produtos com variações (SKUs filhos). Depurei e resolvi problemas de sincronização, como os SKUs duplicados da Ultrabrands.
    *   **Skyhub:** Criei processos para atualizar o estoque de produtos do cliente Novo Século diretamente na API da Skyhub.
*   **Gerenciamento de Fila de Jobs:** Utilizei filas (`pluggto`, `skyhub`, `default`) para processar as atualizações de forma assíncrona, garantindo que a plataforma se mantivesse responsiva e que as requisições para as APIs fossem executadas de forma controlada e resiliente.

#### **3. Gerenciamento do Ciclo de Vida de Pedidos (Order Lifecycle Management)**

Automatizei o fluxo completo de pedidos, desde a sua criação no marketplace até o faturamento e o envio, orquestrando a comunicação entre as diversas plataformas.

*   **Importação de Pedidos:** Desenvolvi e mantive Artisan Commands (`pluggto:ordersImport`, `skyhub:orderImport`) para importar pedidos de diferentes fontes (Plugg.to, Skyhub) para o banco de dados do Spider.
*   **Processamento e Enriquecimento de Dados:** Criei o `ProcessCodeOrders`, um job responsável por:
    *   Padronizar e normalizar os dados dos pedidos.
    *   **Identificar o cliente associado ao pedido**, utilizando uma lógica robusta que primeiro verificava os SKUs dos itens e, como fallback, o `channel_account`.
    *   Enviar os pedidos processados para o ERP correspondente (Bling para Ultrabrands, BDI para Novo Século).
*   **Tratamento de Status e Faturamento:**
    *   Implementei a lógica de webhook para receber notificações do Bling sobre notas fiscais emitidas (`invoiced`).
    *   Ao receber a confirmação de faturamento, o sistema atualizava o status do pedido no Spider e, em seguida, na plataforma de origem (Plugg.to/Skyhub).
    *   Desenvolvi a rotina para tratar cancelamentos de pedidos (ex: pedido B2W `Submarino-349687674206`), propagando o status `canceled` do marketplace para o Spider e notificando o ERP.

#### **4. Migração e Onboarding de Clientes**

Fui peça-chave no processo de trazer novos clientes para a plataforma Spider, lidando com a complexidade de migrar dados de diferentes sistemas.

*   **Cliente Amo Ler / Novo Século:** Executei o processo de importação de produtos no Magento. Isso incluiu:
    *   Configuração do Amazon S3 para hospedar as planilhas e imagens.
    *   Tratamento de planilhas CSV para ajustar os dados (ex: remoção de endereços completos de imagens).
    *   Configuração da ferramenta Magmi para a importação em massa, definindo `Image search path` e URLs das planilhas.
*   **Cliente ShopUD e Redes de Dormir:** Conduzi a importação de produtos e pedidos da conta Plugg.to para o Spider, associando-os aos seus respectivos clientes e preparando-os para integração com o Bling.
*   **Manutenção Operacional:** Realizei tarefas operacionais críticas, como a exclusão em massa de produtos de clientes descontinuados (Bric, Latinex, Tomdo) da Plugg.to, liberando recursos e limpando a base de dados.

#### **5. Desenvolvimento e Manutenção da Plataforma**

Além das integrações, contribui para a saúde e a evolução da plataforma Spider.

*   **Manutenção de Banco de Dados:** Executei scripts de manutenção no MongoDB para corrigir inconsistências de dados, como a padronização de campos (`espected_delivery_date` para `expected_delivery_date`), garantindo a integridade dos dados para todos os processos.
*   **Infraestrutura e Deploy:** Trabalhei diretamente no ambiente de produção (servidor `165.227.191.82`), utilizando Docker e SSH para deploy e execução de comandos, demonstrando familiaridade com o ciclo de vida completo do software.
*   **Documentação Técnica:** Criei documentação interna sobre os processos de integração, fluxos de dados e modelos de webhook, facilitando a manutenção e a colaboração da equipe.

---

### **Habilidades e Tecnologias**

*   **Linguagens e Frameworks:** PHP, Laravel (Artisan Commands, Jobs, Eloquent).
*   **Bancos de Dados:** MongoDB (queries avançadas, scripts de manutenção), MySQL, Redis (para filas de jobs).
*   **APIs e Protocolos:** REST, Webhooks.
*   **Plataformas de E-commerce e ERPs:** Plugg.to, Skyhub, Bling, B2W, Cnova, Magento.
*   **Ferramentas e Infraestrutura:** Docker, AWS S3, Git, SSH, Magmi, OpenRefine.
*   **Conceitos de Engenharia:** Arquitetura de Microservices, Processamento Assíncrono (Job Queues), ETL (Extração, Transformação e Carga), Modelagem de Dados, Análise de Requisitos.
