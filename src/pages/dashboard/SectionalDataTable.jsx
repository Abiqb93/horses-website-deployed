import React, { useEffect, useState } from "react";

const SectionalDataTable = ({ horseName }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // List of columns you want to display — these must match backend keys exactly
  const DISPLAY_COLUMNS = [
    "Time",
    "Racename",
    "Date",
    "Type",
    "Distance",
    "Start-5f",
    "5f-4f",
    "4f-3f",
    "3f-2f",
    "2f-1f",
    "1f-Finish",
    "Finish"
  ];

  useEffect(() => {
    if (!horseName) return;

    setLoading(true);

    fetch(`https://horseracesbackend-production.up.railway.app/api/attheraces/${horseName}`)
      .then((res) => res.json())
      .then((json) => {
        console.log("✅ Raw Sectional Data:", json.data);
        setData(Array.isArray(json.data) ? json.data : []);
      })
      .catch((err) => {
        console.error("❌ Error fetching sectional data:", err);
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
        No Sectional Data Found for <strong>{horseName}</strong>.
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

export default SectionalDataTable;
