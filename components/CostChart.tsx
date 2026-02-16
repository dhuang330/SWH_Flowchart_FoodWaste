import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CostChartProps {
  currentStepIndex: number;
}

const CostChart: React.FC<CostChartProps> = ({ currentStepIndex }) => {
  // Simulate cost calculation animation based on steps
  // As the process becomes more efficient (heat recovery), the cost drops visually
  
  const isHeatRecoveryActive = currentStepIndex >= 1;
  
  const data = [
    {
      name: 'Traditional Electric Heating',
      cost: 16000,
      color: '#ef4444' // Red
    },
    {
      name: 'Heat Recovery Process',
      // Starts high, drops when heat recovery kicks in
      cost: isHeatRecoveryActive ? 5000 : 14000, 
      color: '#22c55e' // Green
    }
  ];

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-4 rounded-lg shadow-xl w-80">
      <h3 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">Energy Cost Comparison (CNY/day)</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={100} tick={{fill: '#94a3b8', fontSize: 10}} />
            <Tooltip 
              cursor={{fill: 'transparent'}}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9' }}
            />
            <Bar dataKey="cost" barSize={20} radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between mt-2 text-xs">
        <span className="text-red-400 font-mono">16,000</span>
        <span className={`font-mono font-bold transition-all duration-1000 ${isHeatRecoveryActive ? 'text-green-400 scale-110' : 'text-slate-400'}`}>
          {isHeatRecoveryActive ? '5,000' : '14,000'}
        </span>
      </div>
    </div>
  );
};

export default CostChart;