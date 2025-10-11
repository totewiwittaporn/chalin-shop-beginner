export function dashboardPathByRole(role) {
  const r = String(role || '').toUpperCase();
  switch (r) {
    case 'ADMIN':
      return '/dashboard'
    case 'STAFF':
      return '/dashboard';
    case 'CONSIGNMENT':
      return '/consignment/inventory';
    case 'QUOTE_VIEWER':
      return '/quotes';
    default:
      return '/dashboard';
  }
}
