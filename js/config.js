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
