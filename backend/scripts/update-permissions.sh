#!/usr/bin/env bash
# =============================================================================
# Tentáculos — Actualización de permisos por rol en Appwrite
# =============================================================================
# Labels usados (solo alfanuméricos — restricción de Appwrite 1.8):
#   socio          → lee eventos, publicaciones, lugares, materiales
#   gestorMaterial → idem + lee socios + escribe materiales
#   admin          → lectura y escritura total
#
# Uso: bash backend/scripts/update-permissions.sh
# =============================================================================

set -euo pipefail

DB="tentaculos"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $*"; }
fail() { echo -e "  ${RED}✗${NC} $*"; }
step() { echo -e "\n${YELLOW}▶ $1${NC}"; }

run() {
  local label="${*: -1}"
  local out
  if out=$("$@" 2>&1); then
    ok "$label"
  else
    fail "$label"; echo -e "  ${RED}  $out${NC}"; return 1
  fi
}

# ---------------------------------------------------------------------------
# Grupos de permisos reutilizables
# ---------------------------------------------------------------------------

# Solo admin puede leer y escribir
ONLY_ADMIN=(
  'read("label:admin")'
  'create("label:admin")'
  'update("label:admin")'
  'delete("label:admin")'
)

# admin + gestorMaterial leen; solo admin escribe
GESTOR_READ_ADMIN_WRITE=(
  'read("label:admin")'
  'read("label:gestorMaterial")'
  'create("label:admin")'
  'update("label:admin")'
  'delete("label:admin")'
)

# admin + gestorMaterial + socio leen; solo admin escribe
ALL_READ_ADMIN_WRITE=(
  'read("label:admin")'
  'read("label:gestorMaterial")'
  'read("label:socio")'
  'create("label:admin")'
  'update("label:admin")'
  'delete("label:admin")'
)

# admin + gestorMaterial leen y escriben; socio solo lee
ALL_READ_GESTOR_WRITE=(
  'read("label:admin")'
  'read("label:gestorMaterial")'
  'read("label:socio")'
  'create("label:admin")'
  'create("label:gestorMaterial")'
  'update("label:admin")'
  'update("label:gestorMaterial")'
  'delete("label:admin")'
  'delete("label:gestorMaterial")'
)

# ---------------------------------------------------------------------------
step "socios — lee: admin+gestorMaterial | escribe: admin"
run appwrite databases update-collection \
  --database-id "$DB" --collection-id socios --name "Socios" \
  --permissions "${GESTOR_READ_ADMIN_WRITE[@]}"

step "materiales_socio — lee: admin+gestorMaterial+socio | escribe: admin+gestorMaterial"
run appwrite databases update-collection \
  --database-id "$DB" --collection-id materiales_socio --name "Materiales de socios" \
  --permissions "${ALL_READ_GESTOR_WRITE[@]}"

step "materiales_asociacion — lee: admin+gestorMaterial+socio | escribe: admin+gestorMaterial"
run appwrite databases update-collection \
  --database-id "$DB" --collection-id materiales_asociacion --name "Materiales de la asociación" \
  --permissions "${ALL_READ_GESTOR_WRITE[@]}"

step "lugares — lee: admin+gestorMaterial+socio | escribe: admin"
run appwrite databases update-collection \
  --database-id "$DB" --collection-id lugares --name "Lugares" \
  --permissions "${ALL_READ_ADMIN_WRITE[@]}"

step "eventos — lee: admin+gestorMaterial+socio | escribe: admin"
run appwrite databases update-collection \
  --database-id "$DB" --collection-id eventos --name "Eventos" \
  --permissions "${ALL_READ_ADMIN_WRITE[@]}"

step "publicaciones — lee: admin+gestorMaterial+socio | escribe: admin"
run appwrite databases update-collection \
  --database-id "$DB" --collection-id publicaciones --name "Publicaciones" \
  --permissions "${ALL_READ_ADMIN_WRITE[@]}"

# ---------------------------------------------------------------------------
echo -e "\n${GREEN}✅ Permisos actualizados.${NC}"
cat <<'SUMMARY'

  Labels válidos para asignar en Appwrite → Auth → Users → Labels:
    socio           → acceso lectura a eventos, publicaciones, materiales, lugares
    gestorMaterial  → idem + lectura socios + escritura en materiales
    admin           → acceso total (lectura + escritura en todo)

SUMMARY
