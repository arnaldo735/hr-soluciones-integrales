import { useBackend } from "@/hooks/use-backend";
import type {
  Appointment,
  AppointmentFilter,
  AppointmentInput,
  AppointmentStatus,
  Id,
} from "@/lib/types";
import { AppointmentStatus as AppointmentStatusEnum } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Spanish labels for every appointment status. */
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatusEnum.scheduled]: "Agendada",
  [AppointmentStatusEnum.confirmed]: "Confirmada",
  [AppointmentStatusEnum.attended]: "Atendida",
  [AppointmentStatusEnum.noShow]: "No asistió",
  [AppointmentStatusEnum.cancelled]: "Cancelada",
};

/** Badge class per appointment status, using the design system's status tokens. */
export const APPOINTMENT_STATUS_BADGE: Record<AppointmentStatus, string> = {
  [AppointmentStatusEnum.scheduled]: "badge-scheduled",
  [AppointmentStatusEnum.confirmed]: "badge-confirmed",
  [AppointmentStatusEnum.attended]: "badge-attended",
  [AppointmentStatusEnum.noShow]: "badge-noshow",
  [AppointmentStatusEnum.cancelled]: "badge-cancelled",
};

export interface AppointmentListParams {
  status: AppointmentStatus | null;
  technicianId: Id | null;
  from: bigint | null;
  to: bigint | null;
}

export function useAppointments(params: AppointmentListParams) {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: [
      "appointments",
      params.status ?? "all",
      params.technicianId?.toString() ?? "all",
      params.from?.toString() ?? "none",
      params.to?.toString() ?? "none",
    ],
    queryFn: async (): Promise<Appointment[]> => {
      if (!actor) return [];
      const filter: AppointmentFilter = {
        status: params.status ?? undefined,
        technicianId: params.technicianId ?? undefined,
        from: params.from ?? undefined,
        to: params.to ?? undefined,
      };
      return actor.listAppointments(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAppointment(id: Id | null) {
  const { actor, isFetching } = useBackend();

  return useQuery({
    queryKey: ["appointment", id?.toString() ?? "none"],
    queryFn: async (): Promise<Appointment | null> => {
      if (!actor || id === null) return null;
      return actor.getAppointment(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateAppointment() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AppointmentInput): Promise<Appointment> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.createAppointment(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useUpdateAppointment() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: Id;
      input: AppointmentInput;
    }): Promise<Appointment> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateAppointment(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: Id;
      status: AppointmentStatus;
    }): Promise<Appointment> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.updateAppointmentStatus(id, status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useDeleteAppointment() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: Id): Promise<boolean> => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.deleteAppointment(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useConvertAppointmentToOrder() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: Id) => {
      if (!actor) throw new Error("Backend no disponible");
      return actor.convertAppointmentToOrder(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
