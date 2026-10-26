# PICO: ¡RESCATEMOS LAS SEÑALES DE LA ESCUELA!
Una misión inclusiva para Primer Grado · Octubre, mes de la inclusión
Autora: Belén María Eugenia Dellamea · E.P.E.E Nº 3, El Colorado, Formosa

Videojuego web (HTML5 + CSS3 + JavaScript puro, sin librerías, sin cuentas, sin anuncios, sin datos personales).

## Cómo jugar en la computadora
Abrí `index.html` con Chrome o Edge (doble clic). Funciona con mouse, pantalla táctil y teclado.
Para que funcione **sin internet** (service worker) hay que abrirlo desde una dirección https (ver abajo); abriendo el archivo directamente también anda, pero sin la instalación offline.

## Publicar en GitHub Pages
1. Creá un repositorio nuevo en github.com (público).
2. Subí **el contenido de esta carpeta** (index.html, sw.js, css/, js/, img/, audio/, fonts/) a la raíz del repositorio.
3. En el repositorio: Settings → Pages → Source: "Deploy from a branch" → Branch: `main` / carpeta `/ (root)` → Save.
4. En 1–2 minutos el juego queda en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.

## Publicar en Netlify
1. Entrá a https://app.netlify.com/drop (con cuenta gratuita).
2. Arrastrá la carpeta completa del juego. Netlify te da un link https listo para compartir.

## Uso sin internet
Abrí el juego una vez con conexión desde la dirección https: el service worker guarda todos los archivos (≈11 MB). Después funciona sin conexión. Si se actualiza el juego, volvé a abrirlo con conexión una vez.

## Créditos
- Pictogramas: Autor: Sergio Palao. Procedencia: ARASAAC (https://arasaac.org). Propiedad: Gobierno de Aragón. Licencia: CC BY-NC-SA. Uso no comercial.
- Voces: generadas con inteligencia artificial (ElevenLabs). Si falta un audio, el juego usa la voz del navegador en español.
- Música y efectos: sintetizados por código.
- Tipografía: Poppins (SIL Open Font License).
- Personaje PICO: ilustración 2D original del proyecto.

## Datos
Solo se guardan en el navegador las opciones de accesibilidad y los niveles completados (localStorage). No se envía nada a ningún servidor.

## Actualizar archivos
Si modificás algún archivo, ejecutá `python3 tools/make_sw.py` para regenerar `sw.js`.
