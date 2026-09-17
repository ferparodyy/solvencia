/*
 * Catálogos editables. Las cifras de fondos de referencia NO vienen precargadas:
 * las define el departamento de procesos y las digita el asesor en cada diagnóstico.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SolvenciaConfig = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  return {
    // moneda: la que suele usar el destino, solo como valor por defecto del selector.
    destinos: [
      { nombre: 'Irlanda', moneda: 'EUR' },
      { nombre: 'Australia', moneda: 'USD' },
      { nombre: 'Canadá', moneda: 'USD' },
      { nombre: 'Malta', moneda: 'EUR' },
      { nombre: 'España', moneda: 'EUR' },
      { nombre: 'Reino Unido', moneda: 'EUR' },
      { nombre: 'Nueva Zelanda', moneda: 'USD' },
      { nombre: 'Estados Unidos', moneda: 'USD' },
      { nombre: 'Otro destino', moneda: 'COP' }
    ],

    tiposPrograma: [
      'Curso de idioma',
      'Idioma + trabajo',
      'Programa vocacional / certificado',
      'Pregrado',
      'Posgrado / maestría',
      'Otro'
    ],

    decisiones: [
      { id: 'reserva', etiqueta: 'Reserva del porcentaje acordado' },
      { id: 'cierre_usd', etiqueta: 'Inicio con monto en USD (último recurso)' },
      { id: 'seguimiento', etiqueta: 'Plan de preparación con seguimiento' },
      { id: 'sin_decision', etiqueta: 'Sin decisión en esta asesoría' }
    ],

    // Con qué se suele respaldar cada origen del dinero. El soporte exacto de cada
    // destino lo confirma el departamento de procesos: aquí solo se orienta.
    fuentesSolvencia: [
      { fuente: 'Tu ahorro', soporte: 'Extractos de la cuenta de los últimos meses' },
      { fuente: 'Apoyo de un patrocinador', soporte: 'Carta de patrocinio, más los soportes de ingreso y extractos de quien apoya' },
      { fuente: 'Cesantías o prima', soporte: 'Certificado del fondo o del empleador' },
      { fuente: 'Tu salario', soporte: 'Certificación laboral y desprendibles de pago' },
      { fuente: 'Ingresos independientes', soporte: 'RUT, declaración de renta y extractos' },
      { fuente: 'Venta de un bien', soporte: 'Documento de la venta y el ingreso reflejado en la cuenta' }
    ],

    noSePaga: 'Este dinero no se paga ni se envía a nadie: se demuestra que existe. Es el respaldo de que puedes sostener tu estadía.',

    documentosSugeridos: [
      'Documento de identidad vigente',
      'Pasaporte (o cita para tramitarlo)',
      'Certificados de estudio / diplomas',
      'Certificación laboral o de ingresos',
      'Soportes del apoyo económico (carta del patrocinador)',
      'Historial de ahorro del último periodo'
    ],

    guion: [
      {
        momento: 'Apertura de la parte financiera',
        texto: 'Ahora vamos a revisar la parte financiera de tu proyecto. La idea no es decirte simplemente cuánto dinero necesitas, sino entender en qué punto estás hoy y qué tendríamos que organizar para que puedas viajar en la fecha que deseas.'
      },
      {
        momento: 'Al mostrar el resultado',
        texto: 'Con la información que acabamos de ingresar, podemos revisar qué alternativas tienes para comenzar y qué aspectos debes preparar antes de pasar a la etapa de procesos y visado.'
      },
      {
        momento: 'Al mostrar la cifra de solvencia',
        texto: 'Antes de que veas el número, quiero que tengas clara una cosa: esta plata no se paga ni se envía a nadie. Es un respaldo que se demuestra, para que la embajada vea que puedes sostener tu estadía.'
      },
      {
        momento: 'Si el estudiante se asusta con el monto',
        texto: 'Es normal que de una sola vez se vea enorme. Por eso no lo miramos así: lo partimos en meses, sumamos lo que ya tienes y el apoyo con el que cuentas, y ahí verás que es un plan, no un muro.'
      },
      {
        momento: 'Al mostrar las alternativas',
        texto: 'No hay una sola manera de llegar. Podemos darte más tiempo, sumar un apoyo, subir un poco el ahorro o ajustar el programa. Miremos cuál se parece más a tu realidad.'
      },
      {
        momento: 'Antes de las opciones',
        texto: 'Esta cifra no es una aprobación ni un rechazo: es el punto de partida para organizar tu plan. Miremos juntos cómo podemos avanzar desde donde estás hoy.'
      },
      {
        momento: 'Si el estudiante duda del monto',
        texto: 'Los fondos de referencia los define el departamento de procesos según el destino, el programa y tu perfil. Si algo cambia en tu caso, los ajustamos y volvemos a revisar el plan.'
      },
      {
        momento: 'Cierre con seguimiento',
        texto: 'Dejemos una fecha concreta para volver a revisar tus números y una meta de ahorro clara. Así, cuando nos hablemos de nuevo, avanzamos en lugar de empezar otra vez.'
      }
    ],

    aviso: 'Cifras únicamente ilustrativas. No representan una evaluación migratoria real ni una aprobación de visa.'
  };
});
