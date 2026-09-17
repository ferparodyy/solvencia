/*
 * Convierte la cifra grande en un plan manejable: de dónde sale el dinero,
 * cómo se ve mes a mes, y qué palancas existen cuando no alcanza.
 *
 * Idea central: los fondos de referencia no se pagan, se demuestran.
 */
(function (root, factory) {
  var api = factory(root.SolvenciaCalc);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SolvenciaPlan = api;
})(typeof self !== 'undefined' ? self : globalThis, function (Calc) {
  'use strict';

  var SEMANAS_MES = 4.345;
  var DIAS_MES = 30.4375;

  /** De qué está compuesta la meta: lo que ya hay, y lo que falta construir. */
  function composicion(r) {
    var meta = r.fondosReferencia;
    var partes = [
      { id: 'ahorros', etiqueta: 'Lo que ya tienes ahorrado', monto: r.recursos.ahorros },
      { id: 'patrocinador', etiqueta: 'Apoyo de tu patrocinador', monto: r.recursos.patrocinador },
      { id: 'otros', etiqueta: 'Otros recursos del viaje', monto: r.recursos.otros },
      { id: 'construir', etiqueta: 'Lo que vas a construir con tu ahorro', monto: r.diferencia }
    ].filter(function (p) { return p.monto > 0; });

    var total = partes.reduce(function (a, p) { return a + p.monto; }, 0);
    partes.forEach(function (p) { p.pct = total > 0 ? p.monto / total : 0; });

    return {
      meta: meta,
      partes: partes,
      cubierto: r.recursosActuales,
      porConstruir: r.diferencia,
      pctCubierto: meta > 0 ? Math.min(1, r.recursosActuales / meta) : 0
    };
  }

  /** El monto mensual, dicho también por semana y por día. */
  function equivalencias(mensual) {
    var m = mensual > 0 ? mensual : 0;
    return {
      mensual: m,
      semanal: m / SEMANAS_MES,
      diario: m / DIAS_MES
    };
  }

  /**
   * Cronograma de acumulado hasta la fecha de viaje.
   * Si hay muchos meses, se muestran hitos espaciados para que quepa en pantalla.
   */
  function cronograma(r, maxFilas) {
    var tope = maxFilas || 6;
    if (r.meses <= 0 || r.diferencia <= 0) return [];

    var paso = Math.max(1, Math.ceil(r.meses / tope));
    var filas = [];
    for (var m = paso; m <= r.meses; m += paso) {
      filas.push(m);
    }
    if (filas[filas.length - 1] !== r.meses) filas.push(r.meses);

    return filas.map(function (m) {
      return {
        mes: m,
        fecha: Calc.sumarMeses(r.hoy, m),
        objetivo: r.recursosActuales + r.ahorroMensualReferencia * m,
        faltante: Math.max(0, r.fondosReferencia - (r.recursosActuales + r.ahorroMensualReferencia * m)),
        esMeta: m === r.meses
      };
    });
  }

  /**
   * Qué se puede mover cuando el ahorro de referencia no cabe en la realidad
   * del estudiante. Todo se deriva de sus propios datos.
   */
  function palancas(datos, r) {
    var d = datos || {};
    var lista = [];
    if (r.diferencia <= 0) return lista;

    var capacidad = r.capacidadMensual;
    var exceso = r.ahorroMensualReferencia - capacidad;

    // 1. Mover la fecha: cuántos meses necesita al ritmo que ya declaró.
    if (capacidad > 0 && r.mesesNecesarios != null && r.mesesNecesarios > r.meses) {
      lista.push({
        id: 'fecha',
        titulo: 'Darte más tiempo',
        // {fecha} lo reemplaza quien formatea: aquí no se decide el formato.
        texto: 'Con el ahorro que ya puedes hacer, llegas a la meta en ' + r.mesesNecesarios
          + ' meses. Si mueves el viaje a {fecha}, no tienes que ahorrar ni un peso más al mes.',
        valor: capacidad,
        fecha: Calc.sumarMeses(r.hoy, r.mesesNecesarios)
      });
    }

    // 2. Sumar apoyo: cuánto tendría que aportar alguien para que el plan quepa.
    if (capacidad > 0 && exceso > 0) {
      var apoyoNecesario = Math.max(0, r.diferencia - capacidad * r.meses);
      lista.push({
        id: 'apoyo',
        titulo: 'Sumar un apoyo',
        texto: 'Si consigues ' + Math.round(apoyoNecesario) + ' de apoyo familiar, cesantías, prima '
          + 'o venta de algo, el resto lo cubres con los ' + Math.round(capacidad) + ' que ya puedes ahorrar al mes.',
        valor: apoyoNecesario
      });
    }

    // 3. Ingreso extra: el faltante mensual dicho en semanas.
    if (exceso > 0) {
      lista.push({
        id: 'extra',
        titulo: 'Subir un poco el ahorro',
        texto: 'Te faltan ' + Math.round(exceso) + ' al mes frente a lo que ya ahorras. '
          + 'Son ' + Math.round(exceso / SEMANAS_MES) + ' a la semana: un ingreso extra, un gasto que se recorta.',
        valor: exceso
      });
    }

    // 4. Ajustar el proyecto: programa más corto o más económico.
    if (r.valorPrograma > 0 && exceso > 0) {
      lista.push({
        id: 'programa',
        titulo: 'Ajustar el programa',
        texto: 'Un curso más corto o en otra ciudad baja tanto el valor del programa como los '
          + 'fondos que debes demostrar. Vale la pena revisar las opciones antes de descartar el viaje.',
        valor: 0
      });
    }

    return lista;
  }

  /** Mensaje de encuadre según qué tan lejos está la meta. Nunca alarmista. */
  function encuadre(r) {
    if (r.fondosReferencia <= 0) {
      return {
        tono: 'neutro',
        titulo: 'Definamos tu meta',
        texto: 'Con el destino y el programa claros, el departamento de procesos entrega la cifra que debes demostrar. Ese es el punto de partida.'
      };
    }
    if (r.diferencia <= 0) {
      return {
        tono: 'ok',
        titulo: 'Ya tienes la solvencia que se pide',
        texto: 'Con lo que declaras hoy cubres la cifra de referencia. Ahora se trata de ordenar los soportes para demostrarlo.'
      };
    }
    var pct = Math.round((r.recursosActuales / r.fondosReferencia) * 100);
    if (pct >= 50) {
      return {
        tono: 'ok',
        titulo: 'Ya llevas más de la mitad del camino',
        texto: 'Tienes el ' + pct + ' % de la cifra. Lo que falta se construye con un plan de ahorro, no de un solo golpe.'
      };
    }
    if (pct >= 15) {
      return {
        tono: 'neutro',
        titulo: 'Tienes con qué empezar',
        texto: 'Ya cubres el ' + pct + ' % de la cifra. El resto es un plan mes a mes, y hay varias formas de armarlo.'
      };
    }
    return {
      tono: 'neutro',
      titulo: 'Empecemos por el plan, no por el monto',
      texto: 'La cifra completa asusta si se mira de una sola vez. Partida en meses, y sumando el apoyo que tengas, se vuelve manejable.'
    };
  }

  return {
    composicion: composicion,
    equivalencias: equivalencias,
    cronograma: cronograma,
    palancas: palancas,
    encuadre: encuadre
  };
});
