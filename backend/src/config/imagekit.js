import ImageKit from 'imagekit';
import env from './env.js';

let imagekitInstance = null;

export const getImageKit = () => {
  if (imagekitInstance) return imagekitInstance;

  const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = env;

  if (
    !IMAGEKIT_PUBLIC_KEY ||
    !IMAGEKIT_PRIVATE_KEY ||
    !IMAGEKIT_URL_ENDPOINT ||
    IMAGEKIT_PRIVATE_KEY.includes('<')
  ) {
    return null;
  }

  imagekitInstance = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    privateKey: IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
  });

  return imagekitInstance;
};

export default getImageKit;
