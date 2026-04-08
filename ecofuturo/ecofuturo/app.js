/**
 * app.js — Controlador principal da interface
 * 
 * Esse arquivo cuida de toda a parte visual e interação com o usuário.
 * Ele não mexe na lógica de negócio diretamente — tudo passa pelo 
 * EcofuturoFacade (padrão Facade) que encapsula o acesso ao sistema.
 * 
 * A estrutura é um objeto literal "app" que funciona como um módulo
 * com os métodos organizados por funcionalidade (auth, dashboard, etc).
 */

import EcofuturoFacade from './EcofuturoFacade.js';

const app = {
    currentPage: 'dashboard',
    chart: null, // referência do gráfico Chart.js — precisa guardar pra destruir antes de recriar


    // Ponto de partida da aplicação, chamado no window.onload
    init() {
        this.bindEvents();
        this.checkAuth();
        this.startBackgroundAnimation();
    },


    // Exibe uma caixa de mensagem estilo modal pro usuário
    showMessage(msg) {
        document.getElementById('message-text').textContent = msg;
        document.getElementById('message-box-overlay').classList.remove('hidden');
    },


    /**
     * Registra todos os event listeners da aplicação.
     * Centralizado aqui pra ficar mais fácil de achar quando precisar 
     * debugar algum evento que não tá funcionando.
     */
    bindEvents() {
        document.getElementById('toggle-auth').onclick = () => this.toggleAuthMode();
        document.getElementById('login-form').onsubmit = (e) => this.handleLogin(e);
        document.getElementById('cadastro-form').onsubmit = (e) => this.handleCadastro(e);
        document.getElementById('message-box-ok').onclick = () => document.getElementById('message-box-overlay').classList.add('hidden');
        document.getElementById('activity-form').onsubmit = (e) => this.handleActivitySubmit(e);
        document.getElementById('report-period-filter').onchange = () => this.renderReportsPage();
        document.getElementById('qr-code-modal-ok').onclick = () => document.getElementById('qr-code-modal').classList.add('hidden');
        document.getElementById('hamburger-menu-btn').onclick = () => this.toggleSideMenu();
        document.getElementById('close-side-menu-btn').onclick = () => this.toggleSideMenu();
        document.getElementById('side-menu-backdrop').onclick = () => this.toggleSideMenu();

        // Formulários do painel admin — usa o if pra não dar erro quando o
        // elemento não existe (ex: quando o usuário não é admin)
        const addUserForm = document.getElementById('admin-add-user-form');
        if (addUserForm) addUserForm.addEventListener('submit', (e) => this.handleAdminAddUser(e));

        const editForm = document.getElementById('admin-edit-user-form');
        if (editForm) editForm.addEventListener('submit', (e) => this.handleAdminEditUser(e));

        const cancelEdit = document.getElementById('btn-cancel-edit');
        if (cancelEdit) cancelEdit.addEventListener('click', () => document.getElementById('edit-user-modal').classList.add('hidden'));

        const addPartnerForm = document.getElementById('admin-add-partner-form');
        if (addPartnerForm) addPartnerForm.addEventListener('submit', (e) => this.handleAdminAddPartner(e));

        const addBenefitForm = document.getElementById('admin-add-benefit-form');
        if (addBenefitForm) addBenefitForm.addEventListener('submit', (e) => this.handleAdminAddBenefit(e));
    },


    // Abre/fecha o menu lateral (mobile)
    toggleSideMenu() {
        const m = document.getElementById('side-menu');
        const b = document.getElementById('side-menu-backdrop');
        m.classList.toggle('-translate-x-full');
        b.classList.toggle('opacity-0');
        b.classList.toggle('pointer-events-none');
    },


    /**
     * Verifica se o usuário já está logado.
     * Se sim, renderiza o header e redireciona pra página correta.
     * Se não, esconde o header e mostra a tela de login.
     */
    checkAuth() {
        const header = document.getElementById('main-header');
        if (EcofuturoFacade.isLoggedIn()) {
            EcofuturoFacade.verificarExpiracao(); // checa vouchers vencidos no login
            this.renderHeader();
            this.showPage(EcofuturoFacade.isAdmin() ? 'reports' : 'dashboard');
        } else {
            header.style.display = 'none';
            this.showPage('auth');
        }
    },

    handleLogin(e) {
        e.preventDefault();
        const r = EcofuturoFacade.login(
            document.getElementById('login-email').value,
            document.getElementById('login-password').value
        );
        if (r.success) {
            this.renderHeader();
            // Admin vai direto pros relatórios, usuário comum vai pro dashboard
            this.showPage(r.user.type === 'admin' ? 'reports' : 'dashboard');
        } else {
            this.showMessage(r.message);
        }
    },

    handleCadastro(e) {
        e.preventDefault();
        const nome = document.getElementById('cadastro-nome').value.trim();
        const email = document.getElementById('cadastro-email').value.trim();
        const senha = document.getElementById('cadastro-password').value;
        const tipo = document.getElementById('cadastro-tipo').value;

        const r = EcofuturoFacade.cadastrar(nome, email, senha, tipo);
        this.showMessage(r.message);
        if (r.success) {
            // Volta pra tela de login depois de cadastrar com sucesso
            document.getElementById('auth-title').textContent = 'Entrar';
            document.getElementById('toggle-auth').textContent = 'Ainda não tem conta? Cadastre-se';
            document.getElementById('login-form').classList.remove('hidden');
            document.getElementById('cadastro-form').classList.add('hidden');
            document.getElementById('cadastro-form').reset();
            document.getElementById('login-form').reset();
        }
    },

    handleLogout() {
        EcofuturoFacade.logout();
        this.checkAuth();
    },

    // Alterna entre a tela de login e cadastro
    toggleAuthMode() {
        const l = document.getElementById('login-form');
        const c = document.getElementById('cadastro-form');
        const t = document.getElementById('auth-title');
        const tg = document.getElementById('toggle-auth');
        const isLogin = l.classList.contains('hidden');
        if (isLogin) {
            t.textContent = 'Entrar';
            tg.textContent = 'Ainda não tem conta? Cadastre-se';
        } else {
            t.textContent = 'Cadastrar';
            tg.textContent = 'Já tem conta? Entrar';
        }
        l.classList.toggle('hidden');
        c.classList.toggle('hidden');
    },


    /**
     * Monta o header de navegação dinamicamente.
     * O menu muda dependendo do tipo de usuário — admin tem itens extras.
     * Gera tanto o nav desktop quanto o menu lateral (mobile).
     */
    renderHeader() {
        const user = EcofuturoFacade.getCurrentUser();
        if (!user) return;
        const items = [
            { page: 'dashboard', text: '📊 Dashboard' },
            { page: 'catalog', text: '🎁 Catálogo' },
            { page: 'resgate', text: '🎫 Meus Resgates' },
            { page: 'reports', text: '📈 Relatórios' }
        ];
        // Adiciona abas de gerenciamento só pro admin
        if (user.type === 'admin') {
            items.push(
                { page: 'management', text: '👥 Usuários' },
                { page: 'managementPartners', text: '🤝 Parceiros' }
            );
        }

        // Renderiza links no nav desktop
        document.getElementById('main-nav-desktop').innerHTML =
            items.map(i => `<a href="#" class="nav-link text-gray-600 hover:text-green-600 font-medium px-3 py-2 rounded-md" data-page="${i.page}">${i.text}</a>`).join('') +
            `<button id="btn-logout" class="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-md ml-4">🚪 Sair</button>`;

        // Renderiza links no menu lateral (mobile)
        document.getElementById('main-nav-side').innerHTML =
            items.map(i => `<a href="#" class="nav-link-side text-gray-600 hover:bg-green-50 font-medium px-3 py-2 rounded-md block" data-page="${i.page}">${i.text}</a>`).join('');

        document.getElementById('btn-logout').onclick = () => this.handleLogout();
        document.getElementById('btn-logout-side').onclick = () => this.handleLogout();

        // Configura clique nos links de navegação (tanto desktop quanto mobile)
        document.querySelectorAll('.nav-link, .nav-link-side').forEach(l => l.onclick = (e) => {
            e.preventDefault();
            const p = l.getAttribute('data-page');
            if (p) this.showPage(p);
            // Fecha o menu lateral se estiver aberto
            if (!document.getElementById('side-menu').classList.contains('-translate-x-full')) this.toggleSideMenu();
        });

        // Animação de entrada do header (slide down)
        document.getElementById('main-header').style.display = 'flex';
        setTimeout(() => document.getElementById('main-header').classList.remove('translate-y-[-100px]', 'opacity-0'), 100);
        this.updateActiveLink(this.currentPage);
    },

    // Destaca o link da página ativa no menu
    updateActiveLink(p) {
        document.querySelectorAll('.nav-link, .nav-link-side').forEach(l => {
            l.classList.remove('active-link');
            if (l.getAttribute('data-page') === p) l.classList.add('active-link');
        });
    },


    /**
     * Sistema de roteamento simples — esconde todas as páginas e mostra
     * só a que foi solicitada. Chama o render da página correspondente.
     */
    showPage(page) {
        const pages = {
            auth: 'auth-page',
            dashboard: 'dashboard-page',
            catalog: 'catalog-page',
            resgate: 'resgate-page',
            reports: 'reports-page',
            management: 'admin-management-page',
            managementPartners: 'admin-partners-page'
        };
        // Esconde todas as páginas
        Object.values(pages).forEach(p => {
            const el = document.getElementById(p);
            if (el) el.classList.add('hidden');
        });
        // Mostra a página alvo
        const target = document.getElementById(pages[page]);
        if (target) target.classList.remove('hidden');
        this.currentPage = page;
        this.updateActiveLink(page);

        // Renderiza o conteúdo da página selecionada
        if (page === 'dashboard') this.renderDashboardPage();
        else if (page === 'catalog') this.renderCatalogPage();
        else if (page === 'resgate') this.renderResgatePage();
        else if (page === 'reports') this.renderReportsPage();
        else if (page === 'management') this.renderAdminManagementPage();
        else if (page === 'managementPartners') this.renderAdminPartnersPage();

        window.scrollTo(0, 0); // volta pro topo ao trocar de página
    },


    // ==========================================
    //   Dashboard
    // ==========================================

    renderDashboardPage() {
        const user = EcofuturoFacade.getCurrentUser();
        if (!user) return;
        document.getElementById('user-name').textContent = user.name;
        document.getElementById('user-coins').textContent = user.coins.toFixed(2);
        this.renderActivityHistory();
        // Limita o campo de data pra não permitir datas futuras
        const today = new Date().toISOString().split('T')[0];
        const d = document.getElementById('activity-date');
        if (d) { d.max = today; d.value = today; }
    },

    // Renderiza a lista com as últimas 10 atividades registradas
    renderActivityHistory() {
        const acts = EcofuturoFacade.getHistoricoAtividades(10);
        const list = document.getElementById('activity-history-list');
        const no = document.getElementById('no-recent-activities');
        if (!list) return;
        list.innerHTML = '';
        if (!acts.length) { if (no) no.classList.remove('hidden'); return; }
        if (no) no.classList.add('hidden');

        // Mapeamento de emoji por tipo de transporte
        const names = { bicicleta: '🚲 Bicicleta', caminhada: '🚶 Caminhada', transportePublico: '🚌 Transporte Público', carroEletrico: '⚡ Carro Elétrico' };
        acts.forEach(a => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center p-4 bg-gray-50 border border-gray-200 rounded-lg';
            div.innerHTML = `<div><div class="flex items-center gap-2"><span class="text-xl">${a.transport === 'bicicleta' ? '🚲' : a.transport === 'caminhada' ? '🚶' : a.transport === 'transportePublico' ? '🚌' : '⚡'}</span><span class="font-semibold">${names[a.transport]}</span></div><div class="text-sm text-gray-500">📅 ${new Date(a.date).toLocaleDateString('pt-BR')}</div></div><div class="text-right"><div class="font-bold">${a.distance} km</div><div class="text-green-600">💰 +${a.coins.toFixed(2)}</div></div>`;
            list.appendChild(div);
        });
    },


    // Processa o formulário de nova atividade
    handleActivitySubmit(e) {
        e.preventDefault();
        const t = document.getElementById('transport-type').value;
        const d = document.getElementById('distance').value;
        const dt = document.getElementById('activity-date').value;


        const r = EcofuturoFacade.registrarAtividade(t, d, dt);
        if (r.success) {
            // Atualiza o saldo na tela
            document.getElementById('user-coins').textContent = r.newBalance.toFixed(2);
            const names = { bicicleta: '🚲 Bicicleta', caminhada: '🚶 Caminhada', transportePublico: '🚌 Transporte Público', carroEletrico: '⚡ Carro Elétrico' };
            document.getElementById('recent-transport').textContent = names[t];
            document.getElementById('recent-distance').textContent = r.activity.distance;
            document.getElementById('recent-coins').textContent = r.coinsGained.toFixed(2);
            document.getElementById('recent-activity').classList.remove('hidden');
            this.animateCoinGain(r.coinsGained);
            this.renderActivityHistory();
            this.renderReportsPage(); // atualiza os relatórios também
            document.getElementById('activity-form').reset();
            document.getElementById('activity-date').value = new Date().toISOString().split('T')[0];
            // Esconde o feedback de sucesso depois de 5 segundos
            setTimeout(() => document.getElementById('recent-activity').classList.add('hidden'), 5000);
        } else {
            this.showMessage(r.message);
        }
    },


    // ==========================================
    //   Catálogo de Benefícios
    // ==========================================

    renderCatalogPage() {
        const msg = document.getElementById('catalog-message');
        if (!EcofuturoFacade.isLoggedIn()) { if (msg) msg.classList.remove('hidden'); return; }
        if (msg) msg.classList.add('hidden');
        const cat = EcofuturoFacade.getCatalogo();
        const isAdmin = EcofuturoFacade.isAdmin();
        const grid = document.getElementById('catalog-grid');
        if (!grid) return;
        grid.innerHTML = '';
        cat.forEach(b => {
            const stock = b.stock || 0;
            const div = document.createElement('div');
            div.className = 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all benefit-card border border-gray-100';
            // Card do benefício com gradiente, estoque e botão de ação
            div.innerHTML = `<div class="h-40 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center"><span class="text-6xl">${b.imagem || '🎁'}</span></div><div class="p-4"><h4 class="text-lg font-bold text-gray-800">${b.nome}</h4><p class="text-2xl font-bold text-green-600">💰 ${b.custo} moedas</p></div><div class="p-4 border-t"><p class="text-sm font-medium ${stock > 0 ? 'text-green-600' : 'text-red-500'} mb-2">📦 ${stock > 0 ? `${stock} disponíveis` : 'Esgotado'}</p><button data-id="${b.id}" class="btn-reservar w-full ${isAdmin ? 'bg-blue-500 hover:bg-blue-600' : (stock > 0 ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed')} text-white py-2 rounded-lg font-semibold" ${!isAdmin && stock <= 0 ? 'disabled' : ''}>${isAdmin ? '✏️ Editar' : '🎁 Reservar'}</button></div>`;
            grid.appendChild(div);
        });
        // Event listeners dos botões de reserva
        document.querySelectorAll('.btn-reservar').forEach(btn => btn.onclick = () => {
            if (!EcofuturoFacade.isLoggedIn()) return this.showMessage('🔒 Faça login.');
            if (EcofuturoFacade.isAdmin()) return this.showMessage('👑 Administradores não podem reservar.');
            const r = EcofuturoFacade.reservarBeneficio(parseInt(btn.dataset.id));
            this.showMessage(r.message);
            if (r.success) {
                document.getElementById('user-coins').textContent = EcofuturoFacade.getSaldo().toFixed(2);
                this.renderCatalogPage(); // re-renderiza pra atualizar estoque
                if (this.currentPage === 'resgate') this.renderResgatePage();
            }
        });
    },


    // ==========================================
    //   Meus Resgates (Vouchers)
    // ==========================================

    renderResgatePage() {
        if (!EcofuturoFacade.isLoggedIn()) return;

        // Separa vouchers em pendentes (ativos) e histórico (finalizados)
        const pending = EcofuturoFacade.getVouchersPendentes();
        const history = EcofuturoFacade.getVouchersHistorico();

        const pList = document.getElementById('pending-vouchers-list');
        const hList = document.getElementById('history-vouchers-list');
        const noP = document.getElementById('no-pending-vouchers');
        const noH = document.getElementById('no-history-vouchers');
        if (!pList) return;
        pList.innerHTML = '';
        hList.innerHTML = '';

        // Mostra mensagem "nenhum voucher" se a lista estiver vazia
        if (!pending.length) noP?.classList.remove('hidden'); else noP?.classList.add('hidden');
        pending.forEach(v => {
            const div = document.createElement('div');
            div.className = 'flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg';
            div.innerHTML = `<div><div class="flex items-center gap-2"><span class="text-xl">🎁</span><span class="font-bold">${v.benefitName}</span></div><div class="text-sm text-gray-600">📅 ${new Date(v.redeemDate).toLocaleDateString('pt-BR')}</div><div class="text-xs text-gray-500">⏰ Expira: ${new Date(v.expirationDate).toLocaleDateString('pt-BR')}</div></div><div class="flex items-center gap-2"><span class="px-3 py-1 rounded-full text-xs font-semibold ${v.status === 'reserved' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'}">${v.status === 'reserved' ? '📌 Reservado' : '✨ Pronto'}</span></div><div class="flex gap-2 mt-2 sm:mt-0">${v.status === 'reserved' ? `<button data-id="${v.id}" class="btn-resgatar bg-green-500 text-white px-3 py-1 rounded">✅ Resgatar</button><button data-id="${v.id}" class="btn-deletar bg-red-500 text-white px-3 py-1 rounded">🗑️</button>` : `<button data-id="${v.id}" class="btn-usar bg-blue-500 text-white px-3 py-1 rounded">🎫 Usar</button><button data-id="${v.id}" class="btn-deletar bg-red-500 text-white px-3 py-1 rounded">🗑️</button>`}</div>`;
            pList.appendChild(div);
        });

        if (!history.length) noH?.classList.remove('hidden'); else noH?.classList.add('hidden');
        history.forEach(v => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-75';
            div.innerHTML = `<div><div class="flex items-center gap-2"><span>${v.status === 'expired' ? '⏰' : '✅'}</span><span class="font-bold">${v.benefitName}</span></div><div class="text-sm text-gray-600">📅 ${new Date(v.redeemDate).toLocaleDateString('pt-BR')}</div></div><span class="px-3 py-1 rounded-full text-xs font-semibold ${v.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">${v.status === 'expired' ? 'Expirado' : 'Usado'}</span>`;
            hList.appendChild(div);
        });

        // Botão de resgatar — desconta moedas e muda status pra "pronto pra usar"
        document.querySelectorAll('.btn-resgatar').forEach(btn => btn.onclick = () => {
            const r = EcofuturoFacade.resgatarVoucher(btn.dataset.id);
            this.showMessage(r.message);
            if (r.success) {
                document.getElementById('user-coins').textContent = r.newBalance.toFixed(2);
                this.renderResgatePage();
                this.renderCatalogPage();
            }
        });
        // Botão de usar — marca como utilizado e mostra QR code
        document.querySelectorAll('.btn-usar').forEach(btn => btn.onclick = () => {
            const r = EcofuturoFacade.marcarVoucherComoUsado(btn.dataset.id);
            this.showMessage(r.message);
            if (r.success) {
                this.renderResgatePage();
                const m = document.getElementById('qr-code-modal');
                const img = document.getElementById('qr-code-img');
                // Gera QR code via API externa — o código é baseado no ID do voucher
                if (img) img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Ecofuturo_${r.voucherId}`;
                m?.classList.remove('hidden');
            }
        });
        // Botão de deletar — cancela reserva ou exclui voucher pago (com reembolso)
        document.querySelectorAll('.btn-deletar').forEach(btn => btn.onclick = () => {
            const r = EcofuturoFacade.deletarVoucher(btn.dataset.id);
            this.showMessage(r.message);
            if (r.success) {
                document.getElementById('user-coins').textContent = EcofuturoFacade.getSaldo().toFixed(2);
                this.renderResgatePage();
                this.renderCatalogPage();
            }
        });
    },


    // ==========================================
    //   Relatórios e Estatísticas
    // ==========================================

    renderReportsPage() {
        const period = document.getElementById('report-period-filter').value;
        const periodText = { total: 'Total Geral', today: 'Hoje', week: 'Últimos 7 dias', month: 'Últimos 30 dias', year: 'Este Ano' }[period];

        // Estatísticas pessoais do usuário logado
        const p = EcofuturoFacade.getEstatisticasPessoais(period);
        if (p) {
            document.getElementById('personal-co2').textContent = p.totalCO2.toFixed(2);
            document.getElementById('personal-activities').textContent = p.totalActivities;
        }

        // Estatísticas da comunidade inteira
        const c = EcofuturoFacade.getEstatisticasComunidade(period);
        document.getElementById('total-co2').textContent = c.totalCO2.toFixed(2);
        document.getElementById('total-activities').textContent = c.totalActivities;
        document.getElementById('total-coins-donated').textContent = c.totalMoedasDoadas.toFixed(2);
        document.getElementById('total-users').textContent = c.totalUsuarios;
        document.getElementById('community-reports-title').textContent = `👥 Impacto da Comunidade (${periodText})`;
        this.renderChart(c.co2ByTransport);
    },

    // Renderiza o gráfico de barras com dados de CO2 por tipo de transporte
    renderChart(data) {
        const ctx = document.getElementById('co2-chart');
        if (!ctx) return;
        if (this.chart) this.chart.destroy(); // destrói o gráfico anterior antes de recriar
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['🚲 Bicicleta', '🚶 Caminhada', '🚌 Transporte Público', '⚡ Carro Elétrico'],
                datasets: [{
                    label: 'CO₂ Reduzido (kg)',
                    data: [data.bicicleta.toFixed(2), data.caminhada.toFixed(2), data.transportePublico.toFixed(2), data.carroEletrico.toFixed(2)],
                    backgroundColor: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'], // tons de verde
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                scales: { y: { beginAtZero: true, title: { display: true, text: 'kg de CO₂' } } },
                plugins: { legend: { display: false } }
            }
        });
    },


    // ==========================================
    //   Painel Admin — Gerenciamento de Usuários
    // ==========================================

    renderAdminManagementPage() {
        if (EcofuturoFacade.isAdmin()) this.renderUserList();
    },

    // Monta a tabela de usuários com botões de edição e exclusão
    renderUserList() {
        const users = EcofuturoFacade.listarUsuarios();
        const body = document.getElementById('admin-user-list-body');
        if (!body) return;
        body.innerHTML = '';
        document.getElementById('user-count').textContent = users.length;
        users.forEach(u => {
            const row = body.insertRow();
            row.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${u.name}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${u.email}</td>
                <td class="px-6 py-4 text-sm">${EcofuturoFacade.formatarTipoUsuario(u.type)}</td>
                <td class="px-6 py-4 text-sm font-bold text-green-600">${u.coins.toFixed(2)}</td>
                <td class="px-6 py-4 text-sm">
                    <button data-email="${u.email}" class="btn-edit-user text-blue-600 hover:text-blue-800 font-semibold mr-3">✏️ Editar</button>
                    <button data-email="${u.email}" class="btn-delete-user text-red-600 hover:text-red-800 font-semibold">🗑️ Excluir</button>
                </td>
            `;
        });
        document.querySelectorAll('.btn-edit-user').forEach(btn => btn.onclick = () => {
            const u = EcofuturoFacade.listarUsuarios().find(u => u.email === btn.dataset.email);
            if (u) this.showEditUserModal(u);
        });
        document.querySelectorAll('.btn-delete-user').forEach(btn => btn.onclick = () => {
            if (confirm('Excluir este usuário?')) {
                const r = EcofuturoFacade.deletarUsuario(btn.dataset.email);
                this.showMessage(r.message);
                if (r.success) this.renderUserList();
            }
        });
    },

    // Preenche o modal de edição com os dados do usuário selecionado
    showEditUserModal(user) {
        document.getElementById('edit-user-original-email').value = user.email;
        document.getElementById('edit-user-nome').value = user.name;
        document.getElementById('edit-user-email').value = user.email;
        document.getElementById('edit-user-tipo').value = user.type;
        document.getElementById('edit-user-coins').value = user.coins;
        document.getElementById('edit-user-modal').classList.remove('hidden');
    },

    handleAdminEditUser(e) {
        e.preventDefault();
        const r = EcofuturoFacade.editarUsuario(
            document.getElementById('edit-user-original-email').value,
            {
                name: document.getElementById('edit-user-nome').value.trim(),
                type: document.getElementById('edit-user-tipo').value,
                coins: parseFloat(document.getElementById('edit-user-coins').value)
            }
        );
        this.showMessage(r.message);
        if (r.success) {
            this.renderUserList();
            document.getElementById('edit-user-modal').classList.add('hidden');
        }
    },

    handleAdminAddUser(e) {
        e.preventDefault();
        const r = EcofuturoFacade.adicionarUsuario(
            document.getElementById('admin-add-nome').value.trim(),
            document.getElementById('admin-add-email').value.trim(),
            document.getElementById('admin-add-password').value,
            document.getElementById('admin-add-tipo').value
        );
        this.showMessage(r.message);
        if (r.success) {
            this.renderUserList();
            e.target.reset();
        }
    },


    // ==========================================
    //   Painel Admin — Parceiros e Benefícios
    // ==========================================

    renderAdminPartnersPage() {
        if (EcofuturoFacade.isAdmin()) {
            this.renderPartnersList();
            this.renderBenefitsList();
        }
    },

    renderPartnersList() {
        const partners = EcofuturoFacade.listarParceiros();
        const body = document.getElementById('admin-partner-list-body');
        if (!body) return;
        body.innerHTML = '';
        document.getElementById('partner-count').textContent = partners.length;
        partners.forEach(p => {
            const row = body.insertRow();
            row.innerHTML = `<td class="px-6 py-4 text-sm font-medium text-gray-900">🏢 ${p.nome}</td><td class="px-6 py-4 text-sm"><button data-id="${p.id}" class="btn-delete-partner text-red-600 hover:text-red-800 font-semibold">🗑️ Excluir</button></td>`;
        });
        document.querySelectorAll('.btn-delete-partner').forEach(btn => btn.onclick = () => {
            const r = EcofuturoFacade.deletarParceiro(parseInt(btn.dataset.id));
            this.showMessage(r.message);
            if (r.success) this.renderPartnersList();
        });
    },

    handleAdminAddPartner(e) {
        e.preventDefault();
        const r = EcofuturoFacade.adicionarParceiro(document.getElementById('partner-name').value.trim());
        this.showMessage(r.message);
        if (r.success) {
            this.renderPartnersList();
            e.target.reset();
        }
    },

    // Tabela de benefícios com campo de estoque editável inline
    renderBenefitsList() {
        const cat = EcofuturoFacade.getCatalogo();
        const body = document.getElementById('admin-benefit-list-body');
        if (!body) return;
        body.innerHTML = '';
        cat.forEach(b => {
            const row = body.insertRow();
            row.innerHTML = `
                <td class="px-6 py-4 text-sm text-gray-500">${b.id}</td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${b.nome}</td>
                <td class="px-6 py-4 text-sm font-bold text-green-600">💰 ${b.custo}</td>
                <td class="px-6 py-4 text-sm"><input type="number" data-id="${b.id}" value="${b.stock}" class="stock-input w-24 border rounded-md text-center py-1 px-2"></td>
                <td class="px-6 py-4 text-sm">
                    <button data-id="${b.id}" class="btn-delete-benefit text-red-600 hover:text-red-800 font-semibold mr-3">🗑️ Excluir</button>
                    <button data-id="${b.id}" class="btn-update-stock text-blue-600 hover:text-blue-800 font-semibold">🔄 Atualizar</button>
                </td>
            `;
        });
        document.querySelectorAll('.btn-delete-benefit').forEach(btn => btn.onclick = () => {
            const r = EcofuturoFacade.deletarBeneficio(parseInt(btn.dataset.id));
            this.showMessage(r.message);
            if (r.success) {
                this.renderBenefitsList();
                this.renderCatalogPage();
            }
        });
        // Atualização pontual do estoque — pega o valor do input correspondente
        document.querySelectorAll('.btn-update-stock').forEach(btn => btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            const input = document.querySelector(`.stock-input[data-id="${id}"]`);
            const r = EcofuturoFacade.atualizarEstoqueBeneficio(id, parseInt(input.value));
            this.showMessage(r.message);
            if (r.success) {
                this.renderBenefitsList();
                this.renderCatalogPage();
            }
        });
    },

    handleAdminAddBenefit(e) {
        e.preventDefault();
        const r = EcofuturoFacade.adicionarBeneficio(
            document.getElementById('benefit-name').value.trim(),
            parseInt(document.getElementById('benefit-cost').value),
            parseInt(document.getElementById('benefit-stock').value)
        );
        this.showMessage(r.message);
        if (r.success) {
            this.renderBenefitsList();
            this.renderCatalogPage();
            e.target.reset();
        }
    },


    // ==========================================
    //   Animações e efeitos visuais
    // ==========================================

    // Mostra uma animação flutuante quando o usuário ganha moedas
    animateCoinGain(coins) {
        const coin = document.getElementById('coin-animation');
        coin.classList.remove('hidden');
        const msg = document.createElement('div');
        msg.className = 'absolute text-2xl font-bold text-yellow-500 bg-gray-900 px-4 py-2 rounded-full';
        msg.style.cssText = 'top:50%;left:50%;transform:translate(-50%,-50%)';
        msg.textContent = `+${coins.toFixed(2)}💰`;
        coin.appendChild(msg);
        setTimeout(() => { coin.classList.add('hidden'); msg.remove(); }, 1500);
    },

    /**
     * Carrossel de imagens de fundo na tela de login.
     * Troca a imagem a cada 10 segundos com transição suave (CSS opacity).
     */
    startBackgroundAnimation() {
        const imgs = [document.getElementById('bg-img-1'), document.getElementById('bg-img-2'), document.getElementById('bg-img-3')];
        let idx = 0;
        setInterval(() => {
            imgs[idx]?.classList.remove('show');
            imgs[idx]?.classList.add('hide');
            idx = (idx + 1) % 3;
            imgs[idx]?.classList.remove('hide');
            imgs[idx]?.classList.add('show');
        }, 10000);
    }
};

// Inicializa a aplicação quando a página terminar de carregar
window.onload = () => app.init();
