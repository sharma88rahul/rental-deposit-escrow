import { z } from "zod";

// Stellar Wallet Address regex: G followed by 55 alphanumeric characters
export const STELLAR_ADDRESS_REGEX = /^G[A-D2-7][A-Z2-7]{54}$/;

export const createAgreementSchema = z
  .object({
    title: z
      .string()
      .min(3, "Agreement Title must be at least 3 characters.")
      .max(50, "Agreement Title must not exceed 50 characters."),
    propertyAddress: z
      .string()
      .min(5, "Property Address must be at least 5 characters.")
      .max(100, "Property Address must not exceed 100 characters."),
    tenant: z
      .string()
      .regex(STELLAR_ADDRESS_REGEX, "Invalid Stellar G... address format."),
    depositAmount: z
      .string()
      .refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      }, "Deposit amount must be a positive number greater than zero."),
    durationMonths: z.string().optional(),
    description: z
      .string()
      .max(500, "Notes must not exceed 500 characters.")
      .optional(),
    leaseStartDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Please select a valid start date.",
    }),
    leaseEndDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Please select a valid end date.",
    }),
  })
  .refine(
    (data) => {
      const start = new Date(data.leaseStartDate);
      const end = new Date(data.leaseEndDate);
      return end > start;
    },
    {
      message: "Lease End Date must be after Lease Start Date.",
      path: ["leaseEndDate"],
    }
  );

export type CreateAgreementInput = z.infer<typeof createAgreementSchema>;

export const editAgreementSchema = z.object({
  title: z
    .string()
    .min(3, "Agreement Title must be at least 3 characters.")
    .max(50, "Agreement Title must not exceed 50 characters."),
  propertyAddress: z
    .string()
    .min(5, "Property Address must be at least 5 characters.")
    .max(100, "Property Address must not exceed 100 characters."),
  depositAmount: z
    .string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Deposit amount must be a positive number greater than zero."),
});

export type EditAgreementInput = z.infer<typeof editAgreementSchema>;

export const proposeRefundSchema = z.object({
  refundAmount: z
    .string()
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, "Refund split amount must be a positive number or zero."),
});

export type ProposeRefundInput = z.infer<typeof proposeRefundSchema>;
