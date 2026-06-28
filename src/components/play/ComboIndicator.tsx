interface ComboIndicatorProps {
  combo: number;
}

export function ComboIndicator({ combo }: ComboIndicatorProps) {
  if (combo < 2) return null;

  const scale = Math.min(1.4, 1 + combo * 0.06);
  const isBig = combo >= 5;

  return (
    <div
      className={[
        'pointer-events-none animate-bounceShort rounded-2xl px-5 py-2 text-center font-black shadow-lg',
        isBig
          ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white'
          : 'bg-amber-100 text-amber-700'
      ].join(' ')}
      style={{ transform: `scale(${scale})` }}
    >
      {isBig ? '🔥🔥' : '🔥'} {combo} 连击！
    </div>
  );
}
