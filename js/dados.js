/*
 * Contratação de previdência: dados de exemplo.
 * Fundos, taxas e regras são fictícios, criados para o case.
 */
(function () {
  'use strict';

  var fundos = [
    {
      id: 'rf-prev', nome: 'Amparo Renda Fixa Prev FI', perfil: 'Conservador',
      taxa: 1.0, performance: 'Não', minMensal: 100, minAporte: 1200, rendaVariavel: 'Não investe',
      descricao: 'Investe em títulos públicos federais e em crédito privado de baixo risco. Busca acompanhar o CDI com pouca oscilação.'
    },
    {
      id: 'di-prev', nome: 'Amparo DI Prev FIC FI', perfil: 'Conservador',
      taxa: 0.7, performance: 'Não', minMensal: 500, minAporte: 10000, rendaVariavel: 'Não investe',
      descricao: 'Acompanha o CDI com títulos públicos de curto prazo. É a opção de menor risco da prateleira.'
    },
    {
      id: 'inflacao-prev', nome: 'Amparo Inflação Prev FI', perfil: 'Conservador',
      taxa: 0.8, performance: 'Não', minMensal: 100, minAporte: 1200, rendaVariavel: 'Não investe',
      descricao: 'Investe em títulos atrelados ao IPCA para proteger o poder de compra no longo prazo.'
    },
    {
      id: 'credito-prev', nome: 'Amparo Crédito Privado Prev FIC FI', perfil: 'Conservador',
      taxa: 0.9, performance: 'Não', minMensal: 100, minAporte: 1200, rendaVariavel: 'Não investe',
      descricao: 'Combina títulos públicos com debêntures de empresas bem avaliadas, buscando render um pouco acima do CDI.'
    },
    {
      id: 'juro-real', nome: 'Amparo Juro Real Prev FIC FIM', perfil: 'Moderado',
      taxa: 1.1, performance: 'Não', minMensal: 100, minAporte: 1200, rendaVariavel: 'Até 20% do patrimônio',
      descricao: 'Fundo multimercado com foco em juros reais, com uma parcela pequena em ações para diversificar.'
    },
    {
      id: 'multi-20', nome: 'Amparo Multi 20 Prev FIC FIM', perfil: 'Moderado',
      taxa: 1.2, performance: 'Não', minMensal: 500, minAporte: 10000, rendaVariavel: 'Até 20% do patrimônio',
      descricao: 'Multimercado com até 20% em ações e o restante em renda fixa, para quem aceita alguma oscilação.'
    },
    {
      id: 'multi-40', nome: 'Amparo Multi 40 Prev FIC FIM', perfil: 'Moderado',
      taxa: 1.5, performance: 'Não', minMensal: 100, minAporte: 1200, rendaVariavel: 'Até 40% do patrimônio',
      descricao: 'Multimercado com até 40% em ações. Busca retornos maiores no longo prazo, com mais oscilação no caminho.'
    },
    {
      id: 'global', nome: 'Amparo Global Prev FIC FIM', perfil: 'Moderado',
      taxa: 1.4, performance: 'Não', minMensal: 500, minAporte: 5000, rendaVariavel: 'Até 40% do patrimônio',
      descricao: 'Diversifica com ativos no exterior, com proteção cambial parcial, para não depender só da economia brasileira.'
    },
    {
      id: 'multi-plus', nome: 'Amparo Multimercado Plus Prev FIC FIM', perfil: 'Arrojado',
      taxa: 1.6, performance: '20% do que passar do CDI', minMensal: 500, minAporte: 10000, rendaVariavel: 'Até 49% do patrimônio',
      descricao: 'Estratégia ativa em juros, câmbio e bolsa. Pode ter meses negativos em busca de um retorno maior.'
    },
    {
      id: 'acoes-49', nome: 'Amparo Ações 49 Prev FIC FIM', perfil: 'Arrojado',
      taxa: 1.8, performance: 'Não', minMensal: 100, minAporte: 1200, rendaVariavel: 'Até 49% do patrimônio',
      descricao: 'Mantém perto de 49% em ações brasileiras, o máximo permitido para a maioria dos planos de previdência.'
    },
    {
      id: 'acoes-brasil', nome: 'Amparo Ações Brasil Prev FIA', perfil: 'Arrojado',
      taxa: 2.0, performance: '20% do que passar do Ibovespa', minMensal: 1000, minAporte: 5000, rendaVariavel: 'Até 100% do patrimônio',
      descricao: 'Investe quase todo o patrimônio em ações. Indicado só para quem tem perfil arrojado e prazo longo.'
    }
  ];

  var listas = {
    estadosCivis: ['Solteiro(a)', 'Casado(a)', 'União estável', 'Divorciado(a)', 'Viúvo(a)'],
    profissoes: [
      'Administrador(a)', 'Advogado(a)', 'Analista de sistemas', 'Arquiteto(a)', 'Autônomo(a)',
      'Comerciante', 'Contador(a)', 'Designer', 'Empresário(a)', 'Enfermeiro(a)', 'Engenheiro(a)',
      'Entregador(a)', 'Estudante', 'Funcionário(a) público(a)', 'Médico(a)', 'Motorista',
      'Professor(a)', 'Vendedor(a)', 'Outra'
    ],
    documentos: ['RG', 'CNH', 'RNE / RNM', 'Passaporte', 'Carteira de conselho profissional'],
    orgaos: ['SSP', 'DETRAN', 'Polícia Federal', 'Conselho profissional', 'Outro'],
    ufs: [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
      'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ],
    paises: ['Brasil', 'Argentina', 'Chile', 'Estados Unidos', 'Paraguai', 'Portugal', 'Uruguai', 'Outro'],
    bancos: [
      '001 · Banco do Brasil', '033 · Santander', '077 · Banco Inter', '104 · Caixa Econômica Federal',
      '237 · Bradesco', '260 · Nu Pagamentos', '336 · C6 Bank', '341 · Itaú Unibanco', '748 · Sicredi', '756 · Sicoob'
    ],
    vencimentos: ['5', '10', '15', '20', '25']
  };

  // Dados de exemplo para quem quer só conhecer o fluxo.
  var exemplo = {
    cpf: '529.982.247-25',
    nascimento: '14/03/1992',
    aposentadoria: '65',
    plano: 'VGBL',
    regime: 'Regressivo',
    mensal: '300,00',
    aporte: '2.000,00',
    fundo: 'multi-40',
    sexo: 'Feminino',
    nome: 'Marina Albuquerque Costa',
    estadoCivil: 'Casado(a)',
    renda: '6.500,00',
    profissao: 'Designer',
    docTipo: 'RG',
    docNumero: '32.456.789-1',
    docExpedicao: '20/07/2015',
    docOrgao: 'SSP',
    cep: '04538-132',
    logradouro: 'Avenida das Acácias',
    numero: '1200',
    complemento: 'Apto 84',
    bairro: 'Jardim Paulistano',
    cidade: 'São Paulo',
    uf: 'SP',
    pais: 'Brasil',
    celDdi: '55',
    celDdd: '11',
    celNumero: '98765-4321',
    email: 'marina.costa@exemplo.com',
    emailConfirma: 'marina.costa@exemplo.com'
  };

  window.PREV_DADOS = { fundos: fundos, listas: listas, exemplo: exemplo };
})();
