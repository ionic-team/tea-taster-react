import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.teataster.react',
  appName: 'Tea Taster Two!',
  //"npmClient": "npm",
  webDir: 'build',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
};

export default config;
