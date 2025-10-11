// client/src/components/dashboard/MiniTrend.jsx
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";

export default function MiniTrend({ data = [], dataKey = "y" }) {
  return (
    <div className="h-16">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Tooltip cursor={false} />
          <Area type="monotone" dataKey={dataKey} stroke="currentColor" fill="currentColor" fillOpacity={0.12} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
