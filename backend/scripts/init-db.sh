#!/usr/bin/env bash
# =============================================================================
# Tentáculos — Inicialización de base de datos vía Appwrite CLI
# =============================================================================
# Requisitos:
#   1. Appwrite CLI instalada (npm i -g appwrite)
#   2. CLI autenticada: appwrite login
#   3. CLI configurada:
#        appwrite client \
#          --endpoint https://appwrite.civeira.net/v1 \
#          --project-id 6a1c8e6400066368d20b
#
# Uso: bash backend/scripts/init-db.sh
# =============================================================================

set -euo pipefail

DB="tentaculos"
# Permisos como array de bash (sin eval, sin riesgo de interpretación)
PERMS=('read("users")' 'create("users")' 'update("users")' 'delete("users")')

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $*"; }
warn() { echo -e "  ${YELLOW}·${NC} $* (ya existe, se omite)"; }
step() { echo -e "\n${YELLOW}▶ $1${NC}"; }

# Wrapper: ignora error 409 (ya existe), falla en cualquier otro error.
# Usa "$@" directamente — sin eval — para que los paréntesis de los
# permisos no sean interpretados por bash.
run() {
  local label="${*: -1}"   # último argumento como etiqueta
  local out
  if out=$("$@" 2>&1); then
    ok "$label"
  else
    if echo "$out" | grep -qi "409\|already exist\|duplicate"; then
      warn "$label"
    else
      echo -e "  ${RED}✗${NC} $label"
      echo -e "  ${RED}  $out${NC}"
      return 1
    fi
  fi
}

# Pausa entre atributos (Appwrite los procesa en background)
w() { sleep 0.5; }

# =============================================================================
step "Base de datos: $DB"
# =============================================================================
run appwrite databases create \
  --database-id "$DB" \
  --name "Tentáculos"

# =============================================================================
step "Colección: socios"
# =============================================================================
run appwrite databases create-collection \
  --database-id "$DB" \
  --collection-id socios \
  --name "Socios" \
  --permissions "${PERMS[@]}" \
  --document-security false

w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id socios --key nombre      --size 100  --required true
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id socios --key apellidos   --size 150  --required true
w; run appwrite databases create-datetime-attribute --database-id "$DB" --collection-id socios --key fecha_nacimiento --required true
w; run appwrite databases create-datetime-attribute --database-id "$DB" --collection-id socios --key fecha_alta      --required true
w; run appwrite databases create-boolean-attribute  --database-id "$DB" --collection-id socios --key activo      --required true
w; run appwrite databases create-email-attribute    --database-id "$DB" --collection-id socios --key email       --required false
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id socios --key telefono    --size 20   --required false
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id socios --key notas       --size 1000 --required false

echo "  Esperando propagación de atributos…"; sleep 3

run appwrite databases create-index --database-id "$DB" --collection-id socios --key idx_activo    --type key      --attributes activo
run appwrite databases create-index --database-id "$DB" --collection-id socios --key idx_apellidos --type key      --attributes apellidos
run appwrite databases create-index --database-id "$DB" --collection-id socios --key idx_nombre    --type fulltext --attributes nombre

# =============================================================================
step "Colección: materiales_socio"
# =============================================================================
run appwrite databases create-collection \
  --database-id "$DB" \
  --collection-id materiales_socio \
  --name "Materiales de socios" \
  --permissions "${PERMS[@]}" \
  --document-security false

w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id materiales_socio --key socio_id             --size 36  --required true
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id materiales_socio --key nombre               --size 200 --required true
w; run appwrite databases create-enum-attribute     --database-id "$DB" --collection-id materiales_socio --key tipo --elements juego_mesa rol wargame accesorio otro --required true
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id materiales_socio --key descripcion          --size 500 --required false
w; run appwrite databases create-boolean-attribute  --database-id "$DB" --collection-id materiales_socio --key prestado_asociacion  --required true
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id materiales_socio --key notas                --size 500 --required false

echo "  Esperando propagación de atributos…"; sleep 3
run appwrite databases create-index --database-id "$DB" --collection-id materiales_socio --key idx_socio_id --type key --attributes socio_id

# =============================================================================
step "Colección: materiales_asociacion"
# =============================================================================
run appwrite databases create-collection \
  --database-id "$DB" \
  --collection-id materiales_asociacion \
  --name "Materiales de la asociación" \
  --permissions "${PERMS[@]}" \
  --document-security false

w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id materiales_asociacion --key nombre             --size 200 --required true
w; run appwrite databases create-enum-attribute     --database-id "$DB" --collection-id materiales_asociacion --key tipo --elements juego_mesa rol wargame accesorio otro --required true
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id materiales_asociacion --key descripcion        --size 500 --required false
w; run appwrite databases create-enum-attribute     --database-id "$DB" --collection-id materiales_asociacion --key estado --elements bueno deteriorado perdido --required true
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id materiales_asociacion --key ubicacion          --size 200 --required false
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id materiales_asociacion --key donado_por         --size 36  --required false
w; run appwrite databases create-datetime-attribute --database-id "$DB" --collection-id materiales_asociacion --key fecha_adquisicion  --required false
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id materiales_asociacion --key notas              --size 500 --required false

echo "  Esperando propagación de atributos…"; sleep 3
run appwrite databases create-index --database-id "$DB" --collection-id materiales_asociacion --key idx_estado --type key --attributes estado

# =============================================================================
step "Colección: lugares"
# =============================================================================
run appwrite databases create-collection \
  --database-id "$DB" \
  --collection-id lugares \
  --name "Lugares" \
  --permissions "${PERMS[@]}" \
  --document-security false

w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id lugares --key nombre    --size 150 --required true
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id lugares --key direccion --size 300 --required false
w; run appwrite databases create-enum-attribute     --database-id "$DB" --collection-id lugares --key tipo --elements local_propio bar biblioteca casa otro --required true
w; run appwrite databases create-integer-attribute  --database-id "$DB" --collection-id lugares --key capacidad --required false
w; run appwrite databases create-boolean-attribute  --database-id "$DB" --collection-id lugares --key activo   --required true
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id lugares --key notas    --size 500 --required false

echo "  Esperando propagación de atributos…"; sleep 3
run appwrite databases create-index --database-id "$DB" --collection-id lugares --key idx_activo --type key --attributes activo

# =============================================================================
step "Colección: eventos"
# =============================================================================
run appwrite databases create-collection \
  --database-id "$DB" \
  --collection-id eventos \
  --name "Eventos" \
  --permissions "${PERMS[@]}" \
  --document-security false

w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id eventos --key titulo          --size 200 --required true
w; run appwrite databases create-enum-attribute     --database-id "$DB" --collection-id eventos --key tipo_juego --elements rol wargame eurogame party otro --required true
w; run appwrite databases create-datetime-attribute --database-id "$DB" --collection-id eventos --key fecha_inicio    --required true
w; run appwrite databases create-datetime-attribute --database-id "$DB" --collection-id eventos --key fecha_fin       --required false
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id eventos --key lugar_id        --size 36  --required false
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id eventos --key descripcion     --size 1000 --required false
w; run appwrite databases create-integer-attribute  --database-id "$DB" --collection-id eventos --key max_jugadores   --required false
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id eventos --key asistentes      --size 36  --required false --array true
w; run appwrite databases create-enum-attribute     --database-id "$DB" --collection-id eventos --key estado --elements planificado confirmado cancelado realizado --required true
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id eventos --key notas           --size 500 --required false

echo "  Esperando propagación de atributos…"; sleep 3
run appwrite databases create-index --database-id "$DB" --collection-id eventos --key idx_fecha  --type key --attributes fecha_inicio --orders DESC
run appwrite databases create-index --database-id "$DB" --collection-id eventos --key idx_estado --type key --attributes estado

# =============================================================================
step "Colección: publicaciones"
# =============================================================================
run appwrite databases create-collection \
  --database-id "$DB" \
  --collection-id publicaciones \
  --name "Publicaciones" \
  --permissions "${PERMS[@]}" \
  --document-security false

w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id publicaciones --key titulo             --size 200  --required true
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id publicaciones --key contenido          --size 5000 --required true
w; run appwrite databases create-enum-attribute     --database-id "$DB" --collection-id publicaciones --key estado --elements borrador listo publicado --required true
w; run appwrite databases create-enum-attribute     --database-id "$DB" --collection-id publicaciones --key redes --elements instagram facebook twitter tiktok --required true --array true
w; run appwrite databases create-datetime-attribute --database-id "$DB" --collection-id publicaciones --key fecha_publicacion  --required false
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id publicaciones --key imagen_id          --size 36   --required false
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id publicaciones --key evento_id          --size 36   --required false
w; run appwrite databases create-string-attribute   --database-id "$DB" --collection-id publicaciones --key notas              --size 500  --required false

echo "  Esperando propagación de atributos…"; sleep 3
run appwrite databases create-index --database-id "$DB" --collection-id publicaciones --key idx_estado --type key --attributes estado
run appwrite databases create-index --database-id "$DB" --collection-id publicaciones --key idx_fecha  --type key --attributes fecha_publicacion --orders DESC

# =============================================================================
echo -e "\n${GREEN}✅ Base de datos lista.${NC}"
echo -e "   Abre https://appwrite.civeira.net/console para verificar.\n"
