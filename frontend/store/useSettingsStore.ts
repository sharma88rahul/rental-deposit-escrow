import { create } from "zustand";
import { persist } from "zustand/middleware";
import { siteConfig } from "@/config/site";

export interface DeveloperSettings {
  rpcEndpoint: string;
  rentalAgreementId: string;
  escrowId: string;
  networkPassphrase: string;
  enableDebugLogs: boolean;
  bypassSimulations: boolean;
}

export interface NotificationSettings {
  agreementUpdates: boolean;
  escrowUpdates: boolean;
  transactions: boolean;
  disputes: boolean;
  systemAlerts: boolean;
}

interface SettingsState {
  // Theme settings
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Notification Preferences
  notifications: NotificationSettings;
  setNotifications: (notifications: Partial<NotificationSettings>) => void;

  // Developer Settings
  developerSettings: DeveloperSettings;
  setDeveloperSettings: (developerSettings: Partial<DeveloperSettings>) => void;

  // Profile Preferences
  profile: {
    username: string;
    email: string;
    language: string;
  };
  setProfile: (profile: Partial<{ username: string; email: string; language: string }>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Theme defaults
      theme: "dark",
      setTheme: (theme) => set({ theme }),

      // Notification defaults
      notifications: {
        agreementUpdates: true,
        escrowUpdates: true,
        transactions: true,
        disputes: true,
        systemAlerts: false,
      },
      setNotifications: (updated) =>
        set((state) => ({
          notifications: { ...state.notifications, ...updated },
        })),

      // Developer settings defaults
      developerSettings: {
        rpcEndpoint: siteConfig.contracts.testnetRpcUrl,
        rentalAgreementId: siteConfig.contracts.rentalAgreementId,
        escrowId: siteConfig.contracts.escrowId,
        networkPassphrase: siteConfig.contracts.networkPassphrase,
        enableDebugLogs: false,
        bypassSimulations: false,
      },
      setDeveloperSettings: (updated) =>
        set((state) => ({
          developerSettings: { ...state.developerSettings, ...updated },
        })),

      // Profile defaults
      profile: {
        username: "Escrow Tenant",
        email: "tenant@rentsure.io",
        language: "en",
      },
      setProfile: (updated) =>
        set((state) => ({
          profile: { ...state.profile, ...updated },
        })),
    }),
    {
      name: "rentsure-settings-store", // Persisted in local storage
    }
  )
);
