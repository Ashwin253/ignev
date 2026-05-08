export type PickedPoint = {
  label: "Pickup" | "Dropoff" | null;
  lat: number | null;
  lng: number | null;
  address: string;
};
