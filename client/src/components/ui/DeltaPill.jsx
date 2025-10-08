export default function DeltaPill({ delta = 0, suffix = '%', positiveIsUp = true }) {
  const d = Number(delta) || 0;
  const up = d >= 0;
  const toneOk = positiveIsUp ? up : !up;
  const bg = toneOk ? 'bg-green-200 text-green-900' : 'bg-red-200 text-red-900';
  const sign = up ? '+' : '';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-xl text-xs ${bg}`}>
      {sign}{d}{suffix}
    </span>
  );
}
