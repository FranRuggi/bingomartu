# 🎵 Bingo Musical — Taylor Swift Edition

App de bingo de canciones para la fiesta. Los jugadores acceden desde su celular, reciben un cartón 4×4 y marcan las canciones a medida que las escuchan.

## Instrucciones rápidas

### 1. Instalar dependencia

```bash
pip install flask
```

### 2. Editar la lista de canciones (opcional)

Abrí `app.py` y editá la variable `CANCIONES` (arriba del archivo) para agregar o sacar canciones.  
También podés cambiar `NOMBRE_CUMPLE` al nombre de la festejada.

### 3. Ejecutar

```bash
python app.py
```

### 4. Conectarse desde los celulares

Todos los invitados deben estar en la **misma red WiFi**. Para ver tu IP:

```bash
hostname -I
```

Luego cada uno abre en su celular:

```
http://<IP-DE-LA-RASPBERRY>:5000
```

Ejemplo: `http://192.168.1.100:5000`

### 5. Panel del host (vos)

```
http://<IP-DE-LA-RASPBERRY>:5000/host
```

Desde ahí podés:
- Ver los jugadores y su progreso
- Marcar las canciones que ya sonaron (para referencia tuya)
- Ver el cartón de cualquier jugador y verificar que no hizo trampa
- Recibir la notificación cuando alguien canta BINGO
- Reiniciar el juego para jugar otra vez

## Notas

- El cartón de cada jugador es **determinístico**: si alguien recarga la página con el mismo nombre, recupera su mismo cartón.
- No hace falta Internet para jugar (solo para cargar las fuentes de Google Fonts la primera vez).
- Si la imagen decorativa no se descarga, aparece un fondo SVG de fallback automáticamente.
