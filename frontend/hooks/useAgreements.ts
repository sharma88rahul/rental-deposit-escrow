import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AgreementService } from "@/services/agreement";
import { Agreement } from "@/types";

export function useAgreements() {
  const queryClient = useQueryClient();

  // Load all agreements query
  const agreementsQuery = useQuery({
    queryKey: ["agreements"],
    queryFn: () => AgreementService.fetchAgreements(),
  });

  // Create agreement mutation
  const createAgreementMutation = useMutation({
    mutationFn: (params: {
      title: string;
      propertyAddress: string;
      tenant: string;
      token: string;
      depositAmount: string;
      duration: number;
      metadataHash: string;
    }) => AgreementService.createAgreement(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agreements"] });
    },
  });

  // Edit draft agreement mutation
  const editAgreementMutation = useMutation({
    mutationFn: (params: {
      id: number;
      title: string;
      propertyAddress: string;
      depositAmount: string;
    }) =>
      AgreementService.editAgreementDraft(params.id, {
        title: params.title,
        propertyAddress: params.propertyAddress,
        depositAmount: params.depositAmount,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agreements"] });
      queryClient.invalidateQueries({ queryKey: ["agreement-details", variables.id] });
    },
  });

  // Cancel draft agreement mutation
  const cancelAgreementMutation = useMutation({
    mutationFn: (id: number) => AgreementService.cancelAgreementDraft(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["agreements"] });
      queryClient.invalidateQueries({ queryKey: ["agreement-details", id] });
    },
  });

  // Accept agreement mutation
  const acceptAgreementMutation = useMutation({
    mutationFn: (id: number) => AgreementService.acceptAgreement(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["agreements"] });
      queryClient.invalidateQueries({ queryKey: ["agreement-details", id] });
    },
  });

  // Reject agreement mutation
  const rejectAgreementMutation = useMutation({
    mutationFn: (id: number) => AgreementService.rejectAgreement(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["agreements"] });
      queryClient.invalidateQueries({ queryKey: ["agreement-details", id] });
    },
  });

  // Propose refund mutation
  const proposeRefundMutation = useMutation({
    mutationFn: (params: { id: number; refundAmount: string }) =>
      AgreementService.proposeRefund(params.id, params.refundAmount),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agreements"] });
      queryClient.invalidateQueries({ queryKey: ["agreement-details", variables.id] });
    },
  });

  // Resolve dispute mutation
  const resolveDisputeMutation = useMutation({
    mutationFn: (params: { id: number; refundAmount: string }) =>
      AgreementService.resolveDispute(params.id, params.refundAmount),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agreements"] });
      queryClient.invalidateQueries({ queryKey: ["agreement-details", variables.id] });
    },
  });

  return {
    agreementsQuery,
    createAgreementMutation,
    editAgreementMutation,
    cancelAgreementMutation,
    acceptAgreementMutation,
    rejectAgreementMutation,
    proposeRefundMutation,
    resolveDisputeMutation,
  };
}

export function useAgreementDetails(id: number) {
  return useQuery({
    queryKey: ["agreement-details", id],
    queryFn: () => AgreementService.getAgreementDetails(id),
    enabled: !isNaN(id),
  });
}
