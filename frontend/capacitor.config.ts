import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.scriptforge.ai",
  appName: "ScriptForge AI",
  webDir: "dist",

  // Server config for live-reload during native dev (comment out for production builds)
  // server: {
  //   url: "http://YOUR_DEV_MACHINE_IP:5173",
  //   cleartext: true,
  // },

  ios: {
    contentInset: "automatic",
    backgroundColor: "#0a0a0a",
  },

  android: {
    backgroundColor: "#0a0a0a",
    allowMixedContent: true,  // needed for http:// API calls on Android
    captureInput: true,
  },

  plugins: {
    // CapacitorHttp replaces fetch/XHR on native so requests bypass CORS
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
