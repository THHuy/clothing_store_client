import { SERVER_BASE_URL } from '../services/api';

/**
 * Utility function to get the full image URL
 * @param imagePath - The image path from the API (could be relative or absolute)
 * @returns Full image URL
 */
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) {
    return 'https://via.placeholder.com/300x400?text=No+Image';
  }
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // If it's a relative path, prepend the server base URL
  const fullUrl = `${SERVER_BASE_URL}${imagePath}`;
  return fullUrl;
};

/**
 * Get the first image from an array of image paths
 * @param images - Array of image paths
 * @returns Full URL of the first image or placeholder
 */
export const getFirstImageUrl = (images?: string[]): string => {
  if (!images || images.length === 0) {
    return 'https://via.placeholder.com/300x400?text=No+Image';
  }
  
  return getImageUrl(images[0]);
};

/**
 * Handle image load error by setting a fallback image
 * @param event - Image error event
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const img = event.target as HTMLImageElement;
  img.src = 'https://via.placeholder.com/300x400?text=No+Image';
};
