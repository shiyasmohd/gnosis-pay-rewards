const APP_NAME = 'KPK';
const separator = '/';
/**
 * Get page title by name
 * @param name - page name
 * @returns page title
 */
export function getPageTitle(name?: string): string {
  if (name) {
    return `${name.trim()} ${separator} ${APP_NAME}`;
  }
  return `${APP_NAME}`;
}
