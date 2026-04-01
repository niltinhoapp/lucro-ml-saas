type Props = {
  unreadCount: number;
};

export default function StrategyBellBadge({ unreadCount }: Props) {
  if (unreadCount <= 0) return null;

  return (
    <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-cyan-400 px-2 py-0.5 text-[11px] font-bold text-neutral-950">
      {unreadCount}
    </span>
  );
}