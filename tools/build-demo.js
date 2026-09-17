/*
 * Genera dist/demo.html: la app completa en un solo archivo, para publicarla
 * como vista de prueba o enviarla por correo. `node tools/build-demo.js`
 */
const fs = require('fs');
const path = require('path');
const raiz = path.join(__dirname, '..');
const leer = (p) => fs.readFileSync(path.join(raiz, p), 'utf8');

const html = leer('index.html');
const css = leer('assets/styles.css');
const js = ['js/config.js', 'js/calc.js', 'js/ruta.js', 'js/storage.js', 'js/resumen.js', 'js/app.js'].map(leer).join('\n');

const cuerpo = html
  .slice(html.indexOf('<body'), html.lastIndexOf('</body>'))
  .replace(/^<body[^>]*>/, '')
  .replace(/<script src="[^"]+"><\/script>/g, '')
  .trim();

const salida = `<title>Diagnóstico de Solvencia</title>
<style>
${css}
</style>
${cuerpo}
<script>window.SOLVENCIA_DEMO = true;</script>
<script>
${js}
</script>
`;

fs.mkdirSync(path.join(raiz, 'dist'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'dist/demo.html'), salida);
console.log('dist/demo.html', (salida.length / 1024).toFixed(1) + ' KB');
