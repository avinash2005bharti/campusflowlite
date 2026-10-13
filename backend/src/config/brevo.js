import { BrevoClient } from '@getbrevo/brevo';
import dotenv from 'dotenv';

dotenv.config();

let brevoClient = null;

export const getBrevoClient = () => {
  if (brevoClient) return brevoClient;

  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey || apiKey.includes('<') || apiKey.trim() === '') {
    return null;
  }

  brevoClient = new BrevoClient({ apiKey: apiKey.trim() });
  return brevoClient;
};

export default getBrevoClient;
