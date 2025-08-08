// Utility to clear old NextAuth cookies for migration to Supabase
export const clearOldNextAuthCookies = () => {
  if (typeof window !== 'undefined') {
    console.log('Starting to clear NextAuth cookies...');
    
    // Get all existing cookies first
    const existingCookies = document.cookie.split(';').map(c => c.trim());
    console.log('Existing cookies:', existingCookies);
    
    // Clear all NextAuth cookies with various approaches
    const nextAuthCookies = [
      'next-auth.session-token',
      'next-auth.csrf-token', 
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.csrf-token',
      '__Secure-next-auth.callback-url'
    ];
    
    nextAuthCookies.forEach(cookieName => {
      // Multiple clearing strategies
      const clearingStrategies = [
        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,
        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`,
        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;`,
        `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=;`,
        `${cookieName}=; max-age=0; path=/;`,
        `${cookieName}=; max-age=0; path=/; domain=localhost;`
      ];
      
      clearingStrategies.forEach(strategy => {
        document.cookie = strategy;
      });
    });
    
    // Also clear any cookies that contain "next-auth" in their name
    existingCookies.forEach(cookie => {
      const cookieName = cookie.split('=')[0];
      if (cookieName.includes('next-auth')) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${cookieName}=; max-age=0; path=/;`;
      }
    });
    
    console.log('Finished clearing NextAuth cookies');
    
    // Check what cookies remain
    setTimeout(() => {
      const remainingCookies = document.cookie.split(';').map(c => c.trim());
      console.log('Remaining cookies after clearing:', remainingCookies);
    }, 100);
  }
};

// Force clear cookies and reload page
export const forceClearCookiesAndReload = () => {
  if (typeof window !== 'undefined') {
    clearOldNextAuthCookies();
    // Force a hard reload to ensure cookies are cleared
    setTimeout(() => {
      window.location.reload();
    }, 200);
  }
};
