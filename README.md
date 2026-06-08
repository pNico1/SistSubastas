## Estructura

```
entrega2/
├── database/   01_schema.sql · 02_seed.sql · 03_CAMBIOS.md
├── backend/    API REST Spring Boot (Maven)
├── frontend/   App movil Expo
└── docs/       MANEJO_DE_ERRORES.md
```

## Cómo correr todo (de cero)

1. **Base de datos** (MySQL 8):
   ```bash
   mysql -u root -p < database/01_schema.sql ¡¡DROPEA EL SCHEMA "subastas" AUTOMATICAMENTE!!
   mysql -u root -p subastas < database/02_seed.sql
   ```
2. **Backend** (JDK 17 + Maven):
   ```bash
   cd backend
   export DB_USER=root DB_PASS=tu_pass JWT_SECRET=clave-secreta-de-32-bytes-min
   correr main/java/com/subastas/api SubastasApiApplication    # http://localhost:8080
   ```
3. **Frontend** (Node 18 + Expo Go):
   ```bash
   cd frontend
   npm install
   # editar src/config.js -> BASE_URL segun emulador/celular
   npx expo start
   ```
4. Login con `juan@email.com` (o `admin@subastas.com` para admin) / `Password123!` 

Mas info en frontend/readme.md o backend/readme.md
