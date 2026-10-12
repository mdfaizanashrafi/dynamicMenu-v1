import { formatPrice } from "../menus/format-price";
import { useCart } from "./cart-context";

interface Props {
  onOpen: () => void;
}

export function CartButton({ onOpen }: Props) {
  const { totalCount, totalPrice } = useCart();

  if (totalCount === 0) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed bottom-4 left-4 right-4 z-40 flex h-14 items-center justify-between rounded-2xl px-5 shadow-xl sm:left-auto sm:right-6 sm:w-80"
      style={{
        background: "var(--tm-primary)",
        color: "var(--tm-bg)",
        borderRadius: "var(--tm-button-radius)",
      }}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full font-bold" style={{ background: "var(--tm-bg)", color: "var(--tm-primary)" }}>
        {totalCount}
      </span>
      <span className="font-semibold">View cart</span>
      <span className="font-bold">{formatPrice(totalPrice)}</span>
    </button>
  );
}
