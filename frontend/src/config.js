// Configuracion de la app.
//
// IMPORTANTE - BASE_URL segun donde corras la app:
//   - Emulador Android (Android Studio):  http://10.0.2.2:8080
//   - Emulador iOS:                        http://localhost:8080
//   - Celular fisico con Expo Go:          http://<IP-DE-TU-PC>:8080
//        (ej: http://192.168.0.43:8080 ; tu PC y el celu en la misma red Wi-Fi)
//
// Cambia esta constante segun tu caso.
//export const BASE_URL = 'http://localhost:8080';
export const BASE_URL = 'http://192.168.0.199:8080';
// Cada cuantos ms se refresca la oferta actual en la pantalla de puja (tiempo real por polling).
export const POLLING_MS = 3000;
