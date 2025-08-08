import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'pt'];
export const defaultLocale = 'pt';

export default getRequestConfig(async ({ locale }) => {
  // Adicionado para depuração

  if (!locales.includes(locale as any)) {
    console.log(`[i18n] Locale "${locale}" não é válido. Chamando notFound().`);
    notFound();
  }

  try {
    // Caminho corrigido para ./messages
    const messages = (await import(`./messages/${locale}.json`)).default;
    return { messages };
  } catch (error) {
    throw new Error(`Could not load messages for locale ${locale}`);
  }
});
