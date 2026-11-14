# Operación Extracción - Videojuego FPS 3D (Evaluación T3)

El Proyecto esta desarrollado para la Evaluación T3 del curso de Computación Gráfica y Visual (UPN). Consiste en un juego de disparos en primera persona en un complejo militar infestado de zombis donde el objetivo es administrar la munición, abrirse paso entre los enemigos y llegar hasta la zona verde de extracción.

# Instrucciones de instalación y ejecución
1. Clonar o descargar este repositorio y abrir la carpeta en Visual Studio Code.
2. Debido a que el proyecto carga modelos tridimensionales en formato `.glb` mediante `THREE.GLTFLoader`, se debe abrir utilizando la extensión "Live Server".
3. Hacer clic derecho sobre `index.html` y elegir "Open with Live Server".
4. Al abrirse en el navegador, hacer clic en el botón "INICIAR MISIÓN".

# Controles del videojuego
- "W, A, S, D:" Mover al personaje.
- "Clic Izquierdo:" Realizar un disparo.
  "Esc:" Para poner pausa al juego.
- "Tecla 1:" Seleccionar Arma 1 (Pistola de Plasma).
- "Tecla 2:" Seleccionar Arma 2 (Cañón Pesado).

## Fuentes de recursos
- Los modelos `arma1.glb`, `arma2.glb` y `zombi.glb` incluidos en `assets/models/` y las texturas del escenario fueron generados para el proyecto utilizando geometrías y utilidades de exportación de Three.js.