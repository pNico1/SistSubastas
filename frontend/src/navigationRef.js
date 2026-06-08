import { createNavigationContainerRef } from '@react-navigation/native';

// Ref global del navigator para poder navegar desde fuera de los componentes
// (por ejemplo, cuando el backend responde 401 y hay que mandar a Login).
export const navigationRef = createNavigationContainerRef();

export function resetToLogin() {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Login');
  }
}
