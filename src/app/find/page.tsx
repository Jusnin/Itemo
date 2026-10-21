import { allStock, readDb } from "@/lib/db";
import { Header } from "@/components/Header";
import { FindClient } from "./FindClient";

export const dynamic = "force-dynamic";

export default async function FindPage() {
  const db = await readDb();
  // The dataset is small enough to filter on the client — search feels instant,
  // with no request per keystroke. Revisit if this ever holds thousands of items.
  return (
    <>
      <Header title="Find Item" />
      <FindClient items={allStock(db)} />
    </>
  );
}
