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
    // These fallback IDs match frontend/.env.local — the initialized Testnet contracts.
    rentalAgreementId: process.env.NEXT_PUBLIC_RENTAL_AGREEMENT_ID || "CC32FLXF5AQUBFRFRQBBUAXUDFXUSQIQ6DFCK6OOUTQXDTLANUKI5OOE",
    escrowId: process.env.NEXT_PUBLIC_ESCROW_ID || "CANVAZCSTN7MSQKSAKUNAHM6NGVRSN76ZWHUYL2ZY6BBS4IMA6FF4T3N",
    testnetRpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org",
    networkPassphrase: process.env.NEXT_PUBLIC_STELLAR_NETWORK === "public"
      ? "Public Global Stellar Network ; October 2015"
      : "Test SDF Network ; September 2015",
    // Stellar Asset Contracts (SAC) on Testnet.
    // XLM native SAC — the wrapped XLM token usable in Soroban contracts.
    xlmSacId: process.env.NEXT_PUBLIC_XLM_SAC_ID || "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
    // USDC SAC on Testnet (Circle USDC bridged via Stellar Lab)
    usdcSacId: process.env.NEXT_PUBLIC_USDC_SAC_ID || "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  }
};

export type SiteConfig = typeof siteConfig;
