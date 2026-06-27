from flask import Flask, render_template, request, jsonify, redirect, url_for
import random
import hashlib
import os
import urllib.request
from datetime import datetime

app = Flask(__name__)

# ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
NOMBRE_CUMPLE = "Martu"  # ← Cambiar al nombre de la cumpleañera

CANCIONES = [
    # Taylor Swift (6)
    "Taylor Swift - Shake It Off",
    "Taylor Swift - Blank Space",
    "Taylor Swift - Cruel Summer",
    "Taylor Swift - Anti-Hero",
    "Taylor Swift - Love Story",
    "Taylor Swift - 22",
    # Olivia Rodrigo (4)
    "Olivia Rodrigo - good 4 u",
    "Olivia Rodrigo - drivers license",
    "Olivia Rodrigo - vampire",
    "Olivia Rodrigo - deja vu",
    # Bad Bunny (5)
    "Bad Bunny - Tití Me Preguntó",
    "Bad Bunny - Yonaguni",
    "Bad Bunny - Callaíta",
    "Bad Bunny - Dakiti",
    "Bad Bunny - Me Porto Bonito",
    # Reggaetón viejo (6)
    "Daddy Yankee - Gasolina",
    "Don Omar - Dale Don Dale",
    "Wisin y Yandel - Rakata",
    "Don Omar & Lucenzo - Danza Kuduro",
    "Calle 13 - Atrévete-te-te",
    "Tego Calderón - Pa' Que Retozen",
    # Pop internacional (9)
    "Dua Lipa - Levitating",
    "Harry Styles - As It Was",
    "The Weeknd - Blinding Lights",
    "Miley Cyrus - Flowers",
    "Bruno Mars - Uptown Funk",
    "Billie Eilish - bad guy",
    "Ariana Grande - thank u, next",
    "Lady Gaga - Bad Romance",
    "Rihanna - Umbrella",
    # Latino / Argentina (7)
    "Shakira & Bizarrap - BZRP Session #53",
    "Karol G - TQG",
    "Rosalía - Despechá",
    "J Balvin - Mi Gente",
    "María Becerra - Ojalá",
    "Duki - Goteo",
    "Paulo Londra - Adán y Eva",
    # Cumbia (4)
    "Damas Gratis - Me Vas a Extrañar",
    "Los Palmeras - Bombón Asesino",
    "Gilda - No Me Arrepiento de Este Amor",
    "Ráfaga - Una Cerveza",
    # Rock (4)
    "Soda Stereo - De Música Ligera",
    "Gustavo Cerati - Crimen",
    "Fito Páez - 11 y 6",
    "Queen - Bohemian Rhapsody",
]

# ─── DESCARGA DE IMAGEN HERO (con fallback silencioso) ────────────────────────
def _descargar_hero():
    dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'hero.jpg')
    if os.path.exists(dest):
        return
    urls = [
        'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=75&fm=jpg',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=75&fm=jpg',
    ]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = resp.read()
            with open(dest, 'wb') as f:
                f.write(data)
            return
        except Exception:
            continue

_descargar_hero()

# ─── ESTADO EN MEMORIA ────────────────────────────────────────────────────────
jugadores = {}        # key=nombre_lower → {nombre, carton, marcadas}
bingo_ganadores = []  # [{nombre, nombre_key, timestamp}]
canciones_sonadas = set()


def generar_carton(nombre):
    """Cartón determinístico: mismo nombre → siempre el mismo cartón."""
    seed = int(hashlib.md5(nombre.lower().strip().encode()).hexdigest(), 16)
    rng = random.Random(seed)
    pool = CANCIONES.copy()
    rng.shuffle(pool)
    return pool[:16]


# ─── RUTAS JUGADOR ────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html', nombre_cumple=NOMBRE_CUMPLE)


@app.route('/register', methods=['POST'])
def register():
    nombre = request.form.get('nombre', '').strip()
    if not nombre:
        return redirect(url_for('index'))
    key = nombre.lower()
    if key not in jugadores:
        jugadores[key] = {
            'nombre': nombre,
            'carton': generar_carton(nombre),
            'marcadas': []
        }
    return redirect(url_for('carton', nombre=nombre))


@app.route('/carton/<nombre>')
def carton(nombre):
    key = nombre.lower()
    if key not in jugadores:
        return redirect(url_for('index'))
    return render_template('carton.html',
                           jugador=jugadores[key],
                           nombre_cumple=NOMBRE_CUMPLE)


@app.route('/api/marcar', methods=['POST'])
def marcar():
    data = request.get_json()
    key = data.get('nombre', '').lower().strip()
    cancion = data.get('cancion', '')
    if key not in jugadores:
        return jsonify({'error': 'no encontrado'}), 404
    marcadas = jugadores[key]['marcadas']
    if cancion in marcadas:
        marcadas.remove(cancion)
        estado = False
    else:
        marcadas.append(cancion)
        estado = True
    return jsonify({'marcada': estado, 'total': len(marcadas)})


@app.route('/api/bingo', methods=['POST'])
def cantar_bingo():
    data = request.get_json()
    key = data.get('nombre', '').lower().strip()
    if key not in jugadores:
        return jsonify({'error': 'no encontrado'}), 404
    jugador = jugadores[key]
    if len(jugador['marcadas']) < 16:
        return jsonify({'error': 'faltan canciones'}), 400
    if not any(g['nombre_key'] == key for g in bingo_ganadores):
        bingo_ganadores.append({
            'nombre': jugador['nombre'],
            'nombre_key': key,
            'timestamp': datetime.now().strftime('%H:%M:%S')
        })
    return jsonify({'ok': True})


# ─── RUTAS HOST ───────────────────────────────────────────────────────────────

@app.route('/host')
def host():
    return render_template('host.html',
                           canciones=CANCIONES,
                           nombre_cumple=NOMBRE_CUMPLE)


@app.route('/api/host/status')
def host_status():
    return jsonify({
        'jugadores': [
            {'nombre': j['nombre'], 'marcadas': len(j['marcadas'])}
            for j in jugadores.values()
        ],
        'ganadores': bingo_ganadores,
        'canciones_sonadas': list(canciones_sonadas)
    })


@app.route('/api/host/marcar_sonada', methods=['POST'])
def marcar_sonada():
    data = request.get_json()
    cancion = data.get('cancion', '')
    if cancion in canciones_sonadas:
        canciones_sonadas.discard(cancion)
        return jsonify({'sonada': False})
    canciones_sonadas.add(cancion)
    return jsonify({'sonada': True})


@app.route('/api/host/ver_carton/<nombre>')
def ver_carton_host(nombre):
    key = nombre.lower()
    if key not in jugadores:
        return jsonify({'error': 'no encontrado'}), 404
    j = jugadores[key]
    return jsonify({
        'nombre': j['nombre'],
        'carton': j['carton'],
        'marcadas': j['marcadas']
    })


@app.route('/api/host/reset', methods=['POST'])
def reset():
    global bingo_ganadores
    jugadores.clear()
    bingo_ganadores = []
    canciones_sonadas.clear()
    return jsonify({'ok': True})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
