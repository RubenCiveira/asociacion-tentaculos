#!/usr/bin/env bash
# =============================================================================
# Tentáculos — Actualización de permisos por rol en Appwrite
# =============================================================================
# Requiere la misma configuración que init-db.sh:
#   appwrite login
#   appwrite client --endpoint https://appwrite.civeira.net/v1 \
#                   --project-id 6a1c8e6400066368d20b
#
# Modelo de roles:
#   label:socio          → lee eventos, publicaciones, lugares, materiales
#   label:gestor-material → idem + lee socios + escribe materiales
#   label:admin          → lectura y escritura total
#
# Uso: bash backend/scripts/update-permissions.sh
# =============================================================================

set -euo pipefail

DB="tentaculos"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $*"; }
step() { echo -e "\n${YELLOW}▶ $1${NC}"; }

run() {
  local label="${*: -1}"
  local out
  if out=$("$@" 2>&1); then
    ok "$label"
  else
    echo -e "  ${RED}✗${NC} $label"
    echo -e "  ${RED}  $out${NC}"
    return 1
  fi
}

# Permisos reutilizables
ADMIN_RW=('read("label:admin")' 'create("label:admin")' 'update("label:admin")' 'delete("label:admin")')

# lee: admin + gestor-material + socio  |  escribe: solo admin
READ_ALL_WRITE_ADMIN=(
  'read("label:admin")'
  'read("label:gestor-material")'
  'read("label:socio")'
  'create("label:admin")'
  'update("label:admin")'
  'delete("label:admin")'
)

# lee: admin + gestor-material  |  escribe: admin + gestor-material
READ_GESTOR_WRITE_GESTOR=(
  'read("label:admin")'
  'read("label:gestor-material")'
  'create("label:admin")'
  'create("label:gestor-material")'
  'update("label:admin")'
  'update("label:gestor-material")'
  'delete("label:admin")'
  'delete("label:gestor-material")'
)

# =============================================================================
step "socios — lectura: admin + gestor-material | escritura: admin"
# =============================================================================
run appwrite databases update-collection \
  --database-id "$DB" --collection-id socios --name "Socios" \
  --permissions \
    'read("label:admin")' \
    'read("label:gestor-material")' \
    'create("label:admin")' \
    'update("label:admin")' \
    'delete("label:admin")'

# =============================================================================
step "materiales_socio — lectura: admin+gestor+socio | escritura: admin+gestor"
# =============================================================================
run appwrite databases update-collection \
  --database-id "$DB" --collection-id materiales_socio --name "Materiales de socios" \
  --permissions "${READ_GESTOR_WRITE_GESTOR[@]}" \
  --document-security false

# Wait: add socio read on top of gestor permissions
run appwrite databases update-collection \
  --database-id "$DB" --collection-id materiales_socio --name "Materiales de socios" \
  --permissions \
    'read("label:admin")' \
    'read("label:gestor-material")' \
    'read("label:socio")' \
    'create("label:admin")' \
    'create("label:gestor-material")' \
    'update("label:admin")' \
    'update("label:gestor-material")' \
    'delete("label:admin")' \
    'delete("label:gestor-material")'

# =============================================================================
step "materiales_asociacion — lectura: admin+gestor+socio | escritura: admin+gestor"
# =============================================================================
run appwrite databases update-collection \
  --database-id "$DB" --collection-id materiales_asociacion --name "Materiales de la asociación" \
  --permissions \
    'read("label:admin")' \
    'read("label:gestor-material")' \
    'read("label:socio")' \
    'create("label:admin")' \
    'create("label:gestor-material")' \
    'update("label:admin")' \
    'update("label:gestor-material")' \
    'delete("label:admin")' \
    'delete("label:gestor-material")'

# =============================================================================
step "lugares — lectura: admin+gestor+socio | escritura: solo admin"
# =============================================================================
run appwrite databases update-collection \
  --database-id "$DB" --collection-id lugares --name "Lugares" \
  --permissions "${READ_ALL_WRITE_ADMIN[@]}"

# =============================================================================
step "eventos — lectura: admin+gestor+socio | escritura: solo admin"
# =============================================================================
run appwrite databases update-collection \
  --database-id "$DB" --collection-id eventos --name "Eventos" \
  --permissions "${READ_ALL_WRITE_ADMIN[@]}"

# =============================================================================
step "publicaciones — lectura: admin+gestor+socio | escritura: solo admin"
# =============================================================================
run appwrite databases update-collection \
  --database-id "$DB" --collection-id publicaciones --name "Publicaciones" \
  --permissions "${READ_ALL_WRITE_ADMIN[@]}"

# =============================================================================
echo -e "\n${GREEN}✅ Permisos actualizados.${NC}"
cat <<'SUMMARY'

  Resumen de acceso por colección:
  ┌──────────────────────┬─────────────┬───────────────────┬─────────┐
  │ Colección            │ socio       │ gestor-material   │ admin   │
  ├──────────────────────┼─────────────┼───────────────────┼─────────┤
  │ socios               │ —           │ lectura           │ todo    │
  │ materiales_socio     │ lectura     │ lectura+escritura │ todo    │
  │ materiales_asociacion│ lectura     │ lectura+escritura │ todo    │
  │ lugares              │ lectura     │ lectura           │ todo    │
  │ eventos              │ lectura     │ lectura           │ todo    │
  │ publicaciones        │ lectura     │ lectura           │ todo    │
  └──────────────────────┴─────────────┴───────────────────┴─────────┘

SUMMARY
