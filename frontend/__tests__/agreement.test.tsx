import { createAgreementSchema } from "../utils/validation";
import { AgreementService } from "../services/agreement";
import { useStore } from "../store/useStore";
import { useAgreementStore } from "../store/useAgreementStore";
import { useWalletStore } from "../store/useWalletStore";

describe("Rental Agreement Zod Validation & Service Tests", () => {
  beforeEach(() => {
    // Seed wallet state
    useWalletStore.setState({
      connected: true,
      walletAddress: "GD7K5R5P2H3C4V5B6N7M8Q9W0E1R2T3Y4U5I6O7P8A9S0D1F2G3H4J5K",
      activeWallet: "freighter",
    });

    // Reset Zustand data store
    useStore.setState({
      agreements: [
        {
          id: 1042,
          title: "Vanguard Heights - Apt 402",
          propertyAddress: "742 Evergreen Terrace, Springfield",
          landlord: "GD7K5R5P...LAND",
          tenant: "GBTR5R5P...TENA",
          token: "USDC (CCFP...MX25)",
          depositAmount: "1200",
          duration: 31536000,
          status: "LeaseActive",
          metadataHash: "QmXoypizjW3Wkn2EncgV51B3BJKNpd84mCndH39E7uJ8T5",
          refundRequestedAmount: "0",
          createdAt: "2026-06-15T12:00:00Z",
        },
      ],
    });
    // Reset filters
    useAgreementStore.getState().resetFilters();
  });

  describe("Form Schema Validation", () => {
    it("should validate a correct agreement input successfully", () => {
      const validData = {
        title: "Sunset Boulevard Loft",
        propertyAddress: "1204 Sunset Blvd, Los Angeles, CA",
        tenant: "GBTR5R5P5TNA2R5P5TNA2R5P5TNA2R5P5TNA2R5P5TNA2R5P5TNA2R5P", // 56 char Stellar Address
        depositAmount: "1500",
        leaseStartDate: "2026-08-01",
        leaseEndDate: "2027-08-01",
      };

      const result = createAgreementSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should fail validation with an invalid Stellar tenant wallet address", () => {
      const invalidData = {
        title: "Sunset Boulevard Loft",
        propertyAddress: "1204 Sunset Blvd, Los Angeles, CA",
        tenant: "invalid-stellar-address",
        depositAmount: "1500",
        leaseStartDate: "2026-08-01",
        leaseEndDate: "2027-08-01",
      };

      const result = createAgreementSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid Stellar G... address format.");
      }
    });

    it("should fail validation when end date is prior to start date", () => {
      const invalidData = {
        title: "Sunset Boulevard Loft",
        propertyAddress: "1204 Sunset Blvd, Los Angeles, CA",
        tenant: "GBTR5R5P5TNA2R5P5TNA2R5P5TNA2R5P5TNA2R5P5TNA2R5P5TNA2R5P",
        depositAmount: "1500",
        leaseStartDate: "2026-08-01",
        leaseEndDate: "2026-07-01",
      };

      const result = createAgreementSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Lease End Date must be after Lease Start Date.");
      }
    });
  });

  describe("Agreement Service & Store Integration", () => {
    it("should simulate agreement creation and append to store list", async () => {
      const tenantAddr = "GBTR5R5P5TNA2R5P5TNA2R5P5TNA2R5P5TNA2R5P5TNA2R5P5TNA2R5P";
      const newId = await AgreementService.createAgreement({
        title: "Oakridge Penthouse",
        propertyAddress: "542 Oakridge Blvd, Portland",
        tenant: tenantAddr,
        token: "USDC",
        depositAmount: "2500",
        duration: 31536000,
        metadataHash: "QmMetadataHashString123",
      });

      expect(newId).toBeGreaterThan(0);
      const agreements = useStore.getState().agreements;
      expect(agreements.length).toBe(2);
      expect(agreements[0].title).toBe("Oakridge Penthouse");
    });

    it("should edit a draft agreement before acceptance", async () => {
      // Mock existing Created agreement
      const agreements = useStore.getState().agreements;
      agreements[0].status = "Created";

      await AgreementService.editAgreementDraft(1042, {
        title: "New Townhouse",
        propertyAddress: "100 New Street",
        depositAmount: "1350",
      });

      const updated = useStore.getState().agreements.find((a) => a.id === 1042);
      expect(updated?.title).toBe("New Townhouse");
      expect(updated?.depositAmount).toBe("1350");
    });

    it("should fail editing draft agreements that are already accepted or active", async () => {
      // Set status to LeaseActive
      useStore.getState().updateAgreementStatus(1042, "LeaseActive");

      await expect(
        AgreementService.editAgreementDraft(1042, {
          title: "Failed Edit",
          propertyAddress: "100 New Street",
          depositAmount: "1350",
        })
      ).rejects.toThrow("Cannot edit agreement after tenant acceptance.");
    });
  });

  describe("Agreement Filtering & Search Selectors", () => {
    it("should apply search queries to agreement lists", () => {
      const store = useAgreementStore.getState();
      expect(store.filters.search).toBe("");

      store.setFilters({ search: "Vanguard" });
      expect(useAgreementStore.getState().filters.search).toBe("Vanguard");
    });

    it("should apply status filters to agreement lists", () => {
      const store = useAgreementStore.getState();
      expect(store.filters.status).toBe("All");

      store.setFilters({ status: "LeaseActive" });
      expect(useAgreementStore.getState().filters.status).toBe("LeaseActive");
    });
  });
});
