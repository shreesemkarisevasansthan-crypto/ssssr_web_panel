import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Cookie se locale read karo
  const cookieStore = await cookies();
  let locale = cookieStore.get('NEXT_LOCALE')?.value;
  
  // Agar cookie nahi hai toh browser language detect karo
  if (!locale) {
    locale = 'en'; // default
  }
  
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});