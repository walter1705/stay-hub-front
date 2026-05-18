import { apiClient } from "@/lib/api/client";

export interface CreateRentalPackageRequest {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  pricePerNight: string; // BigDecimal — use string to avoid JS float precision loss
}

export interface UpdateRentalPackageRequest {
  startDate?: string;
  endDate?: string;
  pricePerNight?: string; // BigDecimal — use string to avoid JS float precision loss
}

export interface RentalPackageResponse {
  id: number;
  accommodationId: number;
  startDate: string;
  endDate: string;
  pricePerNight: string; // BigDecimal serialized as string
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  message: string;
}

export async function createRentalPackage(
  accommodationId: number,
  data: CreateRentalPackageRequest,
) {
  return apiClient<RentalPackageResponse>(
    `/api/v2/accommodations/${accommodationId}/packages`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function getRentalPackages(accommodationId: number) {
  return apiClient<RentalPackageResponse[]>(
    `/api/v2/accommodations/${accommodationId}/packages`,
    {
      method: "GET",
    },
  );
}

export async function updateRentalPackage(
  accommodationId: number,
  packageId: number,
  data: UpdateRentalPackageRequest,
) {
  return apiClient<RentalPackageResponse>(
    `/api/v2/accommodations/${accommodationId}/packages/${packageId}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
}

export async function deleteRentalPackage(
  accommodationId: number,
  packageId: number,
) {
  return apiClient<MessageResponse>(
    `/api/v2/accommodations/${accommodationId}/packages/${packageId}`,
    {
      method: "DELETE",
    },
  );
}
