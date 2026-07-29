# Función `bgg` — Integración con BoardGameGeek

Proxy hacia la [XML API2 de BGG](https://boardgamegeek.com/wiki/page/BGG_XML_API2) (que no envía CORS ni devuelve JSON) y sincronización de partidas de los socios.

## ⚠️ Token obligatorio

Desde 2025 la XML API de BGG **requiere registrar la aplicación** y enviar un token
en el header `Authorization: Bearer <token>` (sin él responde `401 Unauthorized`).

1. Entra en BGG con tu cuenta y sigue los pasos de
   [boardgamegeek.com/using_the_xml_api](https://boardgamegeek.com/using_the_xml_api)
   para registrar la aplicación y obtener el token.
2. Añade la variable de entorno **`BGG_TOKEN`** a esta función desde la consola de
   Appwrite (Functions → Integración BGG → Settings → Variables). No la metas en
   `appwrite.config.json` para no subir el secreto al repositorio.

Los términos de BGG piden uso no comercial y atribución ("Powered by BGG");
el frontend ya la incluye.

## Acciones (POST, JSON)

| `accion`      | Parámetros        | Qué hace |
|---------------|-------------------|----------|
| `buscar`      | `q`               | Busca juegos (devuelve id, nombre, año, thumbnail) |
| `juego`       | `bgg_id`          | Ficha completa de un juego |
| `vincular`    | `bgg_username`    | Comprueba el usuario en BGG y crea/actualiza `bgg_perfiles` |
| `sync`        | —                 | Descarga las partidas del usuario y las cachea en `bgg_partidas` |
| `privacidad`  | `publicar` (bool) | Cambia `publicar_stats` y reescribe los permisos de las partidas |
| `desvincular` | —                 | Borra el perfil y todas las partidas sincronizadas |

Requiere sesión (`execute: ["users"]`); el usuario se toma de `x-appwrite-user-id`.

## Privacidad

- Filas de `bgg_perfiles` y `bgg_partidas` con *row security*: siempre legibles por su
  dueño (`user:<id>`); solo si `publicar_stats` es `true` se añade `read(label:socio)`.
- El socio puede cambiarlo o desvincularse en cualquier momento desde la página
  "Estadísticas" del frontend.
