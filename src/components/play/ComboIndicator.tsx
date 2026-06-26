interface ComboIndicatorProps {
  combo: number;
}

export function ComboIndicator({ combo }: ComboIndicatorProps) {
  if (combo < 2) return null;

  return (
    <div className="animate-bounceShort rounded-xl bg-amber-100 px-4 py-2 text-center font-bold text-amber-700">
      🔥 {combo} 连击！
    </div>
  );
}
