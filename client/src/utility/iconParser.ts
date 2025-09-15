/**
 * Parse Material Desgin icon name to be used with mdi/js
 * @param mdiName Dash separated icon name from MDI, e.g. alert-box-outline
 * @returns Parsed icon name to be used with mdi/js, e.g mdiAlertBoxOutline
 */
export const iconParser = (mdiName: string): string => {
  if (!mdiName || mdiName.includes('.') || mdiName.startsWith('mdi')) {
    return mdiName;
  }

  let parsedName = mdiName
    .split('-')
    .map((word: string) => `${word[0].toUpperCase()}${word.slice(1)}`)
    .join('');
  parsedName = `mdi${parsedName}`;

  return parsedName;
}

/**
 * Takes a technical MDI name and converts it back to its display slug.
 * @param technicalName The technical name, e.g., mdiAccountCashOutline
 * @returns The display slug, e.g., account-cash-outline
 */
export const parseMdiName = (technicalName: string): string => {
  // If it's not a technical name (or is a URL), return it as is.
  if (!technicalName || !technicalName.startsWith('mdi')) {
    return technicalName;
  }

  const name = technicalName.substring(3);
  const slug = name.replace(/(?<!^)([A-Z])/g, '-$1').toLowerCase();

  return slug;
};
