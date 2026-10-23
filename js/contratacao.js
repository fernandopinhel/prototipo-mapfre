/*
 * Contratação de previdência: fluxo em 4 etapas.
 *
 * - Etapas com indicador acessível (aria-current="step"), foco no título de
 *   cada etapa e título da aba atualizado.
 * - Validação por etapa, com mensagem no campo (aria-invalid + aria-describedby)
 *   e resumo de erros com links. Depois da primeira tentativa, o erro some
 *   enquanto a pessoa corrige.
 * - Máscaras (CPF, data, dinheiro, CEP, telefone).
 * - Tabela de fundos com filtro por perfil, paginação, detalhes em <dialog> e
 *   regra de entrada validada contra os valores digitados.
 * - Resumo da compra ao vivo, confirmação e tela de sucesso com protocolo.
 * - Rascunho salvo no sessionStorage.
 *
 * Nada é enviado a servidor: o protótipo não tem back-end.
 */
(function () {
  'use strict';

  var PREV = window.PREV;
  var DADOS = window.PREV_DADOS;
  var TOTAL_ETAPAS = 4;
  var POR_PAGINA = 5;

  var estado = {
    etapa: 1,
    concluidas: 0,       // maior etapa que já passou na validação
    tentou: {},          // etapas em que a pessoa já clicou em "Próximo"
    fundo: '',
    perfil: '',
    pagina: 1
  };

  var form, resumoErros;

  /* ------------------------------------------------------------ Utilitários */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function digitos(v) { return String(v || '').replace(/\D/g, ''); }

  function fundoPorId(id) {
    for (var i = 0; i < DADOS.fundos.length; i++) if (DADOS.fundos[i].id === id) return DADOS.fundos[i];
    return null;
  }

  // "1.234,56" -> 1234.56
  function valorMoeda(v) {
    var d = digitos(v);
    return d ? Number(d) / 100 : 0;
  }

  // "dd/mm/aaaa" -> Date, só se a data existir no calendário.
  function lerData(v) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(v || ''));
    if (!m) return null;
    var dia = Number(m[1]), mes = Number(m[2]) - 1, ano = Number(m[3]);
    var data = new Date(ano, mes, dia);
    if (data.getFullYear() !== ano || data.getMonth() !== mes || data.getDate() !== dia) return null;
    return data;
  }

  function idade(nascimento) {
    var hoje = new Date();
    var anos = hoje.getFullYear() - nascimento.getFullYear();
    var m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) anos--;
    return anos;
  }

  function idadeAtual() {
    var nasc = lerData(form.elements.nascimento.value);
    return nasc ? idade(nasc) : null;
  }

  function porcentagem(n) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  }

  function textoDoRotulo(el) {
    if (el.hasAttribute('data-nome')) return el.getAttribute('data-nome');
    var label = el.id ? $('label[for="' + el.id + '"]') : null;
    if (!label) return el.name;
    var copia = label.cloneNode(true);
    $all('.opt, .visually-hidden', copia).forEach(function (n) { n.remove(); });
    return copia.textContent.replace(/\s+/g, ' ').trim();
  }

  /* --------------------------------------------------------------- Máscaras */
  var mascaras = {
    cpf: function (v) {
      return digitos(v).slice(0, 11)
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
    },
    data: function (v) {
      var d = digitos(v).slice(0, 8);
      if (d.length > 4) return d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
      if (d.length > 2) return d.slice(0, 2) + '/' + d.slice(2);
      return d;
    },
    cep: function (v) {
      var d = digitos(v).slice(0, 8);
      return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
    },
    telefone: function (v) {
      var d = digitos(v).slice(0, 9);
      if (d.length <= 4) return d;
      return d.slice(0, d.length - 4) + '-' + d.slice(-4);
    },
    // Dinheiro em centavos: 30000 -> 300,00
    moeda: function (v) {
      var d = digitos(v).replace(/^0+/, '').slice(0, 11);
      if (!d) return '';
      while (d.length < 3) d = '0' + d;
      var inteiro = d.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return inteiro + ',' + d.slice(-2);
    },
    digitos: function (v, el) {
      var max = Number(el.getAttribute('maxlength')) || 20;
      return digitos(v).slice(0, max);
    },
    digito: function (v) {
      return String(v || '').toUpperCase().replace(/[^0-9X]/g, '').slice(0, 1);
    },
    documento: function (v) {
      return String(v || '').toUpperCase().replace(/[^A-Z0-9.\-/]/g, '').slice(0, 20);
    }
  };

  /* ------------------------------------------------------------- Validações */
  function cpfValido(valor) {
    var cpf = digitos(valor);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    for (var t = 9; t < 11; t++) {
      var soma = 0;
      for (var i = 0; i < t; i++) soma += Number(cpf[i]) * (t + 1 - i);
      if (((soma * 10) % 11) % 10 !== Number(cpf[t])) return false;
    }
    return true;
  }

  // Cada regra devolve uma mensagem de erro ou '' quando o valor é válido.
  var regras = {
    cpf: function (v) {
      return cpfValido(v) ? '' : 'Esse CPF não parece válido. Pode conferir os números?';
    },
    nascimento: function (v) {
      var data = lerData(v);
      if (!data) return 'Essa data não existe. Use o formato dia/mês/ano, assim: 25/08/1990.';
      if (data > new Date()) return 'Essa data ainda não chegou. Pode conferir o ano?';
      var anos = idade(data);
      if (anos < 18) return 'Para contratar, você precisa ter 18 anos ou mais.';
      if (anos > 80) return 'Pela internet, dá para contratar até os 80 anos. Fale com a gente pelo app.';
      return '';
    },
    aposentadoria: function (v) {
      var anos = Number(v);
      var atual = idadeAtual();
      if (anos > 90) return 'Use uma idade de até 90 anos.';
      if (atual !== null && anos <= atual) return 'Precisa ser maior que a sua idade hoje, que é ' + atual + ' anos.';
      if (anos < 19) return 'Use uma idade a partir de 19 anos.';
      return '';
    },
    nome: function (v) {
      return v.trim().split(/\s+/).length < 2 ? 'Coloque nome e sobrenome, como no documento.' : '';
    },
    renda: function (v) {
      return valorMoeda(v) > 0 ? '' : 'Coloque sua renda mensal, em reais.';
    },
    documento: function (v) {
      return v.replace(/[^A-Z0-9]/g, '').length >= 5 ? '' : 'Esse número parece curto. Confira no documento.';
    },
    expedicao: function (v) {
      var data = lerData(v);
      if (!data) return 'Essa data não existe. Use o formato dia/mês/ano.';
      if (data > new Date()) return 'A data de expedição não pode ser no futuro.';
      var nasc = lerData(form.elements.nascimento.value);
      if (nasc && data < nasc) return 'A data de expedição precisa ser depois do seu nascimento.';
      return '';
    },
    cep: function (v) {
      return digitos(v).length === 8 ? '' : 'O CEP tem 8 números. Confira se faltou algum.';
    },
    ddi: function (v) {
      return /^\d{1,3}$/.test(v) && Number(v) > 0 ? '' : 'Use o código do país, por exemplo 55 para o Brasil.';
    },
    ddd: function (v) {
      return /^[1-9]\d$/.test(v) ? '' : 'O DDD tem 2 números, por exemplo 11.';
    },
    celular: function (v) {
      var d = digitos(v);
      if (form.elements.celDdi.value === '55' && !/^9\d{8}$/.test(d)) return 'O celular tem 9 números e começa com 9, assim: 91234-5678.';
      return d.length >= 8 ? '' : 'Confira o número do celular.';
    },
    telefone: function (v) {
      var d = digitos(v);
      return d.length === 8 || d.length === 9 ? '' : 'O telefone tem 8 ou 9 números.';
    },
    email: function (v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Esse e-mail parece incompleto. Use o formato nome@exemplo.com.';
    },
    confirmaEmail: function (v) {
      return v.trim().toLowerCase() === form.elements.email.value.trim().toLowerCase() ? '' : 'Os e-mails não são iguais. Confira as duas digitações.';
    },
    agencia: function (v) {
      return v.length === 4 ? '' : 'A agência tem 4 números, sem o dígito.';
    },
    conta: function (v) {
      return v.length >= 3 ? '' : 'Confira o número da conta, sem o dígito.';
    },
    valores: function (v, el) {
      return validarValores()[el.id] || '';
    }
  };

  // Contribuição mensal e aporte são validados juntos e contra o fundo escolhido.
  function validarValores() {
    var erros = {};
    var mensal = valorMoeda(form.elements.mensal.value);
    var aporte = valorMoeda(form.elements.aporte.value);
    var fundo = fundoPorId(estado.fundo);

    if (!mensal && !aporte) {
      erros.mensal = 'Coloque a contribuição mensal, o aporte inicial ou os dois.';
      return erros;
    }
    if (mensal > 100000) erros.mensal = 'Pela internet, a contribuição mensal vai até R$ 100.000,00.';
    if (fundo && mensal && mensal < fundo.minMensal) {
      erros.mensal = 'Nesse fundo, a contribuição mínima é de ' + PREV.moeda(fundo.minMensal) + ' por mês.';
    }
    if (fundo && aporte && aporte < fundo.minAporte) {
      erros.aporte = 'Nesse fundo, o aporte mínimo é de ' + PREV.moeda(fundo.minAporte) + '.';
    }
    return erros;
  }

  var mensagensDeGrupo = {
    plano: 'Escolha o tipo de plano: PGBL ou VGBL.',
    regime: 'Escolha o regime tributário: progressivo ou regressivo.',
    sexo: 'Escolha uma opção em Sexo.',
    formaPagamento: 'Escolha como quer pagar: boleto ou débito em conta.',
    fundo: 'Escolha um fundo na lista.'
  };

  function grupoTelPreenchido() {
    return ['telDdi', 'telDdd', 'telNumero'].some(function (n) { return form.elements[n].value.trim(); });
  }

  function mensagemDoCampo(el) {
    if (el.type === 'radio') {
      var marcado = form.querySelector('input[name="' + el.name + '"]:checked');
      return marcado ? '' : mensagensDeGrupo[el.name];
    }
    if (el.type === 'checkbox') {
      return el.checked ? '' : 'Para contratar, marque que leu e aceita o regulamento.';
    }

    var valor = el.value.trim();
    var obrigatorio = el.required || (el.getAttribute('data-grupo') === 'tel' && grupoTelPreenchido());
    if (!valor) {
      if (el.getAttribute('data-validate') === 'valores') return regras.valores(valor, el);
      if (!obrigatorio) return '';
      return el.tagName === 'SELECT'
        ? 'Escolha uma opção em ' + textoDoRotulo(el) + '.'
        : 'Falta preencher ' + textoDoRotulo(el) + '.';
    }
    var regra = regras[el.getAttribute('data-validate')];
    return regra ? regra(valor, el) : '';
  }

  /* ---------------------------------------------------- Erros de cada campo */
  function idDoErro(el) {
    return (el.type === 'radio' ? el.name : el.id) + '-erro';
  }

  // Onde a mensagem entra, quem fica marcado como inválido e quem recebe o foco.
  function alvoDoErro(el) {
    if (el.name === 'fundo' || el.id === 'fundos') {
      var fs = $('#fundos');
      return { caixa: fs, depois: $('.tabela-fundos', fs), campos: [fs].concat($all('.fundo__radio')), destaque: fs };
    }
    if (el.type === 'radio') {
      var radios = $all('input[name="' + el.name + '"]');
      var grupo = el.name === 'formaPagamento' ? $('.formas') : el.closest('fieldset');
      return { caixa: grupo, depois: null, campos: radios, destaque: grupo.classList.contains('cartao') ? grupo : null };
    }
    if (el.type === 'checkbox') {
      return { caixa: el.closest('.aceite'), depois: null, campos: [el], destaque: null };
    }
    var extra = el.closest('.opcao__extra');
    var caixa = extra ? el.closest('[class^="col-"]') : el.closest('.cartao');
    return { caixa: caixa, depois: null, campos: [el], destaque: extra ? null : caixa };
  }

  function definirDescricao(campo, id, adicionar) {
    var ids = (campo.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    ids = ids.filter(function (x) { return x !== id; });
    if (adicionar) ids.push(id);
    if (ids.length) campo.setAttribute('aria-describedby', ids.join(' '));
    else campo.removeAttribute('aria-describedby');
  }

  function mostrarErro(el, mensagem) {
    var alvo = alvoDoErro(el);
    var id = idDoErro(el);
    var p = document.getElementById(id);
    if (!p) {
      p = PREV.el('p', 'field-error');
      p.id = id;
      if (alvo.depois) alvo.depois.insertAdjacentElement('afterend', p);
      else if (alvo.caixa.tagName === 'FIELDSET' && el.name === 'formaPagamento') alvo.caixa.insertAdjacentElement('afterend', p);
      else alvo.caixa.appendChild(p);
    }
    p.textContent = '';
    p.appendChild(PREV.icon('alert'));
    p.appendChild(document.createTextNode(mensagem));
    alvo.campos.forEach(function (c) {
      if (c.tagName !== 'FIELDSET') c.setAttribute('aria-invalid', 'true');
      definirDescricao(c, id, true);
    });
    if (alvo.destaque) alvo.destaque.classList.add('is-invalido');
  }

  function limparErro(el) {
    var alvo = alvoDoErro(el);
    var id = idDoErro(el);
    var p = document.getElementById(id);
    if (p) p.remove();
    alvo.campos.forEach(function (c) {
      c.removeAttribute('aria-invalid');
      definirDescricao(c, id, false);
    });
    if (alvo.destaque) alvo.destaque.classList.remove('is-invalido');
    removerDoResumo(id);
  }

  // Valida um campo e mostra ou limpa o erro. Devolve a mensagem.
  function validarCampo(el) {
    var mensagem = el.name === 'fundo' || el.id === 'fundos'
      ? (estado.fundo ? '' : mensagensDeGrupo.fundo)
      : mensagemDoCampo(el);
    if (mensagem) mostrarErro(el, mensagem);
    else limparErro(el);
    return mensagem;
  }

  /* --------------------------------------------------------- Resumo de erros */
  function atualizarTituloDoResumo() {
    var restantes = $all('li', resumoErros).length;
    if (!restantes) { resumoErros.hidden = true; return; }
    $('.error-summary__titulo span', resumoErros).textContent = restantes === 1
      ? 'Falta acertar 1 item para continuar'
      : 'Faltam acertar ' + restantes + ' itens para continuar';
  }

  function removerDoResumo(idErro) {
    if (resumoErros.hidden) return;
    var item = $('li[data-erro="' + idErro + '"]', resumoErros);
    if (item) item.remove();
    atualizarTituloDoResumo();
  }

  function mostrarResumo(erros) {
    var lista = $('.error-summary__lista', resumoErros);
    lista.textContent = '';
    erros.forEach(function (erro) {
      var li = PREV.el('li');
      li.setAttribute('data-erro', erro.idErro);
      var a = PREV.el('a', null, erro.mensagem);
      a.href = '#' + erro.foco.id;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        focarCampo(erro.foco);
      });
      li.appendChild(a);
      lista.appendChild(li);
    });
    resumoErros.hidden = false;
    atualizarTituloDoResumo();
    resumoErros.focus();
    resumoErros.scrollIntoView({ block: 'start' });
  }

  function focarCampo(el) {
    if (el.name === 'fundo' || el.id === 'fundos') {
      el = $('.fundo__radio:checked') || $('.fundo__radio');
    }
    el.focus({ preventScroll: true });
    el.closest('.cartao, .fundo, .aceite, .formas, [class^="col-"]').scrollIntoView({ block: 'center' });
  }

  /* --------------------------------------------------- Validação por etapa */
  function camposDaEtapa(n) {
    var etapa = $('#etapa-' + n);
    var vistos = {};
    return $all('input[name], select[name]', etapa).filter(function (el) {
      if (el.name === 'perfil' || el.name === 'fundo') return false;
      if (el.closest('[hidden]') || el.disabled) return false;
      if (el.type === 'radio') {
        if (vistos[el.name]) return false;
        vistos[el.name] = true;
      }
      return true;
    });
  }

  function validarEtapa(n) {
    var erros = [];
    var campos = camposDaEtapa(n);
    if (n === 2) campos.push($('#fundos'));

    campos.forEach(function (el) {
      var mensagem = validarCampo(el);
      if (mensagem) erros.push({ idErro: idDoErro(el), mensagem: mensagem, foco: el.id === 'fundos' ? el : el });
    });
    return erros;
  }

  /* ----------------------------------------------------------------- Etapas */
  function atualizarIndicador() {
    $all('.etapa').forEach(function (botao) {
      var n = Number(botao.getAttribute('data-ir'));
      var atual = n === estado.etapa && !estado.finalizado;
      var feita = estado.finalizado || (n <= estado.concluidas && !atual);
      botao.classList.toggle('is-feita', feita);
      botao.closest('.etapas__item').classList.toggle('is-feita', feita);
      if (atual) botao.setAttribute('aria-current', 'step');
      else botao.removeAttribute('aria-current');
      botao.disabled = estado.finalizado || n > estado.concluidas + 1;
      $('.etapa__estado', botao).textContent = atual ? ', etapa atual' : feita ? ', concluída' : ', ainda não iniciada';
    });
  }

  function irPara(n, opcoes) {
    opcoes = opcoes || {};
    estado.etapa = n;
    $all('.step').forEach(function (s) { s.hidden = Number(s.getAttribute('data-etapa')) !== n; });
    resumoErros.hidden = true;

    var secao = $('#etapa-' + n);
    var titulo = secao.getAttribute('data-titulo');
    document.title = 'Etapa ' + n + ' de ' + TOTAL_ETAPAS + ': ' + titulo + ' | Contratação de previdência';
    $('#acoes-progresso').textContent = 'Etapa ' + n + ' de ' + TOTAL_ETAPAS + ' · ' + titulo;
    $('#btn-anterior').hidden = n === 1;
    $('#btn-proximo').hidden = n === TOTAL_ETAPAS;
    $('#btn-finalizar').hidden = n !== TOTAL_ETAPAS;

    atualizarIndicador();
    if (n === TOTAL_ETAPAS) atualizarResumo();
    if (n === 2) renderizarFundos();
    salvar();

    if (opcoes.foco !== false) {
      window.scrollTo(0, 0);
      $('.step__titulo', secao).focus({ preventScroll: true });
    }
  }

  function avancar() {
    estado.tentou[estado.etapa] = true;
    var erros = validarEtapa(estado.etapa);
    if (erros.length) {
      mostrarResumo(erros);
      return false;
    }
    estado.concluidas = Math.max(estado.concluidas, estado.etapa);
    irPara(estado.etapa + 1);
    return true;
  }

  // Indicador de etapas e links "Alterar" do resumo.
  function irParaEtapa(alvo) {
    if (alvo === estado.etapa) return;
    if (alvo < estado.etapa) { irPara(alvo); return; }
    // Para a frente, só depois de validar as etapas do caminho.
    for (var n = estado.etapa; n < alvo; n++) {
      estado.tentou[n] = true;
      if (n !== estado.etapa) irPara(n, { foco: false });
      var erros = validarEtapa(n);
      if (erros.length) {
        if (n !== estado.etapa) irPara(n, { foco: false });
        mostrarResumo(erros);
        return;
      }
      estado.concluidas = Math.max(estado.concluidas, n);
    }
    irPara(alvo);
  }

  /* --------------------------------------------------------- Tabela de fundos */
  function fundosFiltrados() {
    return DADOS.fundos.filter(function (f) { return !estado.perfil || f.perfil === estado.perfil; });
  }

  function totalDePaginas() {
    return Math.max(1, Math.ceil(fundosFiltrados().length / POR_PAGINA));
  }

  function regraDeEntrada(f) {
    return PREV.moeda(f.minMensal) + ' (contribuições mensais) ou ' + PREV.moeda(f.minAporte) + ' (aporte/portabilidade)';
  }

  function linhaDoFundo(f) {
    var escolhido = f.id === estado.fundo;
    var tr = PREV.el('tr', 'fundo' + (escolhido ? ' is-escolhido' : ''));
    tr.setAttribute('data-id', f.id);

    var tdEscolha = PREV.el('td');
    var radio = PREV.el('input', 'fundo__radio visually-hidden');
    radio.type = 'radio';
    radio.name = 'fundo';
    radio.id = 'fundo-' + f.id;
    radio.value = f.id;
    radio.checked = escolhido;
    if ($('#fundo-erro')) {
      radio.setAttribute('aria-invalid', 'true');
      radio.setAttribute('aria-describedby', 'fundo-erro');
    }
    var label = PREV.el('label', 'selecionar');
    label.htmlFor = radio.id;
    label.appendChild(PREV.icon('check'));
    var visivel = PREV.el('span', 'selecionar__texto', escolhido ? 'Escolhido' : 'Selecionar');
    visivel.setAttribute('aria-hidden', 'true');
    label.appendChild(visivel);
    label.appendChild(PREV.el('span', 'visually-hidden', 'Escolher ' + f.nome));
    tdEscolha.appendChild(radio);
    tdEscolha.appendChild(label);

    var tdNome = PREV.el('td');
    var nome = PREV.el('div', 'fundo__nome');
    var info = PREV.el('button', 'btn-info');
    info.type = 'button';
    info.setAttribute('aria-label', 'Detalhes do fundo ' + f.nome);
    info.setAttribute('data-fundo', f.id);
    info.appendChild(PREV.icon('info'));
    nome.appendChild(info);
    nome.appendChild(PREV.el('span', null, f.nome));
    tdNome.appendChild(nome);

    var tdPerfil = PREV.el('td');
    tdPerfil.setAttribute('data-rotulo', 'Perfil');
    tdPerfil.appendChild(PREV.el('span', 'selo-perfil', f.perfil));

    var tdTaxa = PREV.el('td', null, porcentagem(f.taxa));
    tdTaxa.setAttribute('data-rotulo', 'Taxa adm. máx.');
    var tdPerf = PREV.el('td', null, f.performance);
    tdPerf.setAttribute('data-rotulo', 'Taxa de performance');
    var tdRegra = PREV.el('td', null, regraDeEntrada(f));
    tdRegra.setAttribute('data-rotulo', 'Regra de entrada');

    [tdEscolha, tdNome, tdPerfil, tdTaxa, tdPerf, tdRegra].forEach(function (td) { tr.appendChild(td); });
    return tr;
  }

  function renderizarFundos() {
    var lista = fundosFiltrados();
    estado.pagina = Math.min(Math.max(1, estado.pagina), totalDePaginas());
    var inicio = (estado.pagina - 1) * POR_PAGINA;
    var corpo = $('#fundos-corpo');
    corpo.textContent = '';
    lista.slice(inicio, inicio + POR_PAGINA).forEach(function (f) { corpo.appendChild(linhaDoFundo(f)); });
    if (!lista.length) {
      var tr = PREV.el('tr', 'tabela__vazio');
      var td = PREV.el('td', null, 'Nenhum fundo com esse perfil.');
      td.colSpan = 6;
      tr.appendChild(td);
      corpo.appendChild(tr);
    }
    renderizarPaginacao();
  }

  function botaoDePagina(conteudo, rotulo, pagina, desativado) {
    var li = PREV.el('li');
    var b = PREV.el('button', 'paginacao__botao');
    b.type = 'button';
    b.setAttribute('data-pagina', String(pagina));
    if (typeof conteudo === 'string') {
      b.textContent = conteudo;
      if (pagina === estado.pagina) b.setAttribute('aria-current', 'page');
    } else {
      b.appendChild(conteudo);
    }
    b.setAttribute('aria-label', rotulo);
    b.disabled = !!desativado;
    li.appendChild(b);
    return li;
  }

  function renderizarPaginacao() {
    var nav = $('#paginacao');
    nav.textContent = '';
    var total = totalDePaginas();
    if (total < 2) return;
    var ul = PREV.el('ul', 'paginacao__lista');
    var p = estado.pagina;
    ul.appendChild(botaoDePagina(PREV.icon('chevrons-left'), 'Primeira página', 1, p === 1));
    ul.appendChild(botaoDePagina(PREV.icon('chevron-left'), 'Página anterior', p - 1, p === 1));
    for (var i = 1; i <= total; i++) ul.appendChild(botaoDePagina(String(i), 'Página ' + i, i, false));
    ul.appendChild(botaoDePagina(PREV.icon('chevron-right'), 'Próxima página', p + 1, p === total));
    ul.appendChild(botaoDePagina(PREV.icon('chevrons-right'), 'Última página', total, p === total));
    nav.appendChild(ul);
  }

  function irParaPagina(pagina, rotuloFocado) {
    estado.pagina = pagina;
    renderizarFundos();
    salvar();
    var lista = fundosFiltrados();
    var inicio = (pagina - 1) * POR_PAGINA + 1;
    PREV.announce('Página ' + pagina + ' de ' + totalDePaginas() + ': fundos ' + inicio + ' a ' + Math.min(lista.length, inicio + POR_PAGINA - 1) + ' de ' + lista.length + '.');
    // Mantém o foco no mesmo controle; se ficou desativado, vai para a página atual.
    var alvo = $('#paginacao [aria-label="' + rotuloFocado + '"]');
    if (!alvo || alvo.disabled) alvo = $('#paginacao [aria-current="page"]');
    if (alvo) alvo.focus();
  }

  function escolherFundo(id, opcoes) {
    opcoes = opcoes || {};
    estado.fundo = id;
    var f = fundoPorId(id);

    // Se o fundo não está na página visível (veio do diálogo), mostra a página dele.
    if (!$('#fundo-' + id)) {
      var lista = fundosFiltrados();
      var pos = lista.indexOf(f);
      if (pos < 0) { estado.perfil = ''; $('#perfil-todos').checked = true; pos = DADOS.fundos.indexOf(f); }
      estado.pagina = Math.floor(pos / POR_PAGINA) + 1;
      renderizarFundos();
    }

    $all('.fundo').forEach(function (tr) {
      var marcado = tr.getAttribute('data-id') === id;
      tr.classList.toggle('is-escolhido', marcado);
      $('.fundo__radio', tr).checked = marcado;
      $('.selecionar__texto', tr).textContent = marcado ? 'Escolhido' : 'Selecionar';
    });

    if (estado.tentou[2]) {
      validarCampo($('#fundos'));
      if (form.elements.mensal.value || form.elements.aporte.value || $('#mensal-erro')) {
        validarCampo(form.elements.mensal);
        validarCampo(form.elements.aporte);
      }
    }
    salvar();
    if (!opcoes.silencioso) PREV.announce('Fundo escolhido: ' + f.nome + '.');
  }

  function abrirDetalhes(id, origem) {
    var f = fundoPorId(id);
    $('#dialogo-fundo-titulo').textContent = f.nome;
    $('#dialogo-fundo-descricao').textContent = f.descricao;
    var ficha = $('#dialogo-fundo-ficha');
    ficha.textContent = '';
    [
      ['Perfil', f.perfil],
      ['Taxa de administração máxima', porcentagem(f.taxa) + ' ao ano'],
      ['Taxa de performance', f.performance],
      ['Renda variável', f.rendaVariavel],
      ['Contribuição mensal mínima', PREV.moeda(f.minMensal)],
      ['Aporte ou portabilidade mínima', PREV.moeda(f.minAporte)]
    ].forEach(function (par) {
      ficha.appendChild(PREV.el('dt', null, par[0]));
      ficha.appendChild(PREV.el('dd', null, par[1]));
    });
    var escolher = $('#dialogo-fundo-escolher');
    escolher.setAttribute('data-fundo', id);
    escolher.textContent = id === estado.fundo ? 'Manter este fundo' : 'Escolher este fundo';
    PREV.abrirDialogo('dialogo-fundo', origem);
  }

  /* ------------------------------------------------------- Resumo da compra */
  function atualizarResumo() {
    var f = fundoPorId(estado.fundo);
    var mensal = valorMoeda(form.elements.mensal.value);
    var aporte = valorMoeda(form.elements.aporte.value);
    var plano = (form.querySelector('[name="plano"]:checked') || {}).value;
    var regime = (form.querySelector('[name="regime"]:checked') || {}).value;
    var ap = form.elements.aposentadoria.value;
    var atual = idadeAtual();

    var textos = {
      fundo: f ? f.nome : 'Nenhum fundo escolhido',
      'fundo-meta': f ? 'Perfil ' + f.perfil.toLowerCase() + ' · taxa de ' + porcentagem(f.taxa) + ' ao ano' : '',
      mensal: mensal ? PREV.moeda(mensal) : 'Sem contribuição mensal',
      aporte: aporte ? PREV.moeda(aporte) : 'Sem aporte',
      plano: plano && regime ? plano + ' · ' + regime : '—',
      aposentadoria: ap ? 'Aos ' + ap + ' anos' + (atual !== null && Number(ap) > atual ? ', daqui a ' + (Number(ap) - atual) + ' anos' : '') : '—',
      total: PREV.moeda(mensal + aporte)
    };
    Object.keys(textos).forEach(function (chave) {
      var alvo = $('[data-resumo="' + chave + '"]');
      if (alvo) alvo.textContent = textos[chave];
    });
  }

  /* ---------------------------------------------------- Rascunho (sessão) */
  function coletar() {
    var campos = {};
    $all('input[name], select[name]', form).forEach(function (el) {
      if (el.name === 'perfil' || el.name === 'fundo') return;
      if (el.type === 'radio') { if (el.checked) campos[el.name] = el.value; return; }
      if (el.type === 'checkbox') { campos[el.name] = el.checked; return; }
      campos[el.name] = el.value;
    });
    return campos;
  }

  function salvar() {
    if (estado.finalizado) return;
    PREV.store.set('rascunho', {
      campos: coletar(),
      etapa: estado.etapa,
      concluidas: estado.concluidas,
      fundo: estado.fundo,
      perfil: estado.perfil,
      pagina: estado.pagina
    });
  }

  function preencher(campos) {
    Object.keys(campos).forEach(function (nome) {
      var valor = campos[nome];
      var alvo = form.elements[nome];
      if (!alvo) return;
      if (alvo instanceof RadioNodeList) {
        $all('input[name="' + nome + '"]', form).forEach(function (r) { r.checked = r.value === valor; });
      } else if (alvo.type === 'checkbox') {
        alvo.checked = !!valor;
      } else {
        alvo.value = valor;
      }
    });
    alternarDebito();
  }

  function alternarDebito() {
    var debito = $('#forma-debito').checked;
    var extra = $('#dados-debito');
    if (extra.hidden === !debito) return;
    extra.hidden = !debito;
    if (!debito) $all('input, select', extra).forEach(limparErro);
  }

  /* -------------------------------------------------------------- Finalizar */
  function protocolo() {
    var numeros = new Uint32Array(1);
    window.crypto.getRandomValues(numeros);
    return 'PRV-' + new Date().getFullYear() + '-' + String(numeros[0] % 1000000).padStart(6, '0');
  }

  function textoDaCobranca() {
    var mensal = valorMoeda(form.elements.mensal.value);
    var aporte = valorMoeda(form.elements.aporte.value);
    var dia = form.elements.vencimento.value;
    var forma = (form.querySelector('[name="formaPagamento"]:checked') || {}).value || '';
    var texto = 'A primeira cobrança, de ' + PREV.moeda(mensal + aporte) + ', vence no dia ' + dia + ', por ' + forma.toLowerCase() + '.';
    if (mensal) texto += ' Depois, ' + PREV.moeda(mensal) + ' todo dia ' + dia + '.';
    return texto;
  }

  function finalizar() {
    // Confere todas as etapas; se alguma anterior tiver erro, volta para ela.
    for (var n = 1; n <= TOTAL_ETAPAS; n++) {
      estado.tentou[n] = true;
      var erros = validarEtapa(n);
      if (erros.length) {
        if (n !== estado.etapa) irPara(n, { foco: false });
        mostrarResumo(erros);
        return;
      }
    }
    var f = fundoPorId(estado.fundo);
    var plano = form.querySelector('[name="plano"]:checked').value;
    var regime = form.querySelector('[name="regime"]:checked').value.toLowerCase();
    $('#dialogo-confirmar-texto').textContent = 'Você vai contratar um plano ' + plano + ', no regime ' + regime +
      ', investindo no fundo ' + f.nome + '. ' + textoDaCobranca();
    PREV.abrirDialogo('dialogo-confirmar', $('#btn-finalizar'));
  }

  function mostrarSucesso(dados) {
    estado.finalizado = true;
    form.hidden = true;
    $('#acoes').hidden = true;
    atualizarIndicador();
    $('#protocolo').textContent = dados.protocolo;
    $('#sucesso-email').textContent = dados.email;
    $('#sucesso-cobranca').textContent = dados.cobranca;
    $('#sucesso').hidden = false;
    document.title = 'Contratação concluída | Contratação de previdência';
    window.scrollTo(0, 0);
    $('#sucesso-titulo').focus({ preventScroll: true });
  }

  function confirmar() {
    var dados = {
      protocolo: protocolo(),
      email: form.elements.email.value.trim(),
      cobranca: textoDaCobranca()
    };
    $('#dialogo-confirmar')._origem = null;
    $('#dialogo-confirmar').close();
    PREV.store.remove('rascunho');
    PREV.store.set('concluida', dados);
    mostrarSucesso(dados);
  }

  /* ------------------------------------------------------------------ Início */
  function popularSelects() {
    $all('select[data-opcoes]').forEach(function (sel) {
      var vazio = PREV.el('option', null, 'Selecione');
      vazio.value = '';
      sel.appendChild(vazio);
      DADOS.listas[sel.getAttribute('data-opcoes')].forEach(function (texto) {
        var op = PREV.el('option', null, sel.id === 'vencimento' ? 'Todo dia ' + texto : texto);
        op.value = texto;
        sel.appendChild(op);
      });
    });
  }

  function aoEditar(e) {
    var el = e.target;
    if (!el.name || el.name === 'perfil') return;

    var mascara = mascaras[el.getAttribute('data-mask')];
    if (mascara && e.type === 'input') {
      var formatado = mascara(el.value, el);
      if (formatado !== el.value) el.value = formatado;
    }
    if (el.name === 'formaPagamento') alternarDebito();
    if (el.name === 'fundo') { escolherFundo(el.value); return; }

    // Depois da primeira tentativa, revalida enquanto a pessoa corrige.
    var etapa = Number(el.closest('.step').getAttribute('data-etapa'));
    if (estado.tentou[etapa]) {
      validarCampo(el);
      var dependentes = {
        nascimento: ['aposentadoria'],
        mensal: ['aporte'],
        aporte: ['mensal'],
        email: ['emailConfirma'],
        celDdi: ['celNumero'],
        telDdi: ['telDdd', 'telNumero'],
        telDdd: ['telDdi', 'telNumero'],
        telNumero: ['telDdi', 'telDdd']
      }[el.name] || [];
      dependentes.forEach(function (nome) {
        var dep = form.elements[nome];
        if (dep.value || $('#' + dep.id + '-erro')) validarCampo(dep);
      });
    }
    if (estado.etapa === TOTAL_ETAPAS) atualizarResumo();
    salvar();
  }

  function preencherExemplo() {
    var ex = DADOS.exemplo;
    var campos = {};
    Object.keys(ex).forEach(function (k) { if (k !== 'fundo') campos[k] = ex[k]; });
    campos.vencimento = '10';
    preencher(campos);
    escolherFundo(ex.fundo, { silencioso: true });
    $all('.field-error').forEach(function (p) { p.remove(); });
    $all('[aria-invalid]').forEach(function (c) { c.removeAttribute('aria-invalid'); });
    $all('.is-invalido').forEach(function (c) { c.classList.remove('is-invalido'); });
    $all('[aria-describedby]').forEach(function (c) {
      var ids = c.getAttribute('aria-describedby').split(/\s+/).filter(function (x) { return !/-erro$/.test(x); });
      if (ids.length) c.setAttribute('aria-describedby', ids.join(' ')); else c.removeAttribute('aria-describedby');
    });
    resumoErros.hidden = true;
    salvar();
    PREV.announce('Preenchemos as etapas 1 a 3 com dados de exemplo. Revise e siga com Próximo.');
  }

  document.addEventListener('DOMContentLoaded', function () {
    form = $('#contratacao');
    resumoErros = $('#resumo-erros');
    popularSelects();

    var concluida = PREV.store.get('concluida', null);
    if (concluida) { mostrarSucesso(concluida); }

    var rascunho = PREV.store.get('rascunho', null);
    if (rascunho) {
      preencher(rascunho.campos || {});
      estado.fundo = rascunho.fundo || '';
      estado.perfil = rascunho.perfil || '';
      estado.pagina = rascunho.pagina || 1;
      estado.concluidas = rascunho.concluidas || 0;
      $all('input[name="perfil"]').forEach(function (r) { r.checked = r.value === estado.perfil; });
    } else {
      form.elements.pais.value = 'Brasil';
      form.elements.celDdi.value = '55';
    }

    // "input" também dispara em radio, checkbox e select nos navegadores atuais.
    form.addEventListener('input', aoEditar);
    form.addEventListener('submit', function (e) { e.preventDefault(); });

    // Enter num campo de texto avança a etapa, como num formulário comum.
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && /^(text|email|tel)$/.test(e.target.type)) {
        e.preventDefault();
        if (estado.etapa < TOTAL_ETAPAS) avancar(); else finalizar();
      }
    });

    $('#btn-proximo').addEventListener('click', avancar);
    $('#btn-anterior').addEventListener('click', function () { irPara(estado.etapa - 1); });
    $('#btn-finalizar').addEventListener('click', finalizar);
    $('#confirmar-contratacao').addEventListener('click', confirmar);
    $('#preencher-exemplo').addEventListener('click', preencherExemplo);
    $('#nova-contratacao').addEventListener('click', function () {
      PREV.store.remove('concluida');
      PREV.store.remove('rascunho');
      window.location.reload();
    });

    document.addEventListener('click', function (e) {
      var ir = e.target.closest('[data-ir]');
      if (ir && !ir.disabled) irParaEtapa(Number(ir.getAttribute('data-ir')));
    });

    // Filtro por perfil
    $all('input[name="perfil"]').forEach(function (r) {
      r.addEventListener('change', function () {
        estado.perfil = r.value;
        estado.pagina = 1;
        renderizarFundos();
        salvar();
        var qtd = fundosFiltrados().length;
        PREV.announce(qtd + (qtd === 1 ? ' fundo' : ' fundos') + (r.value ? ' com perfil ' + r.value.toLowerCase() : ' no total') + '.');
      });
    });

    // Tabela: clique na linha escolhe o fundo; botão "i" abre os detalhes.
    $('#fundos-corpo').addEventListener('click', function (e) {
      var info = e.target.closest('.btn-info');
      if (info) { abrirDetalhes(info.getAttribute('data-fundo'), info); return; }
      if (e.target.closest('label, input')) return;
      var tr = e.target.closest('.fundo');
      if (tr) escolherFundo(tr.getAttribute('data-id'));
    });

    $('#paginacao').addEventListener('click', function (e) {
      var b = e.target.closest('.paginacao__botao');
      if (b && !b.disabled) irParaPagina(Number(b.getAttribute('data-pagina')), b.getAttribute('aria-label'));
    });

    $('#dialogo-fundo-escolher').addEventListener('click', function () {
      var id = this.getAttribute('data-fundo');
      var d = $('#dialogo-fundo');
      d._origem = null;
      d.close();
      escolherFundo(id);
      var radio = $('#fundo-' + id);
      if (radio) radio.focus();
    });

    if (!concluida) {
      var inicial = rascunho ? Math.min(rascunho.etapa || 1, estado.concluidas + 1) : 1;
      irPara(inicial, { foco: false });
    }
  });
})();
