import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.maxisoft.concept',
  appName: 'Concept Cards',
  webDir: 'dist/web/browser',
  server: {
    androidScheme: 'https',
    hostname: 'localhost'
  }
};

export default config;
