import { useAnalyticsStore } from "../store/useAnalyticsStore";
import { useSettingsStore } from "../store/useSettingsStore";

describe("Analytics & User Settings Module Tests", () => {
  beforeEach(() => {
    // Reset stores
    useAnalyticsStore.getState().resetFilters();
    useSettingsStore.setState({
      theme: "dark",
      profile: {
        username: "Escrow Tenant",
        email: "tenant@rentsure.io",
        language: "en",
      },
    });
  });

  describe("Zustand Settings Preferences", () => {
    it("should toggle notifications configuration", () => {
      const store = useSettingsStore.getState();
      expect(store.notifications.systemAlerts).toBe(false);

      store.setNotifications({ systemAlerts: true });
      expect(useSettingsStore.getState().notifications.systemAlerts).toBe(true);
    });

    it("should set profile customization details", () => {
      const store = useSettingsStore.getState();
      expect(store.profile.username).toBe("Escrow Tenant");

      store.setProfile({ username: "Escrow Landlord" });
      expect(useSettingsStore.getState().profile.username).toBe("Escrow Landlord");
    });

    it("should persist and update theme selection properties", () => {
      const store = useSettingsStore.getState();
      expect(store.theme).toBe("dark");

      store.setTheme("light");
      expect(useSettingsStore.getState().theme).toBe("light");
    });
  });

  describe("Analytics Export Utilities", () => {
    it("should export dashboard structures as JSON and CSV triggers", () => {
      // Mocking DOM element anchor clicks
      const mockElement = {
        setAttribute: jest.fn(),
        click: jest.fn(),
      };
      
      const docSpy = jest
        .spyOn(document, "createElement")
        .mockReturnValue(mockElement as unknown as HTMLAnchorElement);
      
      const bodySpyAppend = jest
        .spyOn(document.body, "appendChild")
        .mockImplementation((node) => node);
      
      const bodySpyRemove = jest
        .spyOn(document.body, "removeChild")
        .mockImplementation((node) => node);

      const store = useAnalyticsStore.getState();
      
      // JSON Export Check
      store.exportToJSON({ test: "val" }, "rentsure-test-report");
      expect(docSpy).toHaveBeenCalledWith("a");
      expect(mockElement.setAttribute).toHaveBeenCalledWith(
        "download",
        "rentsure-test-report.json"
      );

      // CSV Export Check
      store.exportToCSV([{ hash: "0x12", fee: "0.1" }], "rentsure-csv-report");
      expect(mockElement.setAttribute).toHaveBeenCalledWith(
        "download",
        "rentsure-csv-report.csv"
      );

      docSpy.mockRestore();
      bodySpyAppend.mockRestore();
      bodySpyRemove.mockRestore();
    });
  });
});
