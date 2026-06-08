const DEFAULT_RETURN_ROUTE = 'Bidster';
const SAFE_RETURN_ROUTES = new Set(['Bidster', 'Pujas', 'Subastas']);

export function currentRouteName(navigation) {
  const state = navigation?.getState?.();
  const index = typeof state?.index === 'number' ? state.index : 0;
  return state?.routes?.[index]?.name;
}

export function safeReturnRoute(navigation, fallback = DEFAULT_RETURN_ROUTE) {
  const routeName = currentRouteName(navigation);
  return SAFE_RETURN_ROUTES.has(routeName) ? routeName : fallback;
}

export function navigateWithReturnTo(navigation, routeName, params = {}) {
  const nextParams = {
    ...params,
    returnTo: params.returnTo || safeReturnRoute(navigation),
  };

  if (typeof navigation?.push === 'function') {
    navigation.push(routeName, nextParams);
    return;
  }

  navigation?.navigate?.(routeName, nextParams);
}

export function goBackOrReturnTo(navigation, route, fallback = DEFAULT_RETURN_ROUTE) {
  const returnTo = route?.params?.returnTo;

  if (SAFE_RETURN_ROUTES.has(returnTo)) {
    navigation?.navigate?.(returnTo);
    return;
  }

  if (navigation?.canGoBack?.()) {
    navigation.goBack();
    return;
  }

  navigation?.navigate?.(fallback);
}
