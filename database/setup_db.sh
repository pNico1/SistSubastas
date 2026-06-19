#!/bin/bash
# ============================================================================
#  Setup de la base de datos del Sistema de Subastas (correr DENTRO del
#  contenedor donde esta MySQL/MariaDB).
#
#  Hace:
#    1. Carga el esquema (01_schema.sql) -> crea/recrea la base 'subastas'.
#    2. Carga los datos de prueba (02_seed.sql).
#    3. Crea el usuario remoto para que el backend se conecte por red.
#    4. Verifica que cargo.
#
#  Uso:
#    chmod +x setup_db.sh
#    ./setup_db.sh 'PASSWORD_PARA_EL_USUARIO_SUBASTAS'
#
#  Tiene que estar en la misma carpeta que 01_schema.sql y 02_seed.sql.
# ============================================================================
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
APP_PASS="${1:-subastas123}"   # password del usuario 'subastas' (pasala como argumento)

# Detecta el comando del cliente (mysql o mariadb)
if command -v mysql >/dev/null 2>&1; then
  CLI="mysql"
elif command -v mariadb >/dev/null 2>&1; then
  CLI="mariadb"
else
  echo "ERROR: no encontre el cliente mysql/mariadb en este contenedor." >&2
  exit 1
fi

# Si root necesita sudo (auth por socket), lo usamos automaticamente
if [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
  CLI="sudo $CLI"
fi

echo ">> 1/4 Cargando esquema..."
$CLI < "$DIR/01_schema.sql"

echo ">> 2/4 Cargando datos de prueba..."
$CLI subastas < "$DIR/02_seed.sql"

echo ">> 3/4 Creando usuario remoto 'subastas'@'%'..."
$CLI <<SQL
CREATE USER IF NOT EXISTS 'subastas'@'%' IDENTIFIED BY '${APP_PASS}';
GRANT ALL PRIVILEGES ON subastas.* TO 'subastas'@'%';
FLUSH PRIVILEGES;
SQL

echo ">> 4/4 Verificando..."
TABLAS=$($CLI -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='subastas';")
USUARIOS=$($CLI -N -e "SELECT GROUP_CONCAT(email SEPARATOR ', ') FROM subastas.usuarios;")
echo "   Tablas creadas: $TABLAS (esperado: 32)"
echo "   Usuarios demo : $USUARIOS"
echo ""
echo "LISTO. El backend se conecta con:"
echo "   host = <IP-del-contenedor>   puerto = 3306"
echo "   usuario = subastas           password = ${APP_PASS}"
echo ""
echo "Recorda: MySQL tiene que escuchar en la red (bind-address = 0.0.0.0) y"
echo "abrir el puerto 3306 en el firewall del contenedor si tiene ufw."
