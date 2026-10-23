import { Suspense } from "react";
import { ItemClient } from "./ItemClient";

/**
 * A query param rather than /item/[id]: a static export cannot pre-render routes
 * for products the visitor creates on their own device.
 */
export default function ItemPage() {
  return (
    <Suspense fallback={null}>
      <ItemClient />
    </Suspense>
  );
}
