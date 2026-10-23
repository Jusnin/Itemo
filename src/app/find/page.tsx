"use client";

import { Header } from "@/components/Header";
import { useStock } from "@/lib/useStock";
import { FindClient } from "./FindClient";

export default function FindPage() {
  const { items } = useStock();
  return (
    <>
      <Header title="Find Item" back="/home" />
      <FindClient items={items ?? []} loading={items === null} />
    </>
  );
}
