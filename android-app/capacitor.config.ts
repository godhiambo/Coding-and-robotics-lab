import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.milestoneminds.roboticslab',
  appName: 'Robotics Lab',
  webDir: '../site', // the web app built by ../build.py
  backgroundColor: '#0b1322',
  android: { allowMixedContent: false },
  server: { androidScheme: 'https' }
};

export default config;
