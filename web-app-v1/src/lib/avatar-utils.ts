// Shared avatar utility with diverse URLs and fallback logic
// This ensures consistent avatar rendering across all components

// Array of 40 diverse avatar URLs with mixed categories: landscapes, memes, anime, objects & abstract
const avatarUrls = [
  // Landscapes & Scenery (10 avatars) 🏞️
  'https://images.pexels.com/photos/572897/pexels-photo-572897.jpeg',
  'https://images.pexels.com/photos/36717/amazing-animal-beautiful-beautifull.jpg',
  'https://images.pexels.com/photos/1528640/pexels-photo-1528640.jpeg',
  'https://images.pexels.com/photos/53594/blue-clouds-day-fluffy-53594.jpeg',
  'https://images.pexels.com/photos/210186/pexels-photo-210186.jpeg',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
  'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg',
  'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e',
  'https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg',
  
  // Memes & Funny (10 avatars) 😂
  'https://i.imgur.com/8QJgR8p.jpeg',
  'https://i.imgur.com/c4jt321.jpeg',
  'https://i.imgur.com/Vb4g41U.jpg',
  'https://i.kym-cdn.com/entries/icons/original/000/018/012/this_is_fine.jpeg',
  'https://i.kym-cdn.com/entries/icons/original/000/022/138/highresrollsafe.jpg',
  'https://i.imgflip.com/1bij.jpg',
  'https://i.kym-cdn.com/entries/icons/original/000/021/807/ig9OauB.jpg',
  'https://i.imgur.com/SSi0A3T.jpeg',
  'https://i.kym-cdn.com/photos/images/newsfeed/001/356/151/e2a.jpg',
  'https://i.imgflip.com/2/2122q9.jpg',
  
  // Animation & Anime (10 avatars) 🎬
  'https://i.pinimg.com/originals/a2/27/7b/a2277b5a2982828a2a0ff91799981831.jpg',
  'https://wallpapercave.com/wp/wp6654767.jpg',
  'https://assets.mycast.io/characters/lofi-girl-4217117-normal.jpg',
  'https://wallpapercave.com/wp/wp4989639.jpg',
  'https://i.pinimg.com/736x/54/e3/ac/54e3ac8ac526f23e1177636e0d043445.jpg',
  'https://wallpapercave.com/wp/wp8994247.jpg',
  'https://i.pinimg.com/originals/0c/33/c9/0c33c99a80393a5565157c2b04c81043.jpg',
  'https://wallpaperaccess.com/full/112513.jpg',
  'https://i.pinimg.com/736x/8e/31/3b/8e313b5a1b3c5a61e7f33917a22c4f4b.jpg',
  'https://wallpapercave.com/wp/wp2757832.jpg',
  
  // Objects & Abstract (10 avatars) 🎨
  'https://images.pexels.com/photos/3408354/pexels-photo-3408354.jpeg',
  'https://images.unsplash.com/photo-1509343256512-d77a5cb3791b',
  'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg',
  'https://images.unsplash.com/photo-1511920170033-f832d72d7d3f',
  'https://images.pexels.com/photos/1762578/pexels-photo-1762578.jpeg',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
  'https://images.pexels.com/photos/355948/pexels-photo-355948.jpeg',
  'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7',
  'https://images.pexels.com/photos/998641/pexels-photo-998641.jpeg',
  'https://images.unsplash.com/photo-1517420704952-d9f39e95b43e'
];

// Generate consistent random avatar for each identifier based on ID or name
export const getRandomAvatarUrl = (identifier: string, name?: string) => {
  // Special case: If name includes "vitalik", use real Vitalik Buterin photo
  if (name && name.toLowerCase().includes('vitalik')) {
    return 'https://metlabs.io/wp-content/uploads/2023/12/vitalik-buterin-quien-es-ethereum-fundador.jpeg';
  }
  
  // Create a simple hash from identifier for consistent selection
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get index within array bounds
  const index = Math.abs(hash) % avatarUrls.length;
  return avatarUrls[index];
};

// Get fallback avatar URL if primary fails
export const getFallbackAvatarUrl = (identifier: string, attemptNumber: number = 0) => {
  // Create a different hash by adding attempt number to ensure different result
  let hash = attemptNumber;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char + attemptNumber;
    hash = hash & hash;
  }
  
  const index = Math.abs(hash) % avatarUrls.length;
  return avatarUrls[index];
};

// Get current avatar URL considering any failures
export const getCurrentAvatarUrl = (
  identifier: string, 
  name?: string, 
  failureCount: number = 0
) => {
  if (failureCount === 0) {
    return getRandomAvatarUrl(identifier, name);
  } else {
    return getFallbackAvatarUrl(identifier, failureCount);
  }
};

// Legacy fallback for components that need simple generated avatars
export const generateAvatarUrl = (name: string, size: number = 100) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=${size}&font-size=0.4&bold=true`;
};
