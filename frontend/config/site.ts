export const siteConfig = {
  name: "RentSure",
  description: "Decentralized rental security deposit management platform built on Stellar Soroban.",
  links: {
    github: "https://github.com/sharma88rahul/rental-deposit-escrow",
  },
  routes: {
    landing: "/",
    dashboard: "/dashboard",
    agreements: "/agreements",
    createAgreement: "/agreements/create",
    escrowCenter: "/escrow",
    transactionCenter: "/transactions",
    activityFeed: "/activity",
    analytics: "/analytics",
    settings: "/settings",
  },
  contracts: {
    rentalAgreementId: "CCFPZOCU33AWX2NKX47XD6W5JNYFP7MU57DTQFB5XOOQSJLSSC4PMX25", // Placeholders for Phase 11
    escrowId: "CDXKQTPLDDF4RBMJCCTGV2XQ44DCJOY7XZZKPEDJFKQTECSTYHBOI42O", // Placeholders for Phase 11
    testnetRpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  }
};

export type SiteConfig = typeof siteConfig;
