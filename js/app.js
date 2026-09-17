/* Wiring de la interfaz: lee el formulario, recalcula en cada cambio y pinta el resultado. */
(function () {
  'use strict';

  var Calc = window.SolvenciaCalc;
  var Config = window.SolvenciaConfig;
  var Store = window.SolvenciaStore;
  var Res = window.SolvenciaResumen;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var hoyISO = function () { return new Date().toISOString().slice(0, 10); };

  var estado = {
    id: Store.id(),
    apoyoFamiliar: false,
    usdDesbloqueado: false,
    decision: '',
    guardado: false
  };

  /* ---------- utilidades de campos ---------- */

  function soloDigitos(s) { return String(s || '').replace(/[^\d]/g, ''); }

  function formatearMoney(el) {
    var d = soloDigitos(el.value);
    el.value = d ? Res.miles(parseInt(d, 10)) : '';
  }

  function valMoney(id) { return parseInt(soloDigitos($('#' + id).value), 10) || 0; }
  function val(id) { return $('#' + id).value.trim(); }

  function setMoney(id, n) {
    var el = $('#' + id);
    if (el) el.value = n ? Res.miles(n) : '';
  }

  /* ---------- construcción de catálogos ---------- */

  function poblarCatalogos() {
    var d = $('#destino');
    Config.destinos.forEach(function (x) {
      var op = document.createElement('option');
      op.value = x.nombre;
      op.textContent = x.nombre;
      op.dataset.moneda = x.moneda;
      d.appendChild(op);
    });

    var t = $('#tipoPrograma');
    Config.tiposPrograma.forEach(function (x) {
      var op = document.createElement('option');
      op.value = x; op.textContent = x;
      t.appendChild(op);
    });

    var docs = $('#lista-docs');
    Config.documentosSugeridos.forEach(function (x, idx) {
      var lab = document.createElement('label');
      lab.className = 'checkbox';
      lab.innerHTML = '<input type="checkbox" data-doc="' + idx + '" value="' + x + '"><span>' + x + '</span>';
      docs.appendChild(lab);
    });

    var g = $('#lista-guion');
    Config.guion.forEach(function (x) {
      var art = document.createElement('article');
      art.className = 'guion__card';
      art.innerHTML = '<span class="guion__momento">' + x.momento + '</span><p>' + x.texto + '</p><button type="button" class="btn btn--mini">Copiar</button>';
      art.querySelector('button').addEventListener('click', function () { copiar(x.texto, 'Frase copiada'); });
      g.appendChild(art);
    });

    $('#res-aviso').textContent = Config.aviso;
  }

  /* ---------- lectura del formulario ---------- */

  function leerDatos() {
    var destino = val('destino');
    var otro = val('destinoOtro');
    return {
      id: estado.id,
      hoy: hoyISO(),
      estudiante: val('estudiante'),
      asesor: val('asesor'),
      telefono: val('telefono'),
      correo: val('correo'),
      destino: destino,
      destinoOtro: otro,
      destinoFinal: otro || destino,
      tipoPrograma: val('tipoPrograma'),
      programa: val('programa'),
      duracion: val('duracion'),
      duracionUnidad: val('duracionUnidad'),
      fechaViaje: val('fechaViaje'),
      mesesOverride: val('mesesOverride'),
      valorPrograma: valMoney('valorPrograma'),
      monedaPrograma: val('monedaPrograma'),
      fondosReferencia: valMoney('fondosReferencia'),
      monedaFondos: val('monedaFondos'),
      fuenteFondos: val('fuenteFondos'),
      tasaUsd: valMoney('tasaUsd'),
      tasaEur: valMoney('tasaEur'),
      fechaTasa: val('fechaTasa'),
      ahorros: valMoney('ahorros'),
      capacidadMensual: valMoney('capacidadMensual'),
      apoyoFamiliar: estado.apoyoFamiliar,
      aportePatrocinador: valMoney('aportePatrocinador'),
      patrocinadorRelacion: val('patrocinadorRelacion'),
      otrosRecursos: valMoney('otrosRecursos'),
      otrosDetalle: val('otrosDetalle'),
      pagoInicial: valMoney('pagoInicial'),
      notas: val('notas'),
      porcentajeReserva: val('porcentajeReserva'),
      montoCierreUsd: val('montoCierreUsd'),
      fechaCompletarReserva: val('fechaCompletarReserva'),
      proximaGestion: val('proximaGestion'),
      metaAhorro: valMoney('metaAhorro'),
      proximoContacto: val('proximoContacto'),
      documentos: $$('#lista-docs input:checked').map(function (c) { return c.value; }),
      usdDesbloqueado: estado.usdDesbloqueado,
      decision: estado.decision
    };
  }

  function escribirDatos(d) {
    if (!d) return;
    ['estudiante', 'asesor', 'telefono', 'correo', 'destino', 'destinoOtro', 'tipoPrograma', 'programa',
      'duracion', 'duracionUnidad', 'fechaViaje', 'mesesOverride', 'monedaPrograma', 'monedaFondos',
      'fuenteFondos', 'fechaTasa', 'patrocinadorRelacion', 'otrosDetalle', 'notas', 'porcentajeReserva',
      'montoCierreUsd', 'fechaCompletarReserva', 'proximaGestion', 'proximoContacto'
    ].forEach(function (k) {
      var el = $('#' + k);
      if (el && d[k] != null) el.value = d[k];
    });
    ['valorPrograma', 'fondosReferencia', 'tasaUsd', 'tasaEur', 'ahorros', 'capacidadMensual',
      'aportePatrocinador', 'otrosRecursos', 'pagoInicial', 'metaAhorro'
    ].forEach(function (k) { setMoney(k, d[k]); });

    if (d.id) estado.id = d.id;
    setApoyo(!!d.apoyoFamiliar);
    setUsd(!!d.usdDesbloqueado);
    estado.decision = d.decision || '';
    (d.documentos || []).forEach(function (txt) {
      var c = $$('#lista-docs input').find(function (x) { return x.value === txt; });
      if (c) c.checked = true;
    });
  }

  /* ---------- render ---------- */

  function render() {
    var d = leerDatos();
    var r = Calc.diagnosticar(d);
    var i = Calc.interpretar(r);

    // cabecera
    var esEstudiante = document.body.dataset.modo === 'estudiante';
    var nombreCorto = (d.estudiante || '').split(' ')[0];
    $('#res-titulo').textContent = esEstudiante
      ? (nombreCorto ? 'Tu proyecto, ' + nombreCorto : 'Tu proyecto de estudio')
      : 'Resumen del proyecto';
    $('#res-subtitulo').textContent = esEstudiante
      ? [d.destinoFinal, d.programa, d.fechaViaje ? 'viaje estimado: ' + Res.fecha(d.fechaViaje) : ''].filter(Boolean).join(' · ')
      : 'Completa los datos y el resultado se actualiza solo.';
    $('#res-ficha').textContent = [
      d.estudiante ? 'Estudiante: ' + d.estudiante : '',
      d.asesor ? 'Asesor: ' + d.asesor : '',
      'Fecha: ' + Res.fecha(d.hoy)
    ].filter(Boolean).join('  ·  ');

    $('#cabecera-caso').textContent = [d.estudiante || 'Nuevo diagnóstico', d.destinoFinal].filter(Boolean).join(' · ');

    // meses automáticos
    $('#meses-auto-hint').textContent = d.fechaViaje
      ? 'Cálculo automático: ' + r.mesesCalculados + ' meses. Puedes sobrescribirlo.'
      : 'Se calcula con la fecha de viaje. Puedes sobrescribirlo.';

    // avisos de conversión
    $('#hint-programa').textContent = d.monedaPrograma === 'COP' ? ''
      : (tasaDe(d, d.monedaPrograma) ? 'Equivale a ' + Res.money(r.valorPrograma) : '⚠ Digita la tasa de ' + d.monedaPrograma + ' para convertir.');
    var hintFondos = 'Según la información validada por el departamento de procesos.';
    $('#hint-fondos').textContent = d.monedaFondos === 'COP' ? hintFondos
      : (tasaDe(d, d.monedaFondos) ? hintFondos + ' Equivale a ' + Res.money(r.fondosReferencia) : '⚠ Digita la tasa de ' + d.monedaFondos + ' para convertir.');

    // cifras principales
    $('#res-fondos').textContent = Res.money(r.fondosReferencia);
    $('#res-recursos').textContent = Res.money(r.recursosActuales);
    $('#res-diferencia').textContent = Res.money(r.diferencia);
    $('#res-meses').textContent = r.meses;
    $('#res-ahorro').textContent = Res.money(r.ahorroMensualReferencia);
    $('#res-capacidad').textContent = Res.money(r.capacidadMensual) + ' / mes';
    $('#res-proyeccion').textContent = Res.money(r.proyeccionAlViaje);

    var pct = Math.max(0, Math.min(100, Math.round(r.cobertura * 100)));
    $('#res-barra').style.width = pct + '%';
    $('#res-cobertura').textContent = pct + ' % de la cifra de referencia cubierto hoy'
      + (r.fondosReferencia > 0 ? ' · ' + Math.round(Math.min(1, r.coberturaProyectada) * 100) + ' % proyectado a la fecha de viaje' : '');

    // estado
    var est = $('#res-estado');
    est.dataset.tono = i.tono;
    $('#res-estado-texto').textContent = i.etiqueta;
    $('#res-interpretacion').textContent = i.texto;
    var ul = $('#res-acciones');
    ul.innerHTML = '';
    i.acciones.forEach(function (a) {
      var li = document.createElement('li');
      li.textContent = a.replace(/(\d{4,})/g, function (m) { return Res.miles(parseInt(m, 10)); });
      ul.appendChild(li);
    });

    // opciones
    $('#etq-porcentaje').textContent = r.porcentajeReserva;
    $('#etq-usd').textContent = r.montoCierreUsd;
    $('#valor-reserva').textContent = r.valorPrograma > 0 ? Res.money(r.reserva) : 'Falta el valor del programa';
    $('#saldo-reserva').textContent = r.valorPrograma > 0
      ? (r.puedeReserva
        ? '✔ El pago inicial declarado alcanza para la reserva.'
        : 'Faltan ' + Res.money(r.faltaParaReserva) + ' frente al pago inicial declarado.')
      : '';
    $('#valor-usd').textContent = r.tasas.usd > 0 ? Res.money(r.cierreUsdCOP) : '⚠ Digita la tasa USD';
    $('#saldo-usd').textContent = 'Saldo pendiente hasta completar la reserva: ' + (r.valorPrograma > 0 ? Res.money(r.saldoDespuesCierreUsd) : '—');
    $('#valor-meta').textContent = r.diferencia > 0
      ? 'Meta sugerida: ' + Res.money(r.ahorroMensualReferencia) + ' al mes'
      : 'Sin diferencia pendiente con los datos actuales';

    // sugerencia de ruta
    var ruta = Calc.rutaComercial(r);
    var sug = $('#sugerencia-ruta');
    sug.dataset.ruta = ruta;
    sug.innerHTML = {
      reserva: '<strong>Ruta sugerida: reserva del ' + r.porcentajeReserva + '%.</strong> El pago inicial declarado (' + Res.money(r.pagoInicial) + ') cubre ' + Res.money(r.reserva) + '. Trabaja la opción A.',
      cierre_usd: '<strong>Ruta sugerida: opción A con ajuste.</strong> El pago inicial declarado (' + Res.money(r.pagoInicial) + ') no cubre la reserva de ' + Res.money(r.reserva) + '. Intenta primero completar la reserva; la opción B queda como último recurso.',
      seguimiento: '<strong>Ruta sugerida: plan de preparación.</strong> Con ' + Res.money(r.pagoInicial) + ' de pago inicial no hay cómo abrir el proceso hoy: agenda seguimiento y meta de ahorro.'
    }[ruta];

    renderOpcionesResumen(d, r);
    renderDecision();

    if (!$('#metaAhorro').value && r.ahorroMensualReferencia > 0) {
      $('#metaAhorro').placeholder = Res.miles(r.ahorroMensualReferencia);
    }

    Store.guardarBorrador(d);
    Store.guardarPrefs({ asesor: d.asesor, tasaUsd: d.tasaUsd, tasaEur: d.tasaEur, fechaTasa: d.fechaTasa });
    return { d: d, r: r };
  }

  function tasaDe(d, moneda) {
    return moneda === 'USD' ? d.tasaUsd : moneda === 'EUR' ? d.tasaEur : 1;
  }

  function renderOpcionesResumen(d, r) {
    var cont = $('#res-opciones');
    var html = '<h3>¿Cómo podemos avanzar?</h3><div class="opt-mini">';
    html += '<div class="opt-mini__item"><span>Opción A · reserva del ' + r.porcentajeReserva + '%</span><strong>' + (r.valorPrograma > 0 ? Res.money(r.reserva) : '—') + '</strong></div>';
    if (estado.usdDesbloqueado) {
      html += '<div class="opt-mini__item"><span>Opción B · inicio con USD ' + r.montoCierreUsd + '</span><strong>' + (r.tasas.usd > 0 ? Res.money(r.cierreUsdCOP) : '—') + '</strong></div>';
    }
    html += '<div class="opt-mini__item"><span>Opción C · plan de preparación</span><strong>' + (d.proximaGestion ? Res.fecha(d.proximaGestion) : Res.money(r.ahorroMensualReferencia) + '/mes') + '</strong></div>';
    html += '</div>';
    cont.innerHTML = html;
  }

  function renderDecision() {
    var box = $('#decision-actual');
    $$('.opcion').forEach(function (o) { o.classList.toggle('is-elegida', o.dataset.opcion === estado.decision); });
    if (!estado.decision) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = 'Decisión registrada: <strong>' + Res.etiquetaDecision(estado.decision) + '</strong> · <button type="button" class="btn btn--link" id="btn-quitar-decision">quitar</button>';
    $('#btn-quitar-decision').addEventListener('click', function () {
      estado.decision = '';
      render();
      aviso('Decisión eliminada');
    });
  }

  /* ---------- modo, apoyo, USD ---------- */

  function setModo(modo) {
    document.body.dataset.modo = modo;
    $$('[data-modo-btn]').forEach(function (b) { b.classList.toggle('is-on', b.dataset.modoBtn === modo); });
    render();
    if (modo === 'estudiante') aviso('Modo estudiante: pantalla lista para mostrar');
  }

  function setApoyo(si) {
    estado.apoyoFamiliar = si;
    $$('[data-apoyo]').forEach(function (b) { b.classList.toggle('is-on', (b.dataset.apoyo === 'si') === si); });
    $('#fila-patrocinador').hidden = !si;
  }

  function setUsd(abierto) {
    estado.usdDesbloqueado = abierto;
    var card = $('.opcion--b');
    card.classList.toggle('is-locked', !abierto);
    $('#bloqueo-usd').hidden = abierto;
    $('.opcion--b .opcion__cuerpo').hidden = !abierto;
    if (!abierto && estado.decision === 'cierre_usd') estado.decision = '';
  }

  /* ---------- guardar / indicadores ---------- */

  function registroDesde(d, r) {
    return {
      id: d.id,
      fecha: d.hoy,
      asesor: d.asesor,
      estudiante: d.estudiante,
      telefono: d.telefono,
      correo: d.correo,
      destino: d.destinoFinal,
      programa: [d.tipoPrograma, d.programa].filter(Boolean).join(' · '),
      fechaViaje: d.fechaViaje,
      meses: r.meses,
      valorPrograma: Math.round(r.valorPrograma),
      fondosReferencia: Math.round(r.fondosReferencia),
      recursosActuales: Math.round(r.recursosActuales),
      diferencia: Math.round(r.diferencia),
      ahorroMensualReferencia: Math.round(r.ahorroMensualReferencia),
      capacidadMensual: Math.round(r.capacidadMensual),
      pagoInicial: Math.round(r.pagoInicial),
      reserva: Math.round(r.reserva),
      puedeIniciar: r.puedeReserva || r.puedeCierreUsd,
      decision: d.decision || 'sin_decision',
      proximaGestion: d.proximaGestion,
      proximoContacto: d.proximoContacto,
      notas: d.notas,
      pagoGenerado: false,
      fechaPago: '',
      datos: d
    };
  }

  function guardar() {
    var x = render();
    if (!x.d.estudiante) { aviso('Escribe el nombre del estudiante antes de guardar'); irA('proyecto'); $('#estudiante').focus(); return; }
    var previo = Store.registros().find(function (r) { return r.id === x.d.id; });
    var reg = registroDesde(x.d, x.r);
    if (previo) { reg.pagoGenerado = previo.pagoGenerado; reg.fechaPago = previo.fechaPago; }
    Store.guardarRegistro(reg);
    estado.guardado = true;
    renderIndicadores();
    aviso(previo ? 'Diagnóstico actualizado' : 'Diagnóstico guardado');
  }

  function nuevo() {
    if (!confirm('¿Empezar un diagnóstico nuevo? Los datos en pantalla se limpian.')) return;
    var prefs = Store.leerPrefs();
    $$('input').forEach(function (el) { if (el.type === 'checkbox') el.checked = false; else el.value = ''; });
    $('#porcentajeReserva').value = 25;
    $('#montoCierreUsd').value = 200;
    $('#notas').value = '';
    $('#destino').selectedIndex = 0;
    $('#tipoPrograma').selectedIndex = 0;
    estado.id = Store.id();
    estado.decision = '';
    estado.guardado = false;
    setApoyo(false);
    setUsd(false);
    $('#asesor').value = prefs.asesor || '';
    setMoney('tasaUsd', prefs.tasaUsd || 0);
    setMoney('tasaEur', prefs.tasaEur || 0);
    $('#fechaTasa').value = prefs.fechaTasa || hoyISO();
    Store.limpiarBorrador();
    render();
    irA('proyecto');
    aviso('Listo para un nuevo diagnóstico');
  }

  function renderIndicadores() {
    var regs = Store.registros();
    var k = Store.indicadores(regs);
    $('#kpis').innerHTML = [
      ['Diagnósticos realizados', k.total],
      ['Con capacidad de iniciar', k.conCapacidad],
      ['Eligieron reserva', k.reserva],
      ['Eligieron inicio en USD', k.cierreUsd],
      ['Solicitaron seguimiento', k.seguimiento],
      ['Pagos generados', k.pagos],
      ['Conversión a decisión de pago', Math.round(k.conversion * 100) + ' %'],
      ['Pagos sobre diagnósticos', Math.round(k.pagoSobreDiagnostico * 100) + ' %']
    ].map(function (p) {
      return '<div class="kpi"><dt>' + p[0] + '</dt><dd>' + p[1] + '</dd></div>';
    }).join('');

    var t = $('#tabla-registros');
    if (!regs.length) {
      t.innerHTML = '<tbody><tr><td class="vacio">Aún no hay diagnósticos guardados en este equipo.</td></tr></tbody>';
    } else {
      t.innerHTML = '<thead><tr><th>Fecha</th><th>Estudiante</th><th>Destino</th><th>Diferencia</th><th>Decisión</th><th>Próxima gestión</th><th>Pago</th><th></th></tr></thead><tbody>'
        + regs.map(function (r) {
          return '<tr><td>' + Res.fecha(r.fecha) + '</td><td>' + (r.estudiante || '—') + '</td><td>' + (r.destino || '—') + '</td>'
            + '<td>' + Res.money(r.diferencia) + '</td><td>' + Res.etiquetaDecision(r.decision) + '</td>'
            + '<td>' + (r.proximaGestion ? Res.fecha(r.proximaGestion) : '—') + '</td>'
            + '<td><input type="checkbox" data-pago="' + r.id + '"' + (r.pagoGenerado ? ' checked' : '') + '></td>'
            + '<td class="acciones-fila"><button type="button" class="btn btn--link" data-abrir="' + r.id + '">abrir</button>'
            + '<button type="button" class="btn btn--link btn--peligro" data-borrar="' + r.id + '">borrar</button></td></tr>';
        }).join('') + '</tbody>';
    }

    $('#lista-gestiones').innerHTML = k.proximasGestiones.length
      ? k.proximasGestiones.map(function (r) {
        return '<div class="gestion"><strong>' + Res.fecha(r.proximaGestion) + '</strong><span>' + (r.estudiante || '—') + ' · ' + (r.destino || '—') + '</span><span class="hint">' + (r.proximoContacto || 'Sin contacto definido') + '</span></div>';
      }).join('')
      : '<p class="hint">No hay próximas gestiones agendadas.</p>';
  }

  /* ---------- compartir ---------- */

  function resumenTexto(corto) {
    var x = render();
    var op = { incluirUsd: estado.usdDesbloqueado };
    return corto ? Res.textoCorto(x.d, x.r, op) : Res.texto(x.d, x.r, op);
  }

  function descargar(nombre, contenido, tipo) {
    if (window.SOLVENCIA_DEMO) {
      copiar(contenido, 'Vista de prueba: copiado al portapapeles (en la app se descarga el archivo)');
      return;
    }
    var blob = new Blob([contenido], { type: (tipo || 'text/plain') + ';charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function copiar(txt, msg) {
    var ok = function () { aviso(msg || 'Copiado'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(ok, function () { copiaManual(txt, ok); });
    } else copiaManual(txt, ok);
  }

  function copiaManual(txt, ok) {
    var ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); ok(); } catch (e) { aviso('No se pudo copiar'); }
    ta.remove();
  }

  function normalizarTel(t) {
    var d = soloDigitos(t);
    if (!d) return '';
    if (d.length === 10) return '57' + d;
    return d;
  }

  function aviso(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.remove('is-on'); }, 2600);
  }

  function irA(pane) {
    $$('.tab').forEach(function (b) { b.classList.toggle('is-on', b.dataset.tab === pane); });
    $$('.tabpane').forEach(function (p) { p.classList.toggle('is-on', p.dataset.pane === pane); });
    if (pane === 'indicadores') renderIndicadores();
  }

  /* ---------- eventos ---------- */

  function conectar() {
    document.addEventListener('input', function (e) {
      if (e.target.classList && e.target.classList.contains('money')) {
        formatearMoney(e.target);
        if (e.target.id === 'tasaUsd') $('#tasaUsdEspejo').value = e.target.value;
        if (e.target.id === 'tasaUsdEspejo') $('#tasaUsd').value = e.target.value;
      }
      if (e.target.closest && e.target.closest('.layout')) render();
    });
    document.addEventListener('change', function (e) {
      if (e.target.id === 'destino') {
        var op = e.target.selectedOptions[0];
        if (op && op.dataset.moneda) {
          $('#monedaPrograma').value = op.dataset.moneda;
          $('#monedaFondos').value = op.dataset.moneda;
        }
        $('#destinoOtro').hidden = false;
      }
      if (e.target.dataset && e.target.dataset.pago != null) {
        Store.marcarPago(e.target.dataset.pago, e.target.checked);
        renderIndicadores();
        aviso(e.target.checked ? 'Pago registrado' : 'Pago desmarcado');
      }
      if (e.target.closest && e.target.closest('.layout')) render();
    });

    $$('.tab').forEach(function (b) { b.addEventListener('click', function () { irA(b.dataset.tab); }); });
    $$('[data-modo-btn]').forEach(function (b) { b.addEventListener('click', function () { setModo(b.dataset.modoBtn); }); });
    $$('[data-apoyo]').forEach(function (b) {
      b.addEventListener('click', function () { setApoyo(b.dataset.apoyo === 'si'); render(); });
    });

    $('#btn-meses-auto').addEventListener('click', function () { $('#mesesOverride').value = ''; render(); });
    $('#btn-desbloquear-usd').addEventListener('click', function () {
      if (!confirm('La opción de USD es un cierre de último recurso.\n¿Confirmas que el estudiante no puede cubrir la reserva hoy?')) return;
      setUsd(true);
      render();
    });
    $('#btn-bloquear-usd').addEventListener('click', function () { setUsd(false); render(); });

    $$('[data-elegir]').forEach(function (b) {
      b.addEventListener('click', function () {
        estado.decision = b.dataset.elegir;
        if (estado.decision === 'seguimiento' && !$('#proximaGestion').value) {
          aviso('Agenda la fecha de próxima revisión');
          $('#proximaGestion').focus();
        }
        render();
        aviso('Decisión: ' + Res.etiquetaDecision(estado.decision));
      });
    });

    $('#btn-guardar').addEventListener('click', guardar);
    $('#btn-nuevo').addEventListener('click', nuevo);
    $('#btn-imprimir').addEventListener('click', function () { window.print(); });
    $('#btn-copiar').addEventListener('click', function () { copiar(resumenTexto(false), 'Resumen copiado'); });

    $('#btn-descargar').addEventListener('click', function () {
      var d = leerDatos();
      var base = 'diagnostico-' + (d.estudiante || 'estudiante').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + d.hoy;
      descargar(base + '.txt', resumenTexto(false));
      aviso('Resumen descargado');
    });

    $('#btn-whatsapp').addEventListener('click', function () {
      var d = leerDatos();
      var tel = normalizarTel(d.telefono);
      var url = 'https://wa.me/' + tel + '?text=' + encodeURIComponent(resumenTexto(true));
      window.open(url, '_blank', 'noopener');
    });

    $('#btn-correo').addEventListener('click', function () {
      var d = leerDatos();
      var asunto = 'Resumen de tu asesoría — ' + (d.destinoFinal || 'proyecto de estudio');
      window.location.href = 'mailto:' + encodeURIComponent(d.correo) + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(resumenTexto(false));
    });

    $('#btn-exportar-csv').addEventListener('click', function () {
      var regs = Store.registros();
      if (!regs.length) return aviso('No hay diagnósticos para exportar');
      descargar('indicadores-solvencia-' + hoyISO() + '.csv', '﻿' + Res.csv(regs), 'text/csv');
      aviso('CSV exportado');
    });

    $('#btn-exportar-json').addEventListener('click', function () {
      descargar('respaldo-solvencia-' + hoyISO() + '.json', JSON.stringify(Store.registros(), null, 2), 'application/json');
      aviso('Respaldo descargado');
    });

    $('#input-importar').addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          Store.importar(JSON.parse(fr.result));
          renderIndicadores();
          aviso('Respaldo importado');
        } catch (err) { aviso('El archivo no es un respaldo válido'); }
      };
      fr.readAsText(f);
      e.target.value = '';
    });

    document.addEventListener('click', function (e) {
      var abrir = e.target.dataset && e.target.dataset.abrir;
      var borrar = e.target.dataset && e.target.dataset.borrar;
      if (abrir) {
        var reg = Store.registros().find(function (r) { return r.id === abrir; });
        if (reg && reg.datos) { escribirDatos(reg.datos); render(); irA('proyecto'); aviso('Diagnóstico cargado'); }
      }
      if (borrar && confirm('¿Borrar este diagnóstico del registro local?')) {
        Store.borrarRegistro(borrar);
        renderIndicadores();
        aviso('Diagnóstico borrado');
      }
    });
  }

  /* ---------- arranque ---------- */

  function iniciar() {
    if (!document.body.dataset.modo) document.body.dataset.modo = 'asesor';
    poblarCatalogos();
    conectar();

    var borrador = Store.leerBorrador();
    var prefs = Store.leerPrefs();
    if (borrador) {
      escribirDatos(borrador);
    } else {
      $('#asesor').value = prefs.asesor || '';
      setMoney('tasaUsd', prefs.tasaUsd || 0);
      setMoney('tasaEur', prefs.tasaEur || 0);
      $('#fechaTasa').value = prefs.fechaTasa || hoyISO();
    }
    $('#tasaUsdEspejo').value = $('#tasaUsd').value;
    if (!Store.disponible()) aviso('Este navegador no permite guardar datos locales: usa Descargar para no perder el resumen.');

    render();
    renderIndicadores();
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();
