#!/usr/bin/env bash
# =============================================================================
# Tentáculos — Actualización de permisos por rol en Appwrite
# =============================================================================
# Supuesto: gestorMaterial (y futuros gestores) también son socios.
# Por tanto no hace falta añadir su label en colecciones donde socio ya lee.
#
# Labels (solo alfanuméricos — restricción de Appwrite 1.8):
#   socio                → lee eventos, publicaciones, lugares, materiales
#   gestorMaterial       → idem + lee socios + escribe en materiales
#   gestorEventos        → idem + escribe en eventos
#   gestorPublicaciones  → idem + escribe en publicaciones
#   admin                → acceso total
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
  if out=$("$@" 2>&1); then ok "$label"
  else fail "$label"; echo -e "  ${RED}  $out${NC}"; return 1
  fi
}

# ---------------------------------------------------------------------------
# socios: NO accesible para socio normal; sí para gestorMaterial y admin
# ---------------------------------------------------------------------------
step "socios — lee: admin+gestorMaterial | escribe: admin"
run appwrite databases update-collection \
  --database-id "$DB" --collection-id socios --name "Socios" \
  --permissions \
    'read("label:admin")' \
    'read("label:gestorMaterial")' \
    'create("label:admin")' \
    'update("label:admin")' \
    'delete("label:admin")'

# ---------------------------------------------------------------------------
# materiales_socio: lee socio (cubre gestorMaterial); escribe gestorMaterial+admin
# ---------------------------------------------------------------------------
step "materiales_socio — lee: admin+socio | escribe: admin+gestorMaterial"
run appwrite databases update-collection \
  --database-id "$DB" --collection-id materiales_socio --name "Materiales de socios" \
  --permissions \
    'read("label:admin")' \
    'read("label:socio")' \
    'create("label:admin")' \
    'create("label:gestorMaterial")' \
    'update("label:admin")' \
    'update("label:gestorMaterial")' \
    'delete("label:admin")' \
    'delete("label:gestorMaterial")'

# ---------------------------------------------------------------------------
# materiales_asociacion: lee socio (cubre gestorMaterial); escribe gestorMaterial+admin
# ---------------------------------------------------------------------------
step "materiales_asociacion — lee: admin+socio | escribe: admin+gestorMaterial"
run appwrite databases update-collection \
  --database-id "$DB" --collection-id materiales_asociacion --name "Materiales de la asociación" \
  --permissions \
    'read("label:admin")' \
    'read("label:socio")' \
    'create("label:admin")' \
    'create("label:gestorMaterial")' \
    'update("label:admin")' \
    'update("label:gestorMaterial")' \
    'delete("label:admin")' \
    'delete("label:gestorMaterial")'

# ---------------------------------------------------------------------------
step "lugares — lee: admin+socio | escribe: admin"
run appwrite databases update-collection \
  --database-id "$DB" --collection-id lugares --name "Lugares" \
  --permissions \
    'read("label:admin")' \
    'read("label:socio")' \
    'create("label:admin")' \
    'update("label:admin")' \
    'delete("label:admin")'

step "eventos — lee: admin+socio | escribe: admin+gestorEventos"
run appwrite databases update-collection \
  --database-id "$DB" --collection-id eventos --name "Eventos" \
  --permissions \
    'read("label:admin")' \
    'read("label:socio")' \
    'create("label:admin")' \
    'create("label:gestorEventos")' \
    'update("label:admin")' \
    'update("label:gestorEventos")' \
    'delete("label:admin")' \
    'delete("label:gestorEventos")'

step "publicaciones — lee: admin+socio | escribe: admin+gestorPublicaciones"
run appwrite databases update-collection \
  --database-id "$DB" --collection-id publicaciones --name "Publicaciones" \
  --permissions \
    'read("label:admin")' \
    'read("label:socio")' \
    'create("label:admin")' \
    'create("label:gestorPublicaciones")' \
    'update("label:admin")' \
    'update("label:gestorPublicaciones")' \
    'delete("label:admin")' \
    'delete("label:gestorPublicaciones")'

# ---------------------------------------------------------------------------
echo -e "\n${GREEN}✅ Permisos actualizados.${NC}"
cat <<'SUMMARY'

  Tabla de acceso:
  ┌──────────────────────┬─────────┬────────────────┬──────────────────┬──────────────────────┬─────────────────┐
  │ Colección            │ socio   │ gestorMaterial │ gestorEventos    │ gestorPublicaciones  │ admin           │
  ├──────────────────────┼─────────┼────────────────┼──────────────────┼──────────────────────┼─────────────────┤
  │ socios               │ —       │ lectura        │ (via socio)      │ (via socio)          │ lectura+escrit. │
  │ materiales_socio     │ lectura │ lect.+escrit.  │ (via socio)      │ (via socio)          │ lectura+escrit. │
  │ materiales_asociacion│ lectura │ lect.+escrit.  │ (via socio)      │ (via socio)          │ lectura+escrit. │
  │ lugares              │ lectura │ (via socio)    │ (via socio)      │ (via socio)          │ lectura+escrit. │
  │ eventos              │ lectura │ (via socio)    │ lect.+escrit.    │ (via socio)          │ lectura+escrit. │
  │ publicaciones        │ lectura │ (via socio)    │ (via socio)      │ lect.+escrit.        │ lectura+escrit. │
  └──────────────────────┴─────────┴────────────────┴──────────────────┴──────────────────────┴─────────────────┘

SUMMARY
