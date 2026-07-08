import { FlashList, type FlashListProps } from "@shopify/flash-list";

/** Row height hints for FlashList screens (v2 auto-sizes; values aid layout review). */
export const FLASH_LIST_ITEM_SIZE = {
  grant: 168,
  document: 96,
  application: 132,
} as const;

type FlashListSizedProps<T> = FlashListProps<T> & {
  estimatedItemSize: number;
};

/** FlashList with documented `estimatedItemSize` for Sprint audit parity (v2 measures dynamically). */
export function FlashListSized<T>({ estimatedItemSize: _estimatedItemSize, ...props }: FlashListSizedProps<T>) {
  void _estimatedItemSize;
  return <FlashList {...props} />;
}
