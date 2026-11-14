let escena, camara, renderizador;
let controlesActivos = false;
let estado = 'INICIO';

let yaw = 0, pitch = 0;
let sensibilidad = 0.0022; // Sensibilidad por defecto
const teclas = { w: false, a: false, s: false, d: false };
let velocidad = 0.14, tiempoBoost = 0, retroceso = 0;

// Armas y municiones independientes
let armaActual = 1;
const municion = { 1: 10, 2: 6 };
let arma1Mesh, arma2Mesh, fogonazo;

const muros = [];
const zombis = [];
const items = [];
const raycaster = new THREE.Raycaster();
let zonaMeta;

function iniciar() {
    escena = new THREE.Scene();
    escena.background = new THREE.Color(0x141c11);
    escena.fog = new THREE.FogExp2(0x141c11, 0.02);

    //Cámara en primera persona
    camara = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
    camara.rotation.order = 'YXZ';
    camara.position.set(0, 1.8, 42);
    escena.add(camara);

    escena.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sol = new THREE.DirectionalLight(0xcceebb, 0.8);
    sol.position.set(10, 25, 15);
    escena.add(sol);

    renderizador = new THREE.WebGLRenderer({ antialias: true });
    renderizador.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderizador.domElement);

    crearEscenario();
    cargarModelosGLB();
    crearColeccionables();
    configurarControles();
    actualizarHUD();
    animar();
}

// Escenario 3D y Zona de Extracción
function crearEscenario() {
    const suelo = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 140),
        new THREE.MeshStandardMaterial({ color: 0x3b5230 })
    );
    suelo.rotation.x = -Math.PI / 2;
    suelo.position.z = -10;
    escena.add(suelo);

    const matMuro = new THREE.MeshStandardMaterial({ color: 0x4a5228, roughness: 0.9 });
    function muro(x, z, w, d) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, 5.5, d), matMuro);
        m.userData.esMuro = true;
        m.position.set(x, 2.75, z);
        escena.add(m);
        muros.push({ minX: x - w / 2 - 0.6, maxX: x + w / 2 + 0.6, minZ: z - d / 2 - 0.6, maxZ: z + d / 2 + 0.6 });
    }

    muro(-14, -10, 1, 120); muro(14, -10, 1, 120);
    muro(0, 50, 28, 1);     muro(0, -70, 28, 1);
    muro(-8, 28, 12, 1.2);  muro(8, 28, 12, 1.2);
    muro(-5, 14, 4, 4);     muro(6, 10, 5, 3);
    muro(0, -4, 14, 1.5);   muro(-7, -22, 8, 1.5);
    muro(7, -22, 8, 1.5);   muro(-4, -36, 3.5, 3.5);
    muro(5, -40, 3.5, 3.5); muro(-8, -52, 11, 1.5);
    muro(8, -52, 11, 1.5);

    zonaMeta = new THREE.Mesh(
        new THREE.CylinderGeometry(3.8, 3.8, 0.3, 20),
        new THREE.MeshBasicMaterial({ color: 0x00ff66 })
    );
    zonaMeta.position.set(0, 0.15, -63);
    escena.add(zonaMeta);
}

function modeloArmaBase(tipo) {
    const g = new THREE.Group();
    if (tipo === 1) {
        const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.75), new THREE.MeshStandardMaterial({ color: 0x9b2226 }));
        const nucleo = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.35), new THREE.MeshBasicMaterial({ color: 0x38b000 }));
        nucleo.position.set(0, 0.05, -0.05);
        const mira = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 8, 12), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
        mira.position.set(0, 0.19, -0.15);
        g.add(cuerpo, nucleo, mira);
    } else {
        const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.9), new THREE.MeshStandardMaterial({ color: 0x1d3557 }));
        const canon = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.95, 12), new THREE.MeshStandardMaterial({ color: 0xe63946 }));
        canon.rotation.x = Math.PI / 2;
        canon.position.set(0, 0.04, -0.1);
        g.add(cuerpo, canon);
    }
    return g;
}

function modeloZombiBase() {
    const z = new THREE.Group();
    const piel = new THREE.MeshStandardMaterial({ color: 0x588157 });
    const ropa = new THREE.MeshStandardMaterial({ color: 0x3a5a40 });
    const ojos = new THREE.MeshBasicMaterial({ color: 0xd90429 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.5), ropa); torso.position.y = 1.4;
    const cabeza = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), piel); cabeza.position.y = 2.35;
    const ojoI = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.05), ojos); ojoI.position.set(-0.15, 2.4, 0.33);
    const ojoD = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.05), ojos); ojoD.position.set(0.15, 2.4, 0.33);
    const brazoI = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.95), piel); brazoI.position.set(-0.6, 1.75, 0.35);
    const brazoD = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.95), piel); brazoD.position.set(0.6, 1.75, 0.35);
    const piernaI = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.35), ropa); piernaI.position.set(-0.25, 0.4, 0);
    const piernaD = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.35), ropa); piernaD.position.set(0.25, 0.4, 0);

    z.add(torso, cabeza, ojoI, ojoD, brazoI, brazoD, piernaI, piernaD);
    return z;
}


function cargarModelosGLB() {
    arma1Mesh = new THREE.Group();
    arma2Mesh = new THREE.Group();
    arma1Mesh.position.set(0.35, -0.32, -0.65);
    arma2Mesh.position.set(0.35, -0.32, -0.65);
    arma2Mesh.visible = false;
    camara.add(arma1Mesh, arma2Mesh);

    fogonazo = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshBasicMaterial({ color: 0x70e000 }));
    fogonazo.position.set(0.35, -0.25, -1.1);
    fogonazo.visible = false;
    camara.add(fogonazo);

    const loader = new THREE.GLTFLoader();
    // Arma 1: tamaño y rotación
    loader.load('assets/models/arma1.glb', (g) => {
        g.scene.scale.set(0.15, 0.15, 0.15);
        // g.scene.rotation.y = Math.PI;     
        arma1Mesh.add(g.scene);
    }, undefined, () => arma1Mesh.add(modeloArmaBase(1)));

    // Arma 2: tamaño y rotación
    loader.load('assets/models/arma2.glb', (g) => {
        g.scene.scale.set(0.01, 0.01, 0.01); 
        arma2Mesh.add(g.scene);
    }, undefined, () => arma2Mesh.add(modeloArmaBase(2)));
    loader.load('assets/models/zombi.glb', (g) => spawnearZombis(g.scene), undefined, () => spawnearZombis(modeloZombiBase()));
}

function spawnearZombis(plantilla) {
    const coords = [[0, 22], [-7, 12], [7, 6], [-8, -6], [8, -10], [0, -20], [-6, -32], [6, -38], [-3, -48], [3, -55]];
    coords.forEach((pos, idx) => {
        const clon = plantilla.clone();
        clon.position.set(pos[0], 0, pos[1]);
        clon.traverse(h => { if (h.isMesh) h.userData.zombiIndex = idx; });
        escena.add(clon);
        zombis.push({ malla: clon, vidas: 2, activo: false, muerto: false, rango: 18, vel: 0.08 });
    });
    actualizarHUD();
}

//Cajas de munición y velocidad
function crearColeccionables() {
    const datos = [
        { x: -9, z: 33, tipo: 'MUNICION' }, { x: 9, z: 16, tipo: 'MUNICION' },
        { x: 0, z: 2, tipo: 'VELOCIDAD' },  { x: -9, z: -15, tipo: 'MUNICION' },
        { x: 9, z: -28, tipo: 'MUNICION' }, { x: 0, z: -44, tipo: 'VELOCIDAD' }
    ];
    datos.forEach(d => {
        const color = d.tipo === 'MUNICION' ? 0x38b000 : 0x00b4d8;
        const caja = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), new THREE.MeshStandardMaterial({ color }));
        caja.position.set(d.x, 0.8, d.z);
        escena.add(caja);
        items.push({ malla: caja, tipo: d.tipo, usado: false });
    });
}

//Disparo y detección de impacto con Raycaster
function disparar() {
    if (municion[armaActual] <= 0) return notificar('⚠️ ¡Sin munición! Recoge una caja verde');
    municion[armaActual]--;
    retroceso = 5;
    actualizarHUD();

    fogonazo.visible = true;
    setTimeout(() => fogonazo.visible = false, 60);

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camara);
    const objetivos = [];
    zombis.forEach(z => { if (!z.muerto) z.malla.traverse(h => { if (h.isMesh) objetivos.push(h); }); });

    const hits = raycaster.intersectObjects(objetivos, false);
    if (hits.length > 0) {
        const z = zombis[hits[0].object.userData.zombiIndex];
        z.vidas--;
        z.activo = true;
        if (z.vidas <= 0) {
            z.muerto = true;
            z.malla.rotation.x = -Math.PI / 2;
            z.malla.position.y = 0.25;
            notificar('🎯 ¡Zombi eliminado! (2/2 disparos)');
        } else {
            notificar('💥 Impacto (1/2)');
        }
        actualizarHUD();
    }
}

// cámara, teclado y mouse
function configurarControles() {
    document.getElementById('btn-jugar').onclick = () => { estado = 'JUGANDO'; document.body.requestPointerLock(); };
    document.getElementById('btn-reiniciar').onclick = () => location.reload();

    const btnGLB = document.getElementById('btn-generar-glb');
    if (btnGLB) btnGLB.onclick = descargarGLBs;

    document.addEventListener('pointerlockchange', () => {
        controlesActivos = (document.pointerLockElement === document.body);
        if (estado === 'JUGANDO') document.getElementById('overlay').style.display = controlesActivos ? 'none' : 'flex';
    });


    const sliderSens = document.getElementById('slider-sensibilidad');
    const textoSens = document.getElementById('valor-sens');
    if (sliderSens) {
        sliderSens.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            sensibilidad = val * 0.001; // Convierte la escala 0.5 - 5.0 a radianes
            textoSens.innerText = val.toFixed(1);
        });
    }

    document.addEventListener('mousemove', (e) => {
        if (!controlesActivos || estado !== 'JUGANDO') return;
        yaw -= e.movementX * sensibilidad;
        pitch = Math.max(-1.3, Math.min(1.3, pitch - e.movementY * sensibilidad));
        camara.rotation.y = yaw;
        camara.rotation.x = pitch;
    });

    window.addEventListener('mousedown', (e) => {
        if (e.button === 0 && controlesActivos && estado === 'JUGANDO') disparar();
    });

    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (teclas.hasOwnProperty(k)) teclas[k] = true;
        if (k === '1') { armaActual = 1; arma1Mesh.visible = true; arma2Mesh.visible = false; actualizarHUD(); }
        if (k === '2') { armaActual = 2; arma1Mesh.visible = false; arma2Mesh.visible = true; actualizarHUD(); }
    });

    window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (teclas.hasOwnProperty(k)) teclas[k] = false;
    });
}

function libreDeMuro(x, z) {
    return !muros.some(m => x > m.minX && x < m.maxX && z > m.minZ && z < m.maxZ);
}

// Bucle principal
function actualizar() {
    if (estado !== 'JUGANDO' || !controlesActivos) return;

    velocidad = tiempoBoost > 0 ? (tiempoBoost--, 0.21) : 0.14;
    document.getElementById('estado-velocidad').innerText = tiempoBoost > 0 ? '⚡ BOOST' : 'Normal';

    const adelante = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const derecha = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    let dx = 0, dz = 0;

    if (teclas.w) { dx += adelante.x * velocidad; dz += adelante.z * velocidad; }
    if (teclas.s) { dx -= adelante.x * velocidad; dz -= adelante.z * velocidad; }
    if (teclas.d) { dx += derecha.x * velocidad;  dz += derecha.z * velocidad; }
    if (teclas.a) { dx -= derecha.x * velocidad;  dz -= derecha.z * velocidad; }

    if (libreDeMuro(camara.position.x + dx, camara.position.z)) camara.position.x += dx;
    if (libreDeMuro(camara.position.x, camara.position.z + dz)) camara.position.z += dz;

    const armaMesh = armaActual === 1 ? arma1Mesh : arma2Mesh;
    armaMesh.position.z = retroceso > 0 ? (retroceso--, -0.52) : -0.65;

    items.forEach(it => {
        if (!it.usado) {
            it.malla.rotation.y += 0.04;
            if (Math.hypot(camara.position.x - it.malla.position.x, camara.position.z - it.malla.position.z) < 1.8) {
                it.usado = true;
                it.malla.visible = false;
                if (it.tipo === 'MUNICION') { municion[1] += 6; municion[2] += 4; actualizarHUD(); notificar('🔋 +Munición'); }
                else { tiempoBoost = 350; notificar('⚡ +Velocidad'); }
            }
        }
    });

    zombis.forEach(z => {
        if (z.muerto) return;
        const dist = Math.hypot(camara.position.x - z.malla.position.x, camara.position.z - z.malla.position.z);
        if (!z.activo && dist <= z.rango) z.activo = true;

        if (z.activo) {
            z.malla.lookAt(camara.position.x, 0, camara.position.z);
            const mx = ((camara.position.x - z.malla.position.x) / dist) * z.vel;
            const mz = ((camara.position.z - z.malla.position.z) / dist) * z.vel;
            if (libreDeMuro(z.malla.position.x + mx, z.malla.position.z)) z.malla.position.x += mx;
            if (libreDeMuro(z.malla.position.x, z.malla.position.z + mz)) z.malla.position.z += mz;
            if (dist < 1.35) finDelJuego('GAMEOVER');
        }
    });

    if (Math.hypot(camara.position.x - zonaMeta.position.x, camara.position.z - zonaMeta.position.z) < 3.6) {
        finDelJuego('VICTORIA');
    }
}

function actualizarHUD() {
    document.getElementById('arma-actual').innerText = armaActual === 1 ? 'ARMA: [1] Pistola Plasma' : 'ARMA: [2] Cañón Pesado';
    document.getElementById('balas').innerText = municion[armaActual];
    document.getElementById('ammo-1').innerText = municion[1];
    document.getElementById('ammo-2').innerText = municion[2];
    document.getElementById('zombis-vivos').innerText = zombis.filter(z => !z.muerto).length;
}

function notificar(msj) {
    const el = document.getElementById('notificacion');
    el.innerText = msj;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 1800);
}

function finDelJuego(res) {
    estado = res;
    document.exitPointerLock();
    document.getElementById('overlay').style.display = 'flex';
    document.getElementById('btn-jugar').style.display = 'none';
    document.getElementById('btn-reiniciar').style.display = 'inline-block';

    // Ocultar el cuadro de controles y sensibilidad en Game Over / Victoria
    const infoControles = document.querySelector('.controles-info');
    if (infoControles) infoControles.style.display = 'none';

    const titulo = document.getElementById('overlay-title');
    titulo.innerText = res === 'VICTORIA' ? '🚁 ¡MISIÓN COMPLETADA!' : '💀 GAME OVER';
    titulo.style.color = res === 'VICTORIA' ? '#00ff66' : '#ff3333';

    const subtitulo = document.getElementById('overlay-subtitle');
    if (subtitulo) {
        subtitulo.style.display = 'block';
        subtitulo.innerText = res === 'VICTORIA'
            ? '¡MISIÓN COMPLETADA! Has llegado a la zona de extracción.'
            : 'Has sido atrapado por un zombi.';
    }
}

function descargarGLBs() {
    const exp = new THREE.GLTFExporter();
    const bajar = (obj, nombre) => exp.parse(obj, (b) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([b], { type: 'model/gltf-binary' }));
        a.download = nombre;
        a.click();
    }, { binary: true });

    bajar(modeloArmaBase(1), 'arma1.glb');
    setTimeout(() => bajar(modeloArmaBase(2), 'arma2.glb'), 400);
    setTimeout(() => bajar(modeloZombiBase(), 'zombi.glb'), 800);
}

function animar() {
    requestAnimationFrame(animar);
    actualizar();
    renderizador.render(escena, camara);
}

iniciar();