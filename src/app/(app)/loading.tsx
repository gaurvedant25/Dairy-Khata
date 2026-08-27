import { ListSkeleton } from "@/components/Skeletons";

// Fallback skeleton for any app route without its own loading state.
export default function Loading() {
  return <ListSkeleton />;
}
