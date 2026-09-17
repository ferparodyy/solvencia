/*
 * Motor de cálculo del Diagnóstico de Solvencia.
 * Funciones puras, sin DOM: se usan en el navegador y en las pruebas de Node.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SolvenciaCalc = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  var DIAS_MES = 30.4375;

  function num(v) {
    var n = typeof v === 'number' ? v : parseFloat(String(v == null ? '' : v).replace(/[^\d.-]/g, ''));
    return isFinite(n) ? n : 0;
  }

  function clampPos(n) {
    return n > 0 ? n : 0;
  }

  /** Meses completos entre dos fechas ISO (yyyy-mm-dd). Nunca negativo. */
  function mesesEntre(desdeISO, hastaISO) {
    if (!desdeISO || !hastaISO) return 0;
    var a = new Date(desdeISO + 'T00:00:00');
    var b = new Date(hastaISO + 'T00:00:00');
    if (isNaN(a) || isNaN(b)) return 0;
    var dias = (b - a) / 86400000;
    return clampPos(Math.round(dias / DIAS_MES));
  }

  /** Suma meses a una fecha ISO y devuelve ISO. */
  function sumarMeses(desdeISO, meses) {
    if (!desdeISO) return '';
    var d = new Date(desdeISO + 'T00:00:00');
    if (isNaN(d)) return '';
    d.setMonth(d.getMonth() + Math.ceil(num(meses)));
    return d.toISOString().slice(0, 10);
  }

  /** Convierte un monto a COP usando tasas editables. */
  function aCOP(monto, moneda, tasas) {
    var m = num(monto);
    var t = tasas || {};
    if (moneda === 'USD') return m * num(t.usd);
    if (moneda === 'EUR') return m * num(t.eur);
    return m;
  }

  /**
   * Diagnóstico completo. Entrada plana (ver README) -> resultado plano.
   * Todo en COP. Ningún valor se inventa: lo que no se digita vale 0.
   */
  function diagnosticar(input) {
    var i = input || {};
    var tasas = { usd: num(i.tasaUsd), eur: num(i.tasaEur) };

    var fondosReferencia = clampPos(aCOP(i.fondosReferencia, i.monedaFondos, tasas));
    var valorPrograma = clampPos(aCOP(i.valorPrograma, i.monedaPrograma, tasas));

    var ahorros = clampPos(num(i.ahorros));
    var patrocinador = i.apoyoFamiliar ? clampPos(num(i.aportePatrocinador)) : 0;
    var otros = clampPos(num(i.otrosRecursos));
    var recursosActuales = ahorros + patrocinador + otros;

    var capacidadMensual = clampPos(num(i.capacidadMensual));
    var pagoInicial = clampPos(num(i.pagoInicial));

    var mesesCalculados = mesesEntre(i.hoy, i.fechaViaje);
    var meses = i.mesesOverride === '' || i.mesesOverride == null
      ? mesesCalculados
      : clampPos(Math.round(num(i.mesesOverride)));

    var diferencia = clampPos(fondosReferencia - recursosActuales);
    var ahorroMensualReferencia = meses > 0 ? diferencia / meses : diferencia;

    var aporteProyectado = capacidadMensual * meses;
    var proyeccionAlViaje = recursosActuales + aporteProyectado;
    var brechaProyectada = clampPos(fondosReferencia - proyeccionAlViaje);
    var cobertura = fondosReferencia > 0 ? recursosActuales / fondosReferencia : 0;
    var coberturaProyectada = fondosReferencia > 0 ? proyeccionAlViaje / fondosReferencia : 0;

    // Meses que tomaría cerrar la diferencia al ritmo de ahorro declarado.
    var mesesNecesarios = null;
    if (diferencia > 0 && capacidadMensual > 0) mesesNecesarios = Math.ceil(diferencia / capacidadMensual);
    var fechaSugerida = mesesNecesarios != null ? sumarMeses(i.hoy, mesesNecesarios) : '';

    var estado;
    if (fondosReferencia <= 0) estado = 'sin_referencia';
    else if (diferencia <= 0) estado = 'cubierto';
    else if (brechaProyectada <= 0) estado = 'en_ruta';
    else if (coberturaProyectada >= 0.7) estado = 'ajuste_menor';
    else estado = 'requiere_ajuste';

    var porcentajeReserva = i.porcentajeReserva === '' || i.porcentajeReserva == null ? 25 : num(i.porcentajeReserva);
    var reserva = valorPrograma * (porcentajeReserva / 100);

    var montoCierreUsd = i.montoCierreUsd === '' || i.montoCierreUsd == null ? 200 : num(i.montoCierreUsd);
    var cierreUsdCOP = montoCierreUsd * num(tasas.usd);
    var saldoDespuesCierreUsd = clampPos(reserva - cierreUsdCOP);

    return {
      hoy: i.hoy || '',
      tasas: tasas,
      fondosReferencia: fondosReferencia,
      valorPrograma: valorPrograma,
      recursos: { ahorros: ahorros, patrocinador: patrocinador, otros: otros, total: recursosActuales },
      recursosActuales: recursosActuales,
      diferencia: diferencia,
      meses: meses,
      mesesCalculados: mesesCalculados,
      capacidadMensual: capacidadMensual,
      ahorroMensualReferencia: ahorroMensualReferencia,
      aporteProyectado: aporteProyectado,
      proyeccionAlViaje: proyeccionAlViaje,
      brechaProyectada: brechaProyectada,
      cobertura: cobertura,
      coberturaProyectada: coberturaProyectada,
      mesesNecesarios: mesesNecesarios,
      fechaSugerida: fechaSugerida,
      estado: estado,
      porcentajeReserva: porcentajeReserva,
      reserva: reserva,
      montoCierreUsd: montoCierreUsd,
      cierreUsdCOP: cierreUsdCOP,
      saldoDespuesCierreUsd: saldoDespuesCierreUsd,
      pagoInicial: pagoInicial,
      puedeReserva: valorPrograma > 0 && pagoInicial >= reserva,
      faltaParaReserva: clampPos(reserva - pagoInicial),
      puedeCierreUsd: cierreUsdCOP > 0 && pagoInicial >= cierreUsdCOP
    };
  }

  var ESTADOS = {
    sin_referencia: {
      etiqueta: 'Falta el dato de referencia',
      tono: 'neutro',
      texto: 'Aún no se han registrado los fondos de referencia validados por procesos. Sin ese dato no hay diagnóstico.'
    },
    cubierto: {
      etiqueta: 'Recursos actuales por encima de la referencia',
      tono: 'ok',
      texto: 'Con lo declarado hoy, los recursos alcanzan la cifra de referencia. El siguiente paso es organizar documentos y pasar a la etapa de procesos y visado.'
    },
    en_ruta: {
      etiqueta: 'En ruta con el ahorro declarado',
      tono: 'ok',
      texto: 'Manteniendo el ahorro mensual declarado, el proyecto llega a la cifra de referencia antes de la fecha de viaje. Conviene sostener el ritmo y dejar el plan por escrito.'
    },
    ajuste_menor: {
      etiqueta: 'Cerca, con ajustes',
      tono: 'alerta',
      texto: 'Falta una parte de la diferencia para la fecha planteada. Se puede revisar subir el ahorro mensual, sumar apoyo económico legítimo o mover la fecha unas semanas.'
    },
    requiere_ajuste: {
      etiqueta: 'Requiere replantear el plan',
      tono: 'riesgo',
      texto: 'Con el ritmo actual la diferencia no se cubre para esa fecha. Hay que revisar fecha de viaje, duración o presupuesto del programa, y el apoyo económico disponible.'
    }
  };

  function interpretar(r) {
    var base = ESTADOS[r.estado] || ESTADOS.sin_referencia;
    var acciones = [];
    if (r.estado !== 'sin_referencia' && r.diferencia > 0) {
      if (r.meses > 0) {
        acciones.push('Ahorro mensual de referencia: ' + Math.round(r.ahorroMensualReferencia) + ' durante ' + r.meses + ' meses.');
      } else {
        acciones.push('No hay meses de preparación: la diferencia tendría que estar disponible ya.');
      }
      if (r.capacidadMensual > 0 && r.ahorroMensualReferencia > r.capacidadMensual) {
        acciones.push('El ahorro de referencia supera la capacidad declarada. Revisar apoyo económico, fecha o presupuesto.');
      }
      if (r.mesesNecesarios != null) {
        acciones.push('Al ritmo declarado, la diferencia se cubriría en ' + r.mesesNecesarios + ' meses.');
      }
      if (r.capacidadMensual <= 0) {
        acciones.push('No se registró capacidad de ahorro mensual: es el primer dato a definir.');
      }
    }
    return { etiqueta: base.etiqueta, tono: base.tono, texto: base.texto, acciones: acciones };
  }

  /** Sugerencia de ruta comercial. La opción USD es último recurso, nunca la primera. */
  function rutaComercial(r) {
    if (r.puedeReserva) return 'reserva';
    if (r.puedeCierreUsd) return 'cierre_usd';
    return 'seguimiento';
  }

  return {
    num: num,
    mesesEntre: mesesEntre,
    sumarMeses: sumarMeses,
    aCOP: aCOP,
    diagnosticar: diagnosticar,
    interpretar: interpretar,
    rutaComercial: rutaComercial,
    ESTADOS: ESTADOS
  };
});
