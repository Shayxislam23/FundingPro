export const PAGINATE_BATCH = 50;

type PaginateResult<T> = {
  page: T[];
  isDone: boolean;
  continueCursor: string;
};

/** Read an indexed query in batches via `.paginate()` instead of full table scans. */
export async function paginateAll<T>(
  orderedQuery: {
    paginate: (opts: {
      numItems: number;
      cursor: string | null;
    }) => Promise<PaginateResult<T>>;
  },
  batchSize = PAGINATE_BATCH
): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | null = null;
  let isDone = false;

  while (!isDone) {
    const batch = await orderedQuery.paginate({ numItems: batchSize, cursor });
    items.push(...batch.page);
    isDone = batch.isDone;
    cursor = batch.continueCursor;
  }

  return items;
}
