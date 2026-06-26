/* ═══════════════════════════════════════════════════════════
   Bingo Musical — script.js
   ═══════════════════════════════════════════════════════════ */

// ── Estrellas ─────────────────────────────────────────────
function initStars() {
  const bg = document.getElementById('stars-bg');
  if (!bg) return;
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < 130; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    s.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      --dur: ${(Math.random() * 2.5 + 1).toFixed(2)}s;
      --delay: ${(Math.random() * 4).toFixed(2)}s;
    `;
    fragment.appendChild(s);
  }
  bg.appendChild(fragment);
}

// ── Confetti ──────────────────────────────────────────────
function lanzarConfetti() {
  const colores = ['#f4c2d7', '#9b59b6', '#d4a853', '#f0c040', '#e91e8c', '#fff'];
  const emojis  = ['✨', '💜', '🎤', '🦋', '⭐', '🎉', '🌟', '🎂'];

  for (let i = 0; i < 90; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti-pieza';
      el.style.left = (Math.random() * 100) + 'vw';

      const dur  = (Math.random() * 2 + 2.5).toFixed(2);
      const drift = ((Math.random() - 0.5) * 120).toFixed(0);
      const rot   = (Math.random() * 720 + 360).toFixed(0);
      el.style.animationDuration = dur + 's';
      el.style.setProperty('--drift', drift + 'px');
      el.style.setProperty('--rot', rot + 'deg');

      if (Math.random() > 0.4) {
        el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        el.style.fontSize = (Math.random() * 18 + 10) + 'px';
      } else {
        el.style.width    = (Math.random() * 10 + 5) + 'px';
        el.style.height   = (Math.random() * 6  + 3) + 'px';
        el.style.background    = colores[Math.floor(Math.random() * colores.length)];
        el.style.borderRadius  = '2px';
      }

      document.body.appendChild(el);
      setTimeout(() => el.remove(), parseFloat(dur) * 1000 + 600);
    }, i * 55);
  }
}

// ═══════════════════════════════════════════════════════════
// CARTÓN DEL JUGADOR
// ═══════════════════════════════════════════════════════════

function toggleMarca(celda) {
  if (typeof JUGADOR_NOMBRE === 'undefined') return;

  // Feedback táctil inmediato
  celda.classList.toggle('marcada');
  const totalActual = document.querySelectorAll('.celda.marcada').length;
  actualizarContador(totalActual);

  fetch('/api/marcar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: JUGADOR_NOMBRE, cancion: celda.dataset.cancion })
  })
  .then(r => r.json())
  .then(data => {
    // Sincronizar con estado real del servidor
    celda.classList.toggle('marcada', data.marcada);
    actualizarContador(data.total);
  })
  .catch(() => {
    // Revertir si hay error de red
    celda.classList.toggle('marcada');
    actualizarContador(document.querySelectorAll('.celda.marcada').length);
  });
}

function actualizarContador(total) {
  const num = document.getElementById('contador-num');
  if (num) num.textContent = total;

  const msg = document.getElementById('bingo-message');
  if (msg && total >= 16 && !msg.classList.contains('visible')) {
    msg.classList.add('visible');
  }
}

let bingoYaCantado = false;

function cantarBingo() {
  if (typeof JUGADOR_NOMBRE === 'undefined') return;
  if (bingoYaCantado) return;

  const btn = document.getElementById('btn-bingo');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '✅ ¡BINGO cantado!';
  }

  fetch('/api/bingo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: JUGADOR_NOMBRE })
  })
  .then(r => r.json())
  .then(data => {
    if (data.ok) {
      bingoYaCantado = true;
      lanzarConfetti();
    } else {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🎤 ¡BINGO, SOY LA ERA GANADORA!';
      }
    }
  })
  .catch(() => {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🎤 ¡BINGO, SOY LA ERA GANADORA!';
    }
  });
}

// ═══════════════════════════════════════════════════════════
// HOST PANEL
// ═══════════════════════════════════════════════════════════

const ganadoresYaVisto = new Set();

function toggleSonada(item) {
  const cancion = item.dataset.cancion;
  const checkbox = item.querySelector('input[type="checkbox"]');

  fetch('/api/host/marcar_sonada', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cancion })
  })
  .then(r => r.json())
  .then(data => {
    if (checkbox) checkbox.checked = data.sonada;
    item.classList.toggle('sonada', data.sonada);
    actualizarContadorSonadas();
  });
}

function actualizarContadorSonadas() {
  const el = document.getElementById('contador-sonadas');
  if (el) {
    el.textContent = document.querySelectorAll('.cancion-item.sonada').length;
  }
}

function actualizarPanelHost(data) {
  // ── Jugadores ──
  const listaEl = document.getElementById('jugadores-lista');
  const contEl  = document.getElementById('contador-jugadores');
  if (contEl) contEl.textContent = data.jugadores.length;

  if (listaEl) {
    if (data.jugadores.length === 0) {
      listaEl.innerHTML = '<div class="empty-state">Ningún jugador aún 🎵</div>';
    } else {
      listaEl.innerHTML = data.jugadores.map(j => {
        const pct = Math.round((j.marcadas / 16) * 100);
        const nombre = j.nombre.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const nombreEsc = j.nombre.replace(/'/g, "\\'").replace(/</g, '').replace(/>/g, '');
        return `
          <div class="jugador-fila">
            <span class="jugador-nombre-host" title="${nombre}">🎵 ${nombre}</span>
            <div class="progreso-wrap">
              <div class="progreso-bar-bg">
                <div class="progreso-bar-fill" style="width:${pct}%"></div>
              </div>
              <span class="progreso-num">${j.marcadas}/16</span>
            </div>
            <button class="btn-secondary" style="padding:0.25rem 0.6rem;font-size:0.72rem"
                    onclick="verCarton('${nombreEsc}')">Ver</button>
          </div>
        `;
      }).join('');
    }
  }

  // ── Ganadores ──
  const alertasEl = document.getElementById('alertas-bingo');
  if (alertasEl) {
    const nuevos = data.ganadores.filter(g => !ganadoresYaVisto.has(g.nombre_key));
    nuevos.forEach(g => ganadoresYaVisto.add(g.nombre_key));

    if (data.ganadores.length === 0) {
      alertasEl.innerHTML = '<div class="no-ganadores">Aún no hay ganadores 🎶</div>';
    } else {
      alertasEl.innerHTML = data.ganadores.map(g => {
        const nombre = g.nombre.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `
          <div class="alerta-bingo">
            <span class="alerta-icono">🎤</span>
            <span class="alerta-nombre">${nombre}</span>
            <span class="alerta-hora">${g.timestamp}</span>
          </div>
        `;
      }).join('');
    }

    if (nuevos.length > 0) {
      lanzarConfetti();
      const originalTitle = document.title;
      document.title = `🎉 ¡BINGO! ${nuevos[0].nombre}`;
      setTimeout(() => { document.title = originalTitle; }, 4000);
    }
  }

  // ── Canciones sonadas (sincronizar checkboxes) ──
  const sonadasSet = new Set(data.canciones_sonadas);
  document.querySelectorAll('.cancion-item').forEach(item => {
    const sonada = sonadasSet.has(item.dataset.cancion);
    item.classList.toggle('sonada', sonada);
    const cb = item.querySelector('input');
    if (cb) cb.checked = sonada;
  });
  actualizarContadorSonadas();
}

function iniciarPollingHost() {
  async function poll() {
    try {
      const res = await fetch('/api/host/status');
      if (!res.ok) return;
      const data = await res.json();
      actualizarPanelHost(data);
    } catch (_) { /* silencioso si no hay red */ }
  }
  poll();
  setInterval(poll, 3000);
}

// ── Modal ver cartón ──────────────────────────────────────
function verCarton(nombre) {
  fetch(`/api/host/ver_carton/${encodeURIComponent(nombre)}`)
  .then(r => r.json())
  .then(data => {
    if (data.error) return;

    const modal   = document.getElementById('modal-carton');
    const titulo  = document.getElementById('modal-titulo');
    const grilla  = document.getElementById('modal-grilla');
    if (!modal) return;

    const nombreMostrado = data.nombre.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    titulo.innerHTML = `🎵 Cartón de ${nombreMostrado}`;

    const sonadasActuales = new Set(
      [...document.querySelectorAll('.cancion-item.sonada')].map(el => el.dataset.cancion)
    );
    const marcadasJugador = new Set(data.marcadas);

    grilla.innerHTML = data.carton.map(c => {
      const partes = c.split(' - ');
      const artista = (partes[0] || '').replace(/</g, '&lt;');
      const cancion = (partes[1] || c).replace(/</g, '&lt;');

      let clase = 'libre';
      if (marcadasJugador.has(c)) {
        clase = sonadasActuales.has(c) ? 'valida' : 'invalida';
      }
      // Si sonó pero el jugador no la marcó: sin-verificar
      if (!marcadasJugador.has(c) && sonadasActuales.has(c)) {
        clase = 'sin-verificar';
      }

      return `
        <div class="celda-host ${clase}" title="${c.replace(/"/g, '&quot;')}">
          <small>${artista}</small>
          <span>${cancion}</span>
        </div>
      `;
    }).join('');

    modal.classList.add('visible');
  });
}

function cerrarModal() {
  const modal = document.getElementById('modal-carton');
  if (modal) modal.classList.remove('visible');
}

// ── Reset ─────────────────────────────────────────────────
function resetearJuego() {
  if (!confirm('¿Reiniciar el juego? Se borran todos los jugadores y cartones.')) return;

  fetch('/api/host/reset', { method: 'POST' })
  .then(r => r.json())
  .then(() => {
    ganadoresYaVisto.clear();
    actualizarPanelHost({ jugadores: [], ganadores: [], canciones_sonadas: [] });
  });
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initStars();

  // Inicializar contador si estamos en el cartón
  if (typeof JUGADOR_NOMBRE !== 'undefined') {
    const marcadasInicio = document.querySelectorAll('.celda.marcada').length;
    actualizarContador(marcadasInicio);
  }
});
