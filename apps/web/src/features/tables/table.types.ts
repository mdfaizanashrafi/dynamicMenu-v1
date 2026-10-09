/** Table domain types returned by the Phase 5 tables APIs. */

export interface RestaurantTableDto {
  id: string;
  restaurantId: string;
  label: string;
  qrToken: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Full customer URL encoded in the QR code (server-built). */
  menuUrl: string;
}
