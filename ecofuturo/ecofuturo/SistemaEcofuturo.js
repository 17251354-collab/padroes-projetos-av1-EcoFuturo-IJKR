/**
 * SistemaEcofuturo.js
 * 
 * Classe principal que gerencia toda a lógica de negócio do sistema.
 * Implementamos o padrão Singleton aqui pra garantir que só exista
 * uma instância do sistema rodando por vez — evita problemas de
 * estado duplicado quando várias partes do código tentam acessar os dados.
 * 
 * 
 */

export default class SistemaEcofuturo {
    static #instance = null;

    constructor() {
        // Proteção do Singleton: se já existe instância, retorna ela
        if (SistemaEcofuturo.#instance) {
            return SistemaEcofuturo.#instance;
        }

        // Conta padrão do admin — a ideia é ter um acesso master pro sistema
        // TODO: futuramente, trocar pra buscar do banco de dados
        this.adminUser = {
            name: 'Administrador',
            email: 'admin@ecofuturo.com',
            password: this.#hashPassword('admin123'),
            type: 'admin',
            coins: 0,
            activities: [],
            vouchers: []
        };

        // Lista de usuários cadastrados (começa vazia, se popula com os cadastros)
        this.users = [];

        // Parceiros que participam do programa de recompensas
        this.partners = [
            { id: 1, nome: "Faculdade Esuda" },
            { id: 2, nome: "Nagem" },
            { id: 3, nome: "Livraria Jaqueira" },
            { id: 4, nome: "Cafeteria Delta Expresso" }
        ];

        // Benefícios disponíveis no catálogo — os valores em moedas foram
        // definidos pela equipe levando em conta o esforço médio do usuário
        this.catalogo = [
            { id: 1, nome: "EcoBag", custo: 100, imagem: "🛍️", stock: 25 },
            { id: 2, nome: "Café na Delta Expresso", custo: 150, imagem: "☕", stock: 30 },
            { id: 3, nome: "Ingresso de Cinema", custo: 250, imagem: "🎬", stock: 15 },
            { id: 4, nome: "Vale-refeição de R$50", custo: 500, imagem: "🍽️", stock: 10 },
            { id: 5, nome: "Camiseta EcoFuturo Esuda", custo: 750, imagem: "👕", stock: 20 },
            { id: 6, nome: "Desconto 50% na Livraria Jaqueira", custo: 950, imagem: "📚", stock: 12 },
            { id: 7, nome: "Desconto 50% na Matrícula ESUDA", custo: 980, imagem: "🎓", stock: 8 },
            { id: 8, nome: "Fone de Ouvido Gamer", custo: 2300, imagem: "🎧", stock: 5 }
        ];

        this.totalCoinsDonated = 0; // acumula total de moedas gastas em resgates
        this.isLoggedIn = false;
        this.currentUser = null;

        // Salva a referência da instância pra funcionar o Singleton
        SistemaEcofuturo.#instance = this;
    }

    /**
     * Ponto de acesso global — qualquer módulo que precisar do sistema 
     * chama esse método ao invés de dar new direto
     */
    static getInstance() {
        if (!SistemaEcofuturo.#instance) {
            SistemaEcofuturo.#instance = new SistemaEcofuturo();
        }
        return SistemaEcofuturo.#instance;
    }

    // Hash simples com base64 — nao é seguro pra produção, mas serve pro protótipo
    // Em produção usaríamos bcrypt ou algo do tipo
    #hashPassword(password) { return btoa(password + 'ecofuturo'); }

    /**
     * Faz login verificando primeiro se é admin, depois busca nos usuários comuns.
     * Retorna um objeto safe (cópia) pra não vazar referência direta.
     */
    login(email, password) {
        const hashedPassword = this.#hashPassword(password);

        // Verifica se é o admin primeiro
        if (email === this.adminUser.email && hashedPassword === this.adminUser.password) {
            this.isLoggedIn = true;
            this.currentUser = this.adminUser;
            return { success: true, user: this.getCurrentUserSafe() };
        }

        // Se não for admin, procura na lista de usuários
        const user = this.users.find(u => u.email === email && u.password === hashedPassword);
        if (user) {
            this.isLoggedIn = true;
            this.currentUser = user;
            return { success: true, user: this.getCurrentUserSafe() };
        }
        return { success: false, message: 'E-mail ou senha inválidos.' };
    }

    logout() {
        this.isLoggedIn = false;
        this.currentUser = null;
        return { success: true };
    }

    // Cadastro de novo usuário — valida campos obrigatórios antes de criar
    cadastrar(nome, email, senha, tipo) {
        if (!nome || !email || !senha || !tipo) return { success: false, message: 'Por favor, preencha todos os campos.' };

        const newUser = {
            name: nome,
            email: email,
            password: this.#hashPassword(senha),
            type: tipo,
            coins: 0,
            activities: [],
            vouchers: []
        };
        this.users.push(newUser);
        return { success: true, message: '✅ Cadastro realizado com sucesso! Agora faça login.' };
    }

    /**
     * Registra uma atividade sustentável do usuário logado.
     * Cada tipo de transporte tem um fator de conversão diferente 
     * (bicicleta rende mais moedas porque o esforço é maior)
     */
    registrarAtividade(transport, distance, date) {
        if (!this.currentUser) return { success: false, message: 'Usuário não logado.' };
        if (!transport) return { success: false, message: 'Selecione o transporte.' };

        const distNum = parseFloat(distance);
        if (isNaN(distNum) || distNum <= 0) return { success: false, message: 'Distância inválida.' };

        // Impede registrar atividade no futuro
        const today = new Date().toISOString().split('T')[0];
        if (date > today) return { success: false, message: 'A data não pode ser futura.' };

        // Fator de conversão: moedas por km rodado
        const factors = { bicicleta: 0.5, caminhada: 0.4, transportePublico: 0.3, carroEletrico: 0.2 };
        if (!factors[transport]) return { success: false, message: 'Transporte inválido.' };

        const coinsGained = distNum * factors[transport];
        const newActivity = { id: Date.now(), transport, distance: distNum, coins: coinsGained, date };

        this.currentUser.activities.push(newActivity);
        this.currentUser.coins += coinsGained;
        this.#updateUserInList(this.currentUser);

        // structuredClone pra devolver cópia e não a referência interna
        return { success: true, activity: structuredClone(newActivity), coinsGained, newBalance: this.currentUser.coins };
    }

    // Sincroniza o usuário na lista principal sempre que houver alteração nos dados
    #updateUserInList(user) {
        if (user.type === 'admin') return; // admin fica separado, nao precisa
        const idx = this.users.findIndex(u => u.email === user.email);
        if (idx !== -1) this.users[idx] = user;
    }

    // Retorna cópia segura do usuário logado (evita manipulação externa)
    getCurrentUserSafe() {
        return this.currentUser ? structuredClone(this.currentUser) : null;
    }

    getSaldoUsuario() {
        return this.currentUser ? this.currentUser.coins : 0;
    }

    // Busca as últimas atividades do usuário, ordenadas pela data mais recente
    getHistoricoAtividades(limit = 10) {
        if (!this.currentUser) return [];
        const activities = [...this.currentUser.activities].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
        return structuredClone(activities);
    }

    getCatalogo() {
        return structuredClone(this.catalogo);
    }

    /**
     * Reserva um benefício pro usuário.
     * A reserva não desconta moedas ainda — isso só acontece no resgate.
     * O voucher expira em 30 dias se nao for resgatado.
     */
    reservarBeneficio(benefitId) {
        if (!this.currentUser) return { success: false, message: 'Você precisa estar logado.' };
        if (this.currentUser.type === 'admin') return { success: false, message: 'Administradores não podem resgatar benefícios.' };

        const benefit = this.catalogo.find(b => b.id === benefitId);
        if (!benefit) return { success: false, message: 'Benefício não encontrado.' };
        if (this.currentUser.coins < benefit.custo) return { success: false, message: `Moedas insuficientes. Você precisa de ${benefit.custo} moedas.` };
        if (benefit.stock <= 0) return { success: false, message: 'Desculpe, este benefício esgotou.' };

        // Gera um ID único pro voucher combinando timestamp + random
        const voucherId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30); // validade de 30 dias

        const newVoucher = {
            id: voucherId,
            benefitId,
            benefitName: benefit.nome,
            cost: benefit.custo,
            redeemDate: new Date().toISOString().split('T')[0],
            expirationDate: expirationDate.toISOString().split('T')[0],
            status: 'reserved'
        };

        this.currentUser.vouchers.push(newVoucher);
        benefit.stock -= 1; // diminui estoque disponível
        this.#updateUserInList(this.currentUser);

        return { success: true, message: `✅ Você reservou "${benefit.nome}" por ${benefit.custo} moedas!`, voucher: structuredClone(newVoucher) };
    }

    // Resgate efetivo — aqui sim desconta as moedas do saldo
    resgatarVoucher(voucherId) {
        if (!this.currentUser) return { success: false, message: 'Usuário não logado.' };
        const voucher = this.currentUser.vouchers.find(v => v.id === voucherId && v.status === 'reserved');
        if (!voucher) return { success: false, message: 'Voucher não encontrado ou já resgatado.' };
        if (this.currentUser.coins < voucher.cost) return { success: false, message: `Moedas insuficientes.` };

        this.currentUser.coins -= voucher.cost;
        voucher.status = 'pending'; // agora está pago, esperando o usuário usar
        this.totalCoinsDonated += voucher.cost;
        this.#updateUserInList(this.currentUser);

        return { success: true, message: `✅ Voucher "${voucher.benefitName}" resgatado!`, newBalance: this.currentUser.coins };
    }

    // Marca o voucher como usado — geralmente quando o usuário apresenta o QR code
    marcarVoucherComoUsado(voucherId) {
        if (!this.currentUser) return { success: false, message: 'Usuário não logado.' };
        const voucher = this.currentUser.vouchers.find(v => v.id === voucherId && v.status === 'pending');
        if (!voucher) return { success: false, message: 'Voucher não encontrado ou já foi usado.' };

        voucher.status = 'used';
        this.#updateUserInList(this.currentUser);

        return { success: true, message: `🎉 Voucher "${voucher.benefitName}" utilizado!`, voucherId };
    }

    /**
     * Remove um voucher que ainda nao foi usado.
     * Se já foi pago (status 'pending'), devolve as moedas pro usuário.
     * Se estava só reservado, cancela sem custo.
     */
    deletarVoucher(voucherId) {
        if (!this.currentUser) return { success: false, message: 'Usuário não logado.' };
        const idx = this.currentUser.vouchers.findIndex(v => v.id === voucherId && (v.status === 'reserved' || v.status === 'pending'));
        if (idx === -1) return { success: false, message: 'Voucher não encontrado.' };

        const voucher = this.currentUser.vouchers[idx];

        // Devolve o item pro estoque
        const benefit = this.catalogo.find(b => b.id === voucher.benefitId);
        if (benefit) benefit.stock += 1;

        let msg;
        if (voucher.status === 'pending') {
            // Se já pagou, reembolsa
            this.currentUser.coins += voucher.cost;
            this.totalCoinsDonated -= voucher.cost;
            msg = `🗑️ Voucher excluído e ${voucher.cost} moedas devolvidas.`;
        } else {
            msg = `🗑️ Reserva de "${voucher.benefitName}" cancelada.`;
        }

        this.currentUser.vouchers.splice(idx, 1);
        this.#updateUserInList(this.currentUser);
        return { success: true, message: msg };
    }

    // Retorna só os vouchers que ainda estão ativos (reservados ou pagos)
    getVouchersPendentes() {
        if (!this.currentUser) return [];
        return structuredClone(this.currentUser.vouchers.filter(v => v.status === 'reserved' || v.status === 'pending'));
    }

    // Retorna vouchers já finalizados (usados ou expirados) — pra exibir no histórico
    getVouchersHistorico() {
        if (!this.currentUser) return [];
        return structuredClone(this.currentUser.vouchers.filter(v => v.status === 'used' || v.status === 'expired'));
    }

    // Verifica vouchers expirados e marca eles automaticamente
    // Chamado no login pra atualizar o estado dos vouchers que passaram da data
    verificarExpiracaoVouchers() {
        if (!this.currentUser) return 0;
        const today = new Date().toISOString().split('T')[0];
        let expired = 0;
        this.currentUser.vouchers.forEach(v => {
            if ((v.status === 'pending' || v.status === 'reserved') && v.expirationDate < today) {
                v.status = 'expired';
                expired++;
                // Devolve o item ao estoque quando expira
                const benefit = this.catalogo.find(b => b.id === v.benefitId);
                if (benefit) benefit.stock += 1;
            }
        });
        if (expired > 0) { this.#updateUserInList(this.currentUser); }
        return expired;
    }

    // Métricas pessoais do usuário logado, filtradas por período
    getEstatisticasPessoais(periodo = 'total') {
        if (!this.currentUser) return null;
        return this.#calcularMetricas(this.currentUser.activities, periodo);
    }

    // Métricas gerais de toda a comunidade (soma de todos os usuários)
    getEstatisticasComunidade(periodo = 'total') {
        const todosUsuariosComuns = this.users;
        const todasAtividades = todosUsuariosComuns.flatMap(u => u.activities);
        const metricas = this.#calcularMetricas(todasAtividades, periodo);
        return {
            ...metricas,
            totalUsuarios: todosUsuariosComuns.length,
            totalMoedasDoadas: this.totalCoinsDonated
        };
    }

    /**
     * Calcula as métricas de CO2 a partir das atividades registradas.
     * Os fatores de redução de CO2 (kg/km) foram baseados em dados médios:
     *   - bicicleta substitui carro: ~0.2 kg CO2/km
     *   - caminhada substitui carro: ~0.15 kg CO2/km
     *   - transporte público: ~0.1 kg CO2/km (emissão compartilhada)
     *   - carro elétrico: ~0.05 kg CO2/km (ainda consome energia)
     */
    #calcularMetricas(activities, periodo) {
        const now = new Date();
        const startDate = new Date();

        // Define a data inicial conforme o filtro selecionado
        if (periodo === 'today') startDate.setHours(0, 0, 0, 0);
        else if (periodo === 'week') startDate.setDate(now.getDate() - 7);
        else if (periodo === 'month') startDate.setMonth(now.getMonth() - 1);
        else if (periodo === 'year') startDate.setFullYear(now.getFullYear(), 0, 1);

        const filtered = activities.filter(a => {
            if (periodo === 'total') return true;
            // T12:00:00 pra evitar problemas de fuso horário na comparação
            const activityDate = new Date(a.date + 'T12:00:00');
            return activityDate >= startDate;
        });

        const factors = { bicicleta: 0.2, caminhada: 0.15, transportePublico: 0.1, carroEletrico: 0.05 };
        const co2ByTransport = { bicicleta: 0, caminhada: 0, transportePublico: 0, carroEletrico: 0 };
        let totalCO2 = 0;

        filtered.forEach(a => {
            const reduction = a.distance * factors[a.transport];
            totalCO2 += reduction;
            co2ByTransport[a.transport] += reduction;
        });

        return { totalCO2, totalActivities: filtered.length, co2ByTransport };
    }

    // ==========================================
    //   Métodos exclusivos do administrador
    // ==========================================

    listarUsuarios() {
        return this.currentUser?.type === 'admin' ? structuredClone(this.users) : [];
    }

    // Atalho: admin adicionar usuário usa o mesmo cadastrar() internamente
    adicionarUsuario(nome, email, senha, tipo) {
        if (this.currentUser?.type !== 'admin') return { success: false, message: 'Acesso negado.' };
        return this.cadastrar(nome, email, senha, tipo);
    }

    // Edição parcial — só atualiza os campos que foram enviados
    editarUsuario(emailOriginal, dados) {
        if (this.currentUser?.type !== 'admin') return { success: false, message: 'Acesso negado.' };
        const idx = this.users.findIndex(u => u.email === emailOriginal);
        if (idx === -1) return { success: false, message: 'Usuário não encontrado.' };
        if (dados.name) this.users[idx].name = dados.name;
        if (dados.type) this.users[idx].type = dados.type;
        if (dados.coins !== undefined) this.users[idx].coins = dados.coins;
        return { success: true, message: 'Usuário atualizado.' };
    }

    deletarUsuario(email) {
        if (this.currentUser?.type !== 'admin') return { success: false, message: 'Acesso negado.' };
        const idx = this.users.findIndex(u => u.email === email);
        if (idx === -1) return { success: false, message: 'Usuário não encontrado.' };
        this.users.splice(idx, 1);
        return { success: true, message: 'Usuário excluído.' };
    }

    // Reset geral — limpa todos os usuários e zera o contador de moedas doadas
    deletarTodosUsuarios() {
        if (this.currentUser?.type !== 'admin') return { success: false, message: 'Acesso negado.' };
        this.users = [];
        this.totalCoinsDonated = 0;
        return { success: true, message: 'Todos os usuários foram excluídos.' };
    }

    listarParceiros() { return structuredClone(this.partners); }

    // Gera ID incremental baseado no maior ID existente na lista
    adicionarParceiro(nome) {
        if (this.currentUser?.type !== 'admin') return { success: false, message: 'Acesso negado.' };
        const newId = this.partners.length > 0 ? Math.max(...this.partners.map(p => p.id)) + 1 : 1;
        this.partners.push({ id: newId, nome });
        return { success: true, message: `Parceiro ${nome} adicionado.` };
    }

    deletarParceiro(id) {
        if (this.currentUser?.type !== 'admin') return { success: false, message: 'Acesso negado.' };
        this.partners = this.partners.filter(p => p.id !== id);
        return { success: true, message: 'Parceiro excluído.' };
    }

    // Se nao passar imagem, usa o emoji padrão de presente
    adicionarBeneficio(nome, custo, estoque, imagem = '') {
        if (this.currentUser?.type !== 'admin') return { success: false, message: 'Acesso negado.' };
        const newId = this.catalogo.length > 0 ? Math.max(...this.catalogo.map(b => b.id)) + 1 : 1;
        this.catalogo.push({ id: newId, nome, custo, imagem: imagem || '🎁', stock: estoque });
        return { success: true, message: `Benefício "${nome}" adicionado.` };
    }

    atualizarEstoqueBeneficio(id, novoEstoque) {
        if (this.currentUser?.type !== 'admin') return { success: false, message: 'Acesso negado.' };
        const benefit = this.catalogo.find(b => b.id === id);
        if (benefit) {
            benefit.stock = novoEstoque;
            return { success: true, message: 'Estoque atualizado.' };
        }
        return { success: false, message: 'Benefício não encontrado.' };
    }

    deletarBeneficio(id) {
        if (this.currentUser?.type !== 'admin') return { success: false, message: 'Acesso negado.' };
        this.catalogo = this.catalogo.filter(b => b.id !== id);
        return { success: true, message: 'Benefício excluído.' };
    }
}
