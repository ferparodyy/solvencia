# Diagnóstico de solvencia en asesoría

Herramienta web para que el asesor haga con el estudiante, en vivo, el diagnóstico financiero
de su proyecto de estudio en el exterior y cierre la conversación con una alternativa concreta
para avanzar.

Sin backend, sin dependencias, sin instalación: es HTML, CSS y JavaScript plano.
Abre `index.html` en cualquier navegador (también funciona sin internet).

## Qué hace

**1. Datos del proyecto** — destino, tipo y duración del programa, fecha estimada de viaje,
meses hasta el viaje (automáticos, sobrescribibles), valor del programa y fondos de referencia.
Todo editable: los requisitos cambian según destino, programa y perfil.

**2. Situación financiera** — las seis preguntas de la asesoría: ahorros, capacidad de ahorro
mensual, apoyo familiar y aporte del patrocinador, otros recursos y pago inicial disponible.
No se piden ni se guardan números de cuenta, extractos ni información bancaria.

**3. Resultado en tiempo real** — el panel derecho responde primero la pregunta que importa:
**¿se puede iniciar hoy?**

- **Veredicto**: cuánto vale la reserva, cuánto tiene disponible el estudiante, cuánto falta, y
  en cuántas semanas o meses lo completaría al ritmo de ahorro que declaró. Cuatro estados:
  sí puede hoy / está muy cerca (cubre 60 % o más) / hoy no alcanza / falta el valor del programa.
- **Qué alcanza hoy**: con el pago inicial declarado, qué se puede pagar y qué no.
- **Tu ruta, paso a paso**: reservar → completar el valor del programa → acreditar los fondos →
  documentos → procesos y visado → viajar. Cada paso con su monto, su momento y su estado.
- **Los números detrás**, para sustentar la ruta:

| Cifra | Cómo sale |
|---|---|
| Recursos actuales | ahorros + aporte del patrocinador (si hay apoyo) + otros recursos |
| Diferencia por preparar | fondos de referencia − recursos actuales (nunca negativa) |
| Ahorro mensual de referencia | diferencia ÷ meses hasta el viaje |
| Proyección a la fecha de viaje | recursos actuales + (capacidad mensual × meses) |
| Interpretación | estado según si la proyección alcanza la cifra de referencia |
| Reserva | valor del programa × porcentaje de reserva (25 % por defecto) |

**4. ¿Cómo podemos avanzar?** — tres rutas, con la sugerencia calculada a partir del pago inicial:

- **Opción A · reserva** del porcentaje acordado (25 % por defecto, editable) sobre el valor del programa.
- **Opción B · inicio en USD** — *cierre de último recurso*. La tarjeta viene bloqueada y solo se
  abre confirmando que el estudiante no puede cubrir la reserva. Muestra qué cubre, qué no cubre,
  el saldo pendiente y la fecha comprometida para completar la reserva.
- **Opción C · plan de preparación** — próxima revisión, meta de ahorro, documentos a organizar
  y próximo contacto del asesor.

**5. Guion** — frases de apoyo para cada momento de la conversación, con botón de copiar.

**6. Indicadores** — diagnósticos realizados, estudiantes con capacidad de iniciar, decisión
elegida en cada caso, pagos generados y tasa de conversión. Exportables a CSV para gerencia.

## Dos modos

- **Modo asesor**: edita valores, registra la decisión, guarda y consulta indicadores.
- **Modo estudiante**: oculta formularios, notas internas y controles; deja en pantalla las cifras,
  la interpretación y las alternativas, en grande. Pensado para girar la pantalla o compartirla.

La opción B nunca aparece en modo estudiante si el asesor no la desbloqueó.

## Entregar el resumen

Botones del panel de resultado: **WhatsApp** (versión corta, abre wa.me con el número del
estudiante), **Correo** (abre el cliente de correo con el resumen completo), **Descargar** (.txt),
**Imprimir / PDF** (hoja limpia con nombre, asesor y fecha) y **Copiar resumen**.

## Datos y privacidad

Todo se guarda en `localStorage` del equipo del asesor: no viaja a ningún servidor. El borrador
se conserva entre recargas y los diagnósticos guardados alimentan los indicadores. Para consolidar
varios equipos, usar **Exportar CSV** o el **Respaldo JSON** (que se puede reimportar).

## Cifras que la herramienta NO inventa

- **Fondos de referencia**: los digita el asesor según lo validado por el departamento de procesos.
  Hay un campo de fuente/nota para dejar constancia de la versión usada.
- **Tasas de cambio**: USD y EUR se digitan a mano, con su fecha. La herramienta no consulta
  tasas en línea; si falta la tasa, avisa en vez de asumir un valor. Elegir un destino **no**
  cambia la moneda de los montos: solo sugiere cuál se suele usar, y si hay una cifra grande
  digitada en moneda extranjera la herramienta pregunta si de verdad es así.
- El resultado siempre cierra con el aviso de que son cifras ilustrativas y no una evaluación migratoria.

## Estructura

```
index.html          Interfaz completa
assets/styles.css   Estilos (claro/oscuro, móvil, impresión)
js/config.js        Catálogos editables: destinos, tipos de programa, documentos, guion
js/calc.js          Motor de cálculo (funciones puras, sin DOM)
js/ruta.js          Veredicto de "¿se puede hoy?" y los pasos de la ruta
js/storage.js       localStorage: borrador, registros, indicadores
js/resumen.js       Formatos de moneda/fecha y armado del resumen y del CSV
js/app.js           Wiring de la interfaz
dist/demo.html      Build de un solo archivo (node tools/build-demo.js)
tests/              Pruebas del motor de cálculo y de la ruta
```

## Desarrollo

```bash
npm test                  # 26 pruebas (node --test, sin dependencias)
node tools/build-demo.js  # regenera dist/demo.html
python3 -m http.server 8080   # opcional: servir la carpeta
```

## Publicar

Es un sitio estático: sirve con GitHub Pages apuntando a la rama y carpeta raíz, o copiando
la carpeta a cualquier hosting. También funciona abriendo el archivo directamente desde el disco.

## Personalizar

- Destinos, tipos de programa, documentos sugeridos y frases del guion: `js/config.js`.
- Porcentaje de reserva y monto en USD: editables en pantalla, con 25 % y USD 200 por defecto.
- Colores y tipografía: variables CSS al inicio de `assets/styles.css`.
