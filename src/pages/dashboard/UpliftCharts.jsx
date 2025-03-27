import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, AreaChart, Area
} from "recharts";

const UpliftCharts = ({ upliftData }) => {
  if (!upliftData || upliftData.length === 0) return null;

  // Normalize column names for Recharts
  const cleanedData = upliftData.map((row) => ({
    foalYear: row.FOALYEAR || row.FoalYear || row.foalYear,
    totalFoals: parseFloat(row["TOTAL FOALS"] || row.total_foals || row.totalFoals),
    avgPerformance: parseFloat(row["AVG PERFORMANCE"] || row.avg_performance || row.avgPerformance),
    sireRollingUplift: parseFloat(row["SIRE ROLLING UPLIFT"] || row.sire_rolling_uplift),
    overallUplift: parseFloat(row["OVERALL UPLIFT"] || row.overall_uplift),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-white rounded-xl p-4 shadow-md">
        <h3 className="text-center font-bold mb-2">Sire Uplift Trend by Foal Year</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={cleanedData}>
            <defs>
              <linearGradient id="colorSire" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#fcd34d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="foalYear" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            <Area type="monotone" dataKey="sireRollingUplift" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSire)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-md">
        <h3 className="text-center font-bold mb-2">Sire Uplift by Crop</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cleanedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="foalYear" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="overallUplift" stroke="#f97316" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UpliftCharts;
