# 🌱 ECOFUTURO ESUDA

## Sobre o Projeto

O **ECOFUTURO ESUDA** é uma aplicação web de sustentabilidade que incentiva o uso de transportes ecológicos, recompensando os usuários com **moedas virtuais** que podem ser trocadas por benefícios reais oferecidos por parceiros da Faculdade ESUDA.

A proposta é transformar práticas sustentáveis do dia a dia — como andar de bicicleta, caminhar ou usar transporte público — em recompensas tangíveis, criando um ciclo de engajamento ambiental positivo.

---

## Arquitetura e Padrões de Projeto

A aplicação utiliza dois padrões de projeto (Design Patterns) na sua estrutura:

### 🔹 Singleton — `SistemaEcofuturo`

O **Singleton** garante que exista apenas **uma única instância** da classe `SistemaEcofuturo` durante toda a execução da aplicação. Toda a lógica de negócio, estado dos usuários, catálogo de benefícios e dados de parceiros são gerenciados por essa instância única.

- Armazena todos os dados em memória (sem `localStorage`).
- Contém métodos para autenticação, registro de atividades, gerenciamento de vouchers, estatísticas e administração.
- Utiliza `structuredClone()` para retornar cópias seguras dos dados, evitando mutações externas.

### 🔹 Facade — `EcofuturoFacade`

A **Facade** fornece uma interface simplificada entre a camada de UI (`app.js`) e o Singleton (`SistemaEcofuturo`). A camada de apresentação **nunca** acessa o Singleton diretamente — sempre passa pela Facade.

- Todos os métodos são `static`, facilitando o uso direto sem instanciação.
- Delega cada chamada ao Singleton via `SistemaEcofuturo.getInstance()`.
- Centraliza o ponto de acesso, tornando a manutenção mais simples.

### Fluxo de Dados

```
┌──────────┐      ┌──────────────────┐      ┌────────────────────┐
│  app.js  │ ───▶ │ EcofuturoFacade  │ ───▶ │ SistemaEcofuturo   │
│   (UI)   │      │   (Interface)    │      │   (Singleton)      │
└──────────┘      └──────────────────┘      └────────────────────┘
```

---

## Estrutura de Arquivos

```
ecofuturo/
├── esuda.html             → Página HTML principal (toda a estrutura visual)
├── style.css              → Estilos customizados (animações, layout, responsividade)
├── SistemaEcofuturo.js    → Singleton — toda a lógica de negócio e estado
├── EcofuturoFacade.js     → Facade — interface simplificada para a UI
├── app.js                 → Camada de UI — manipulação do DOM e eventos
└── README.md              → Este arquivo
```

---

## Funcionalidades

### 👤 Para Usuários Comuns

| Funcionalidade | Descrição |
|---|---|
| **Cadastro e Login** | Criação de conta com nome, e-mail, senha e tipo (aluno, professor, funcionário, comunidade externa) |
| **Registro de Atividades** | Registro de deslocamentos sustentáveis com tipo de transporte, distância e data |
| **Ganho de Moedas** | Moedas calculadas automaticamente com base no transporte e distância |
| **Catálogo de Benefícios** | Visualização e reserva de recompensas (EcoBag, café, ingressos, descontos, etc.) |
| **Vouchers** | Ciclo completo: reservar → resgatar → usar, com geração de QR Code |
| **Relatórios Pessoais** | CO₂ reduzido e total de atividades, com filtro por período |
| **Relatórios da Comunidade** | Impacto coletivo com gráficos (Chart.js) |

### 🛡️ Para Administradores

| Funcionalidade | Descrição |
|---|---|
| **Gerenciar Usuários** | Adicionar, editar, excluir usuários e ajustar saldo de moedas |
| **Gerenciar Parceiros** | Adicionar e remover empresas parceiras |
| **Gerenciar Benefícios** | Adicionar, excluir benefícios e atualizar estoques |

---

## Sistema de Moedas

As moedas são ganhas por quilômetro percorrido usando transportes sustentáveis:

| Transporte | Moedas/km |
|---|---|
| 🚲 Bicicleta | 0.5 |
| 🚶 Caminhada | 0.4 |
| 🚌 Transporte Público | 0.3 |
| ⚡ Carro Elétrico | 0.2 |

---

## Cálculo de CO₂ Reduzido

O impacto ambiental é calculado com base nos seguintes fatores de redução por km:

| Transporte | kg CO₂/km |
|---|---|
| 🚲 Bicicleta | 0.20 |
| 🚶 Caminhada | 0.15 |
| 🚌 Transporte Público | 0.10 |
| ⚡ Carro Elétrico | 0.05 |

---

## Tecnologias Utilizadas

- **HTML5** — Estrutura da página
- **TailwindCSS (CDN)** — Estilização utilitária
- **CSS customizado** — Animações e estilos complementares
- **JavaScript (ES Modules)** — Lógica de negócio e interação
- **Chart.js** — Gráficos de relatórios
- **Google Fonts (Inter)** — Tipografia

---

## Credenciais de Acesso

### Administrador
- **E-mail:** `admin@ecofuturo.com`
- **Senha:** `admin123`

### Usuários comuns
Não há usuários pré-cadastrados. Novos usuários podem ser criados pela tela de cadastro ou pelo painel administrativo.

---

## Como Executar

1. Abra o arquivo `esuda.html` diretamente no navegador.
2. Os dados são armazenados apenas em memória — ao recarregar a página, os dados são reiniciados.

---

## Autores

**Igor Philipo / Kamylle / Roseli** — Faculdade ESUDA
