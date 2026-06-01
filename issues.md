# Issues — Tentáculos · Panel de gestión

> Herramienta interna para la junta directiva.  
> Stack: React + Vite + TailwindCSS · Appwrite 1.8.1  
> Estado: `[ ]` pendiente · `[x]` completado · `[-]` en progreso

---

## EPIC 0 — Infraestructura Appwrite

### #001 · Crear base de datos y colecciones en Appwrite
**Tipo:** backend · **Prioridad:** crítica · **Bloquea:** todo lo demás

Crear en Appwrite la base de datos `tentaculos` y todas las colecciones con sus atributos, índices y permisos.

#### Colección `socios`
| Atributo | Tipo | Requerido | Notas |
|---|---|---|---|
| nombre | string(100) | sí | |
| apellidos | string(150) | sí | |
| fecha_nacimiento | datetime | sí | solo para verificar mayoría de edad |
| fecha_alta | datetime | sí | default: now() |
| activo | boolean | sí | default: true |
| email | string(200) | no | opcional, GDPR mínimo |
| telefono | string(20) | no | |
| notas | string(1000) | no | |

#### Colección `materiales_socio`
| Atributo | Tipo | Requerido | Notas |
|---|---|---|---|
| socio_id | string(36) | sí | ref a socios.$id |
| nombre | string(200) | sí | |
| tipo | string(50) | sí | enum: `juego_mesa`, `rol`, `wargame`, `accesorio`, `otro` |
| descripcion | string(500) | no | |
| prestado_asociacion | boolean | sí | default: false |
| notas | string(500) | no | |

#### Colección `materiales_asociacion`
| Atributo | Tipo | Requerido | Notas |
|---|---|---|---|
| nombre | string(200) | sí | |
| tipo | string(50) | sí | enum: `juego_mesa`, `rol`, `wargame`, `accesorio`, `otro` |
| descripcion | string(500) | no | |
| estado | string(20) | sí | enum: `bueno`, `deteriorado`, `perdido` |
| ubicacion | string(200) | no | dónde está guardado |
| donado_por | string(36) | no | ref a socios.$id |
| fecha_adquisicion | datetime | no | |
| notas | string(500) | no | |

#### Colección `lugares`
| Atributo | Tipo | Requerido | Notas |
|---|---|---|---|
| nombre | string(150) | sí | |
| direccion | string(300) | no | |
| tipo | string(30) | sí | enum: `local_propio`, `bar`, `biblioteca`, `casa`, `otro` |
| capacidad | integer | no | nº máx jugadores |
| activo | boolean | sí | default: true |
| notas | string(500) | no | |

#### Colección `eventos`
| Atributo | Tipo | Requerido | Notas |
|---|---|---|---|
| titulo | string(200) | sí | |
| tipo_juego | string(50) | sí | enum: `rol`, `wargame`, `eurogame`, `party`, `otro` |
| fecha_inicio | datetime | sí | |
| fecha_fin | datetime | no | |
| lugar_id | string(36) | no | ref a lugares.$id |
| descripcion | string(1000) | no | |
| max_jugadores | integer | no | |
| asistentes | string[] | no | array de socios.$id |
| estado | string(20) | sí | enum: `planificado`, `confirmado`, `cancelado`, `realizado` |
| notas | string(500) | no | |

#### Colección `publicaciones`
| Atributo | Tipo | Requerido | Notas |
|---|---|---|---|
| titulo | string(200) | sí | |
| contenido | string(5000) | sí | |
| estado | string(20) | sí | enum: `borrador`, `listo`, `publicado` |
| redes | string[] | sí | array: `instagram`, `facebook`, `twitter`, `tiktok` |
| fecha_publicacion | datetime | no | fecha prevista o real |
| imagen_id | string(36) | no | ref a Appwrite Storage |
| evento_id | string(36) | no | ref a eventos.$id (opcional) |
| notas | string(500) | no | |

#### Permisos (todas las colecciones)
- Read, Create, Update, Delete: solo usuarios autenticados (`users`)
- Sin acceso público

#### Índices sugeridos
- `socios`: índice en `activo`, índice en `apellidos`
- `materiales_socio`: índice en `socio_id`
- `eventos`: índice en `fecha_inicio`, índice en `estado`
- `publicaciones`: índice en `estado`, índice en `fecha_publicacion`

**Tareas:**
- [x] Crear base de datos `tentaculos` en Appwrite Console
- [x] Crear las 6 colecciones con sus atributos
- [x] Configurar permisos en cada colección
- [x] Crear índices
- [x] Crear bucket `imagenes_publicaciones` en Storage (permisos: solo `users`)

---

### #002 · Script de seed / inicialización de Appwrite
**Tipo:** backend · **Prioridad:** media · **Depende de:** #001

Script Node.js en `backend/` que usa el Appwrite SDK (server-side) para crear la estructura completa desde cero. Útil para montar el entorno en otro servidor.

**Tareas:**
- [x] Crear `backend/package.json` con `node-appwrite`
- [x] Crear `backend/scripts/init-db.mjs` que crea DB, colecciones, atributos e índices
- [x] Añadir instrucciones de uso al README del backend
- [x] Requiere API Key con permisos de escritura en Appwrite

---

## EPIC 1 — Módulo Socios

### #003 · Listado de socios
**Tipo:** frontend · **Prioridad:** alta · **Depende de:** #001

Tabla/lista de todos los socios con filtros y acciones rápidas.

**Funcionalidades:**
- Listado paginado (25 por página)
- Filtro por estado (activo / baja)
- Búsqueda por nombre o apellidos
- Columnas: nombre completo, fecha de alta, estado (activo/baja), acciones
- Botón "Nuevo socio"
- Indicador del total de socios activos

**Tareas:**
- [x] Hook `useSocios(filtros)` con TanStack Query
- [x] Componente `SociosTable`
- [x] Componente `SearchBar` reutilizable
- [x] Componente `Badge` de estado (activo/baja)
- [x] Paginación

---

### #004 · Formulario de socio (crear / editar)
**Tipo:** frontend · **Prioridad:** alta · **Depende de:** #003

Modal o página dedicada para crear y editar socios.

**Campos:**
- Nombre (requerido)
- Apellidos (requerido)
- Fecha de nacimiento (requerido, datepicker)
- Email (opcional)
- Teléfono (opcional)
- Notas (opcional, textarea)
- Estado activo (toggle, solo en edición)

**Validaciones:**
- Fecha de nacimiento: no puede ser futura
- Email: formato válido si se rellena

**Tareas:**
- [x] Componente `SocioForm` (crear + editar)
- [x] Hook `useCreateSocio` / `useUpdateSocio`
- [x] Modal reutilizable `Dialog`
- [x] Datepicker simple
- [x] Confirmación antes de dar de baja (activo → false)

---

### #005 · Vista detalle de socio
**Tipo:** frontend · **Prioridad:** media · **Depende de:** #004

Página `/socios/:id` con toda la información del socio y sus materiales.

**Secciones:**
- Datos personales (con botón editar)
- Lista de materiales aportados por el socio (#010)
- Historial de eventos en los que ha participado

**Tareas:**
- [x] Página `SocioDetailPage`
- [x] Componente `SocioInfo`
- [x] Lista embebida de materiales del socio
- [x] Lista embebida de eventos del socio

---

## EPIC 2 — Módulo Materiales (Socios)

### #006 · Listado de materiales de socios
**Tipo:** frontend · **Prioridad:** media · **Depende de:** #001

Vista de todos los materiales aportados por socios.

**Funcionalidades:**
- Listado con columnas: nombre, tipo, socio propietario, prestado a asociación
- Filtro por tipo, por socio, por estado de préstamo
- Búsqueda por nombre

**Tareas:**
- [x] Hook `useMaterialesSocio(filtros)`
- [x] Componente `MaterialesSocioTable`
- [x] Filtros por tipo y por estado de préstamo

---

### #007 · Formulario de material de socio
**Tipo:** frontend · **Prioridad:** media · **Depende de:** #006

Crear y editar materiales asociados a un socio.

**Campos:**
- Nombre (requerido)
- Tipo (select: juego de mesa, rol, wargame, accesorio, otro)
- Descripción
- Socio propietario (select buscable de socios activos)
- Prestado a la asociación (toggle)
- Notas

**Tareas:**
- [x] Componente `MaterialSocioForm`
- [x] Hook `useCreateMaterialSocio` / `useUpdateMaterialSocio`
- [x] Select buscable de socios (componente `ComboboxSocios`)

---

## EPIC 3 — Módulo Materiales (Asociación)

### #008 · Listado de materiales de la asociación
**Tipo:** frontend · **Prioridad:** media · **Depende de:** #001

Inventario de los materiales propiedad de la asociación.

**Funcionalidades:**
- Listado con columnas: nombre, tipo, estado, ubicación
- Filtro por tipo y por estado (bueno / deteriorado / perdido)
- Búsqueda por nombre
- Alerta visual para materiales en estado `perdido`

**Tareas:**
- [x] Hook `useMaterialesAsociacion(filtros)`
- [x] Componente `MaterialesAsociacionTable`
- [x] Badge de estado con color (verde/amarillo/rojo)

---

### #009 · Formulario de material de asociación
**Tipo:** frontend · **Prioridad:** media · **Depende de:** #008

**Campos:**
- Nombre (requerido)
- Tipo (select)
- Descripción
- Estado (select: bueno, deteriorado, perdido)
- Ubicación (texto libre)
- Donado por (select opcional de socios)
- Fecha de adquisición (datepicker opcional)
- Notas

**Tareas:**
- [x] Componente `MaterialAsociacionForm`
- [x] Hook `useCreateMaterialAsociacion` / `useUpdateMaterialAsociacion`

---

## EPIC 4 — Módulo Lugares

### #010 · CRUD de lugares
**Tipo:** frontend · **Prioridad:** media · **Depende de:** #001

Gestión de los espacios donde se reúne la asociación.

**Funcionalidades:**
- Listado de lugares activos e inactivos
- Tarjetas con nombre, tipo, dirección y capacidad
- Crear / editar / desactivar lugar

**Campos del formulario:**
- Nombre (requerido)
- Dirección (texto libre)
- Tipo (select: local propio, bar, biblioteca, casa particular, otro)
- Capacidad máxima (número opcional)
- Notas
- Activo (toggle)

**Tareas:**
- [x] Hook `useLugares()`
- [x] Componente `LugaresList` (tarjetas)
- [x] Componente `LugarForm`
- [x] Hooks `useCreateLugar` / `useUpdateLugar`

---

## EPIC 5 — Módulo Eventos

### #011 · Calendario y listado de eventos
**Tipo:** frontend · **Prioridad:** alta · **Depende de:** #001, #010

Vista principal de eventos con doble presentación: lista y mini-calendario.

**Funcionalidades:**
- Vista lista: próximos eventos ordenados por fecha
- Vista calendario mensual (mini-cal con puntos de color por tipo de juego)
- Filtro por tipo de juego y por estado
- Badge de estado con color
- Contador de asistentes confirmados vs máximo

**Tareas:**
- [x] Hook `useEventos(filtros)`
- [x] Componente `EventosList`
- [x] Componente `MiniCalendario` (sin librería externa, implementación propia)
- [x] Componente `EventoBadgeEstado`

---

### #012 · Formulario de evento
**Tipo:** frontend · **Prioridad:** alta · **Depende de:** #011

**Campos:**
- Título (requerido)
- Tipo de juego (select: rol, wargame, eurogame, party, otro)
- Fecha y hora de inicio (requerido)
- Fecha y hora de fin (opcional)
- Lugar (select de lugares activos)
- Descripción
- Máximo de jugadores (número opcional)
- Asistentes (multi-select buscable de socios activos)
- Estado (select: planificado, confirmado, cancelado, realizado)
- Notas

**Tareas:**
- [x] Componente `EventoForm`
- [x] Hooks `useCreateEvento` / `useUpdateEvento`
- [x] Multi-select de socios para asistentes
- [x] Cambio de estado con confirmación para `cancelado`

---

### #013 · Vista detalle de evento
**Tipo:** frontend · **Prioridad:** baja · **Depende de:** #012

Página `/eventos/:id` con información completa del evento.

**Secciones:**
- Datos del evento con botón editar
- Lista de asistentes confirmados (con avatares/iniciales)
- Lugar con dirección
- Materiales sugeridos (enlace al inventario)

**Tareas:**
- [x] Página `EventoDetailPage`
- [x] Componente `AsistentesList`

---

## EPIC 6 — Módulo Publicaciones

### #014 · Listado de publicaciones
**Tipo:** frontend · **Prioridad:** media · **Depende de:** #001

Gestor de contenido para preparar posts de redes sociales.

**Funcionalidades:**
- Listado con columnas: título, redes destino, estado, fecha prevista
- Filtro por estado (borrador / listo / publicado) y por red social
- Vista kanban opcional: columnas Borrador → Listo → Publicado
- Búsqueda por título

**Tareas:**
- [x] Hook `usePublicaciones(filtros)`
- [x] Componente `PublicacionesList`
- [x] Vista kanban `PublicacionesKanban` (drag opcional, sin librería)
- [x] Iconos de redes sociales

---

### #015 · Editor de publicación
**Tipo:** frontend · **Prioridad:** media · **Depende de:** #014

Crear y editar publicaciones con previsualización básica.

**Campos:**
- Título (requerido, referencia interna)
- Contenido (textarea con contador de caracteres)
- Contador por red: Twitter 280, Instagram 2200, Facebook sin límite
- Redes destino (checkboxes múltiples)
- Fecha de publicación prevista (datepicker opcional)
- Imagen (subida a Appwrite Storage, opcional)
- Evento relacionado (select opcional de eventos)
- Estado (select: borrador, listo, publicado)
- Notas internas

**Tareas:**
- [x] Componente `PublicacionForm`
- [x] Hooks `useCreatePublicacion` / `useUpdatePublicacion`
- [x] Contador de caracteres con límite por red
- [x] Subida de imagen a Appwrite Storage (`useUploadImagen`)
- [x] Preview de imagen con posibilidad de eliminar

---

## EPIC 7 — Dashboard

### #016 · Página de inicio con resumen
**Tipo:** frontend · **Prioridad:** media · **Depende de:** #003, #011, #014

Dashboard con métricas rápidas y accesos directos.

**Widgets:**
- Total de socios activos
- Próximo evento (con fecha y lugar)
- Materiales de la asociación (total, cuántos en estado deteriorado/perdido)
- Publicaciones pendientes de publicar (estado `listo`)

**Tareas:**
- [x] Página `DashboardPage` como ruta `/`
- [x] Componente `StatCard`
- [x] Componente `ProximoEvento`
- [x] Queries paralelas con TanStack Query

---

## EPIC 8 — Componentes transversales

### #017 · Sistema de notificaciones (toast)
**Tipo:** frontend · **Prioridad:** alta · **Depende de:** —

Toast global para feedback de acciones (crear, editar, eliminar, error).

**Tareas:**
- [x] Contexto `ToastContext` + hook `useToast`
- [x] Componente `ToastContainer` (posición: bottom-right)
- [x] Tipos: success, error, info

---

### #018 · Modal / Dialog reutilizable
**Tipo:** frontend · **Prioridad:** alta · **Depende de:** —

Componente base para todos los formularios modales.

**Tareas:**
- [x] Componente `Dialog` con backdrop, tamaño configurable, cierre con Escape
- [x] Componente `ConfirmDialog` para acciones destructivas

---

### #019 · Componentes de tabla reutilizables
**Tipo:** frontend · **Prioridad:** media · **Depende de:** —

- [x] Componente `Table` con cabecera, filas y estado vacío
- [x] Componente `Pagination` (prev/next + indicador de página)
- [x] Componente `EmptyState` con icono y mensaje configurables

---

### #020 · Componentes de formulario base
**Tipo:** frontend · **Prioridad:** alta · **Depende de:** —

- [x] `Input`, `Textarea`, `Select`, `Toggle`, `DatePicker` con estilos consistentes
- [x] Componente `FormField` que agrupa label + input + mensaje de error
- [x] Componente `ComboboxBuscable` para selects con búsqueda (socios, lugares)

---

## Orden de implementación sugerido

```
#001 → #017 → #018 → #020 → #019
        ↓
       #003 → #004 → #005
        ↓
       #006 → #007
        ↓
       #008 → #009
        ↓
       #010
        ↓
       #011 → #012 → #013
        ↓
       #014 → #015
        ↓
       #016
        ↓
       #002 (puede hacerse en paralelo con #001)
```
