# Frontend - App de Subastas (entrega 2)

App movil en **Expo (React Native)**. Implementa el circuito completo de pujas
integrado con el backend.

## Requisitos
- Node.js 18+
- App **Expo Go** en el celular (o un emulador Android/iOS)

## Pasos

1. Instalar dependencias:
   ```bash
   cd frontend
   npm install
   ```

2. **Configurar la URL del backend** en `src/config.js` (`BASE_URL`):
   - Emulador Android: `http://10.0.2.2:8080`
   - Emulador iOS: `http://localhost:8080`
   - Celular fisico (Expo Go): `http://<IP-DE-TU-PC>:8080` (misma red Wi-Fi)

3. Levantar:
   ```bash
   npx expo start
   ```
   Escanea el QR con Expo Go, o presiona `a` (Android) / `i` (iOS).

> El backend tiene que estar corriendo (ver `../backend/README.md`).

## Estructura
```
App.js                  navegacion + flujo segun auth
src/config.js           BASE_URL y intervalo de polling
src/theme.js            paleta de colores
src/api/client.js       axios + interceptores + normalizacion de errores
src/api/endpoints.js    llamados a la API (auth, subastas, cliente)
src/context/AuthContext.js   login/logout + persistencia del token
src/components/         Button, Loading, ErrorView, TextField
src/screens/            Splash, Login, SubastasList, SubastaDetail, ItemDetail
```