import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EscrowService } from "@/services/escrow";
import { EscrowDetails } from "@/store/useEscrowStore";

export function useEscrow() {
  const queryClient = useQueryClient();

  // Load all escrows query with 5s polling interval
  const escrowsQuery = useQuery({
    queryKey: ["escrows"],
    queryFn: () => EscrowService.fetchEscrows(),
    refetchInterval: 5000, // 5s status auto-polling
  });

  // Lock deposit mutation
  const lockDepositMutation = useMutation({
    mutationFn: (agreementId: number) => EscrowService.lockDeposit(agreementId),
    onSuccess: (_, agreementId) => {
      queryClient.invalidateQueries({ queryKey: ["escrows"] });
      queryClient.invalidateQueries({ queryKey: ["agreement-details", agreementId] });
      queryClient.invalidateQueries({ queryKey: ["agreements"] });
    },
  });

  // Release deposit fully mutation
  const releaseDepositFullyMutation = useMutation({
    mutationFn: (agreementId: number) => EscrowService.releaseDepositFully(agreementId),
    onSuccess: (_, agreementId) => {
      queryClient.invalidateQueries({ queryKey: ["escrows"] });
      queryClient.invalidateQueries({ queryKey: ["agreement-details", agreementId] });
      queryClient.invalidateQueries({ queryKey: ["agreements"] });
    },
  });

  // Request deduction request mutation
  const requestDeductionMutation = useMutation({
    mutationFn: (params: { agreementId: number; deductionAmount: string }) =>
      EscrowService.requestDeduction(params.agreementId, params.deductionAmount),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["escrows"] });
      queryClient.invalidateQueries({ queryKey: ["agreement-details", variables.agreementId] });
      queryClient.invalidateQueries({ queryKey: ["agreements"] });
    },
  });

  // Approve deduction request mutation
  const approveDeductionMutation = useMutation({
    mutationFn: (params: { agreementId: number; tenantRefundAmount: string }) =>
      EscrowService.approveDeduction(params.agreementId, params.tenantRefundAmount),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["escrows"] });
      queryClient.invalidateQueries({ queryKey: ["agreement-details", variables.agreementId] });
      queryClient.invalidateQueries({ queryKey: ["agreements"] });
    },
  });

  // Raise dispute mutation
  const raiseDisputeMutation = useMutation({
    mutationFn: (agreementId: number) => EscrowService.raiseDispute(agreementId),
    onSuccess: (_, agreementId) => {
      queryClient.invalidateQueries({ queryKey: ["escrows"] });
      queryClient.invalidateQueries({ queryKey: ["agreement-details", agreementId] });
      queryClient.invalidateQueries({ queryKey: ["agreements"] });
    },
  });

  // Resolve dispute mutation
  const resolveDisputeMutation = useMutation({
    mutationFn: (params: { agreementId: number; tenantRefundAmount: string }) =>
      EscrowService.resolveDispute(params.agreementId, params.tenantRefundAmount),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["escrows"] });
      queryClient.invalidateQueries({ queryKey: ["agreement-details", variables.agreementId] });
      queryClient.invalidateQueries({ queryKey: ["agreements"] });
    },
  });

  // Close escrow mutation
  const closeEscrowMutation = useMutation({
    mutationFn: (agreementId: number) => EscrowService.closeEscrow(agreementId),
    onSuccess: (_, agreementId) => {
      queryClient.invalidateQueries({ queryKey: ["escrows"] });
      queryClient.invalidateQueries({ queryKey: ["agreement-details", agreementId] });
      queryClient.invalidateQueries({ queryKey: ["agreements"] });
    },
  });

  return {
    escrowsQuery,
    lockDepositMutation,
    releaseDepositFullyMutation,
    requestDeductionMutation,
    approveDeductionMutation,
    raiseDisputeMutation,
    resolveDisputeMutation,
    closeEscrowMutation,
  };
}

export function useEscrowDetails(escrowId: number) {
  return useQuery({
    queryKey: ["escrow-details", escrowId],
    queryFn: () => EscrowService.getEscrowDetails(escrowId),
    enabled: !isNaN(escrowId),
  });
}
