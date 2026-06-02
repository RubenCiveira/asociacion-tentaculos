# Backend — Tentáculos

Gestión de la infraestructura Appwrite: esquema de base de datos y funciones serverless.

## Requisitos

- [Appwrite CLI](https://appwrite.io/docs/tooling/command-line/installation) instalado
- Acceso al proyecto Appwrite (`https://appwrite.civeira.net`)
- API Key con permisos suficientes (ver sección correspondiente)

```bash
# Verificar versión instalada
appwrite --version

# Actualizar si es necesario
appwrite update
```

## Autenticación

```bash
# Login interactivo (guarda sesión local)
appwrite login

# — o — mediante variable de entorno para CI/CD
export APPWRITE_API_KEY=<api-key>
```

La sesión se guarda en `~/.appwrite/`. Una vez autenticado no hace falta repetirlo en cada comando.

---

## Desplegar cambios a Appwrite (`push`)

El fichero de configuración es `appwrite.config.json`. Como el CLI espera `appwrite.json` por defecto, todos los comandos requieren el flag `--config`.

### Desplegar todo (esquema + funciones)

```bash
cd backend
appwrite push --config appwrite.config.json
```

### Desplegar solo las funciones

```bash
appwrite push functions --config appwrite.config.json
```

### Desplegar solo las colecciones

```bash
appwrite push collections --config appwrite.config.json
```

---

## Sincronizar desde Appwrite (`pull`)

Para traer el estado actual de Appwrite al fichero local (útil si se han hecho cambios desde la consola web):

```bash
appwrite pull --config appwrite.config.json
```

> **Atención:** `pull` sobreescribe `appwrite.config.json` con el estado remoto. Haz commit antes de ejecutarlo si tienes cambios locales sin subir.

---

## Variable de entorno de la función (paso manual obligatorio)

La función `inscripcion-evento` necesita una `APPWRITE_API_KEY` en runtime para poder leer y escribir en la base de datos. **Esta variable no está en `appwrite.config.json`** porque contiene un secreto y no debe estar en el repositorio.

Después de cada primer despliegue de la función (o al crearla desde cero), añade la variable manualmente:

### Opción A — Desde la consola web

1. Abre `https://appwrite.civeira.net` → **Functions** → `inscripcion-evento`
2. Ve a **Settings** → **Variables**
3. Añade:
   | Key | Value |
   |-----|-------|
   | `APPWRITE_API_KEY` | `<api-key con permisos databases.read + databases.write>` |
4. Guarda y redespliega la función para que tome efecto.

### Opción B — Con la CLI

```bash
appwrite functions createVariable \
  --functionId inscripcion-evento \
  --key APPWRITE_API_KEY \
  --value <api-key>
```

> La API Key de la función **no** necesita los mismos permisos que la de administración. Crea una key específica con solo `databases.read` y `databases.write`.

---

## Estructura

```
backend/
├── appwrite.config.json     # Esquema del proyecto (colecciones, funciones, permisos)
├── functions/
│   └── inscripcion-evento/  # Función serverless: inscripción/retirada de eventos
│       ├── src/main.mjs
│       └── package.json
└── scripts/                 # Scripts de utilidad (init-db, user-report…)
```

## Variables de entorno locales

Copia `.env.example` a `.env` para los scripts de `scripts/`:

```bash
cp .env.example .env
# Edita .env y rellena APPWRITE_API_KEY
```

El `.env` de los scripts **no** es el mismo que el de la función en runtime.
