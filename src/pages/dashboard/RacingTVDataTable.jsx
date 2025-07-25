import React, { useEffect, useState } from "react";

const RacingTVDataTable = ({ horseName }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const DISPLAY_COLUMNS = [
    "Date",
    "Track",
    "RaceID",
    "Stride Length Value",
    "Stride Length Pos",
    "Min Frequency Value",
    "Min Frequency Pos",
    "Avg Frequency Value",
    "Avg Frequency Pos",
    "Max Frequency Value",
    "Max Frequency Pos",
    "Min Length Value",
    "Min Length Pos",
    "Avg Length Value",
    "Avg Length Pos",
    "Max Length Value",
    "Max Length Pos"
  ];

  // Columns to ignore when checking for non-empty values
  const META_COLUMNS = new Set(["Date", "Track", "RaceID"]);

  useEffect(() => {
    if (!horseName) return;

    setLoading(true);

    fetch(`https://horseracesbackend-production.up.railway.app/api/racingtv/${horseName.toLowerCase().trim()}`)
      .then((res) => res.json())
      .then((json) => {
        const raw = Array.isArray(json.data) ? json.data : [];

        // Keep rows where at least one non-meta column is non-empty
        const filtered = raw.filter((row) => {
          return DISPLAY_COLUMNS.some((col) => {
            if (META_COLUMNS.has(col)) return false; // skip meta columns
            const val = row[col];
            return val !== null && val !== undefined && val !== "" && val !== "-";
          });
        });

        console.log("✅ Filtered RacingTV Stride Data:", filtered);
        setData(filtered);
      })
      .catch((err) => {
        console.error("❌ Error fetching RacingTV stride data:", err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [horseName]);

  if (!horseName) {
    return <div className="text-sm text-red-500 italic">No horse selected.</div>;
  }

  if (loading) {
    return <div className="text-sm text-gray-500 italic">Loading...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-sm text-red-500 italic">
        No Stride Data Found for <strong>{horseName}</strong>.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto text-xs border rounded bg-white mt-4">
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100 text-left">
          <tr>
            {DISPLAY_COLUMNS.map((col) => (
              <th key={col} className="border px-2 py-1 whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {DISPLAY_COLUMNS.map((col) => (
                <td key={col} className="border px-2 py-1 whitespace-nowrap">
                  {row[col] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RacingTVDataTable;
