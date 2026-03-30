 EcoFuturo Esuda - Plataforma de Sustentabilidade

- Descrição do Projeto

O EcoFuturo Esuda é uma plataforma web gamificada que incentiva a adoção de práticas sustentáveis de mobilidade urbana através de um sistema de recompensas. Os usuários registram atividades ecológicas como bicicleta, caminhada, transporte público e carro elétrico, acumulando moedas proporcionais à distância percorrida. As moedas podem ser trocadas por benefícios exclusivos em parceiros locais, promovendo um ciclo virtuoso entre sustentabilidade, economia e bem-estar social.

- Integrantes do Grupo:

Igor Philipo 
João Vinícius
Kamylle 
Roseli

- Padrões de Projeto Implementados (1ª Avaliação)

- Singleton
Onde foi aplicado: Na classe (SistemaEcofuturo)

Motivo da escolha: Garante que exista apenas uma instância do sistema central durante toda a execução, mantendo a consistência dos dados (usuários, moedas, catálogo, atividades) em toda a aplicação, evitando conflitos de estado.

 - Facade
Onde foi aplicado: No objeto (EcofuturoFacade)

Motivo da escolha: Fornece uma interface simplificada para o front-end acessar as funcionalidades do sistema, ocultando a complexidade do Singleton e da lógica interna, facilitando a manutenção e os testes.

 - Tecnologias Utilizadas

HTML5 - Estrutura da aplicação 
CSS3 (Tailwind CSS)- Estilização e responsividade 
JavaScript - Lógica e interatividade 
Chart.js - Gráficos e estatísticas 

- Funcionalidades Principais

-  Cadastro e login de usuários
-  Registro de atividades sustentáveis
-  Sistema de moedas por km percorrido
-  Catálogo de benefícios para resgate
-  Histórico de atividades
-  Dashboard com estatísticas pessoais
-  Relatórios de impacto ambiental (CO₂ reduzido)
-  Área administrativa (gestão de usuários, parceiros e benefícios)
-  Sistema de vouchers com QR Code

 - Como Executar o Projeto:

Pré-requisitos
- Navegador web moderno (Chrome, Firefox, Edge)
- Conexão com internet (para carregar bibliotecas CDN)

