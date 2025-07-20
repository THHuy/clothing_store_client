/**
 * Utility functions for authentication management
 */

export const getTokenExpirationInfo = (): {
  isValid: boolean;
  expiresAt: Date | null;
  timeLeft: string | null;
} => {
  const authData = localStorage.getItem('auth');
  
  if (!authData) {
    return { isValid: false, expiresAt: null, timeLeft: null };
  }

  try {
    const { tokenExpiration } = JSON.parse(authData);
    
    if (!tokenExpiration) {
      return { isValid: false, expiresAt: null, timeLeft: null };
    }

    const now = Date.now();
    const expiresAt = new Date(tokenExpiration);
    const isValid = now < tokenExpiration;
    
    if (!isValid) {
      return { isValid: false, expiresAt, timeLeft: null };
    }

    // Calculate time left
    const timeLeftMs = tokenExpiration - now;
    const days = Math.floor(timeLeftMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeLeftMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeftMs % (60 * 60 * 1000)) / (60 * 1000));

    let timeLeft = '';
    if (days > 0) {
      timeLeft = `${days} ngày ${hours} giờ`;
    } else if (hours > 0) {
      timeLeft = `${hours} giờ ${minutes} phút`;
    } else {
      timeLeft = `${minutes} phút`;
    }

    return { isValid, expiresAt, timeLeft };
  } catch (error) {
    console.error('Error parsing auth data:', error);
    return { isValid: false, expiresAt: null, timeLeft: null };
  }
};

export const formatExpirationDate = (date: Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export const shouldShowExpirationWarning = (): boolean => {
  const { isValid, timeLeft } = getTokenExpirationInfo();
  
  if (!isValid || !timeLeft) return false;
  
  // Show warning if less than 1 day left
  const authData = localStorage.getItem('auth');
  if (!authData) return false;
  
  try {
    const { tokenExpiration } = JSON.parse(authData);
    const timeLeftMs = tokenExpiration - Date.now();
    const hoursLeft = timeLeftMs / (60 * 60 * 1000);
    
    return hoursLeft < 24; // Less than 24 hours left
  } catch {
    return false;
  }
};
