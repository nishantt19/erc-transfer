import { isAddress } from "viem";
import { z } from "zod";

export const transferSchema = z.object({
  recipient: z.string().refine((val) => isAddress(val), {
    error: "Invalid Address",
  }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    error: "Please enter a valid token amount",
  }),
  tokenAddress: z.string().refine((val) => isAddress(val), {
    error: "Invalid Token Address",
  }),
});

export type TransferFormValues = z.infer<typeof transferSchema>;
