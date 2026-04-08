/**
 * EcofuturoFacade.js
 * 
 * Funciona como a "porta de entrada" do sistema — o front-end só conversa 
 * com essa classe, nunca diretamente com o SistemaEcofuturo.
 * 
 * Isso facilita bastante na hora de dar manutenção, porque se precisar 
 * mudar a lógica interna, é só mexer no SistemaEcofuturo sem quebrar a UI.
 * 
 * Padrão Facade aplicado conforme visto na matéria de Engenharia de Software.
 */

import SistemaEcofuturo from './SistemaEcofuturo.js';

export default class EcofuturoFacade {
    // Getter privado — toda chamada passa por aqui pra pegar a instância do sistema
    static get #sistema() { 
        return SistemaEcofuturo.getInstance(); 
    }
    
    // ---- Autenticação ----
    static login(e, p) { return this.#sistema.login(e, p); }
    static logout() { return this.#sistema.logout(); }
    static cadastrar(n, e, s, t) { return this.#sistema.cadastrar(n, e, s, t); }
    static isLoggedIn() { return this.#sistema.isLoggedIn; }
    static getCurrentUser() { return this.#sistema.getCurrentUserSafe(); }
    static isAdmin() { return this.getCurrentUser()?.type === 'admin'; }
    static getSaldo() { return this.#sistema.getSaldoUsuario(); }
    
    // ---- Atividades e Estatísticas ----
    static registrarAtividade(t, d, dt) { return this.#sistema.registrarAtividade(t, d, dt); }
    static getHistoricoAtividades(l) { return this.#sistema.getHistoricoAtividades(l); }
    static getEstatisticasPessoais(p) { return this.#sistema.getEstatisticasPessoais(p); }
    static getEstatisticasComunidade(p) { return this.#sistema.getEstatisticasComunidade(p); }
    
    // ---- Catálogo e Vouchers ----
    static getCatalogo() { return this.#sistema.getCatalogo(); }
    static reservarBeneficio(id) { return this.#sistema.reservarBeneficio(id); }
    static resgatarVoucher(id) { return this.#sistema.resgatarVoucher(id); }
    static marcarVoucherComoUsado(id) { return this.#sistema.marcarVoucherComoUsado(id); }
    static deletarVoucher(id) { return this.#sistema.deletarVoucher(id); }
    static getVouchersPendentes() { return this.#sistema.getVouchersPendentes(); }
    static getVouchersHistorico() { return this.#sistema.getVouchersHistorico(); }
    static verificarExpiracao() { return this.#sistema.verificarExpiracaoVouchers(); }
    
    // ---- Administração de Usuários ----
    static listarUsuarios() { return this.#sistema.listarUsuarios(); }
    static adicionarUsuario(n, e, s, t) { return this.#sistema.adicionarUsuario(n, e, s, t); }
    static editarUsuario(eOriginal, d) { return this.#sistema.editarUsuario(eOriginal, d); }
    static deletarUsuario(e) { return this.#sistema.deletarUsuario(e); }
    static deletarTodosUsuarios() { return this.#sistema.deletarTodosUsuarios(); }
    
    // ---- Administração de Parceiros e Benefícios ----
    static listarParceiros() { return this.#sistema.listarParceiros(); }
    static adicionarParceiro(n) { return this.#sistema.adicionarParceiro(n); }
    static deletarParceiro(id) { return this.#sistema.deletarParceiro(id); }
    static adicionarBeneficio(n, c, e, i) { return this.#sistema.adicionarBeneficio(n, c, e, i); }
    static atualizarEstoqueBeneficio(id, e) { return this.#sistema.atualizarEstoqueBeneficio(id, e); }
    static deletarBeneficio(id) { return this.#sistema.deletarBeneficio(id); }
    
    /**
     * Mapeia o valor técnico do tipo de usuário pra um texto legível.
     * Usado nas tabelas do painel admin pra exibir bonito pro admin.
     */
    static formatarTipoUsuario(t) {
        return { 
            aluno: 'Aluno', 
            professor: 'Professor', 
            funcionarioEsuda: 'Funcionário ESUDA', 
            comunidadeExterna: 'Comunidade Externa', 
            admin: 'Administrador' 
        }[t] || t;
    }
}
