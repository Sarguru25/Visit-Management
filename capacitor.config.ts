import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.visit.management',
  appName: 'Visit Management',
  webDir: 'out',
  server: {
    url: 'https://visit-management-beige.vercel.app',
    cleartext: false,
  },
};

export default config;