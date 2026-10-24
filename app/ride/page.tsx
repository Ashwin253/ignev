import type { Metadata } from "next";
import RideClientPage from "./RideClientPage";

export const metadata: Metadata = {
  title: "Ride | EVPLSE",
  description: "Request a ride using Uber Guest Rides integration.",
};

export default function RidePage() {
  return <RideClientPage />;
}
