"use client";

import { useCallback, useEffect, useState } from "react";
import type { StockItem } from "./types";
import { allStock } from "./stock";
import { readDb } from "./store";

/** null while loading — lets screens show a skeleton instead of a wrong empty state. */
export function useStock() {
  const [items, setItems] = useState<StockItem[] | null>(null);

  const reload = useCallback(async () => {
    const db = await readDb();
    setItems(allStock(db));
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, reload };
}
