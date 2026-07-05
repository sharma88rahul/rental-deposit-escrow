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
    rentalAgreementId: process.env.NEXT_PUBLIC_RENTAL_AGREEMENT_ID || "CCFPZOCU33AWX2NKX47XD6W5JNYFP7MU57DTQFB5XOOQSJLSSC4PMX25",
    escrowId: process.env.NEXT_PUBLIC_ESCROW_ID || "CDXKQTPLDDF4RBMJCCTGV2XQ44DCJOY7XZZKPEDJFKQTECSTYHBOI42O",
    testnetRpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
    networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK === "public"
      ? "Public Global Stellar Network ; October 2015"
      : "Test SDF Network ; September 2015",
  }
};

export type SiteConfig = typeof siteConfig;
