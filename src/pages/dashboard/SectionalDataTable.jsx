import React, { useEffect, useState } from "react";

const SectionalDataTable = ({ horseName }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state (to match Race History)
  const [sortBy, setSortBy] = useState("");
  const [order, setOrder] = useState("asc");
  const [visibleRows, setVisibleRows] = useState(10);

  // Columns must match backend keys exactly
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
    "Finish",
  ];

  // Friendly headers (optional)
  const columnHeaderMap = {
    Time: "Time",
    Racename: "Title",
    Date: "Date",
    Type: "Race Type",
    Distance: "Distance",
    "Start-5f": "Start-5f",
    "5f-4f": "5f-4f",
    "4f-3f": "4f-3f",
    "3f-2f": "3f-2f",
    "2f-1f": "2f-1f",
    "1f-Finish": "1f-Finish",
    Finish: "Finish",
  };

  // Treat these as numeric-ish for sorting (extract numbers from strings like "12.34s", "7f")
  const numericishColumns = new Set([
    "Distance",
    "Start-5f",
    "5f-4f",
    "4f-3f",
    "3f-2f",
    "2f-1f",
    "1f-Finish",
    "Finish",
    "Time",
  ]);

  const parseNumericish = (val) => {
    if (val === null || val === undefined) return NaN;
    const nums = String(val).match(/[-+]?\d*\.?\d+/g);
    if (!nums || nums.length === 0) return NaN;
    // If value contains multiple numbers (e.g., "1m 12.34s"), use the last (usually seconds)
    return parseFloat(nums[nums.length - 1]);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return isNaN(d.getTime())
      ? String(date) // fallback if not ISO
      : d.toLocaleDateString("en-GB").replaceAll("/", "-");
  };

  useEffect(() => {
    if (!horseName) return;

    setLoading(true);
    fetch(`https://horseracesbackend-production.up.railway.app/api/attheraces/${horseName}`)
      .then((res) => res.json())
      .then((json) => {
        const arr = Array.isArray(json?.data) ? json.data : [];
        setData(arr);
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

  const sortedData = [...data].sort((a, b) => {
    if (!sortBy) return 0;
    const A = a?.[sortBy];
    const B = b?.[sortBy];

    // Date sorting
    if (sortBy === "Date") {
      const tA = A ? new Date(A).getTime() : 0;
      const tB = B ? new Date(B).getTime() : 0;
      return order === "asc" ? tA - tB : tB - tA;
    }

    // Numeric-ish columns sorting
    if (numericishColumns.has(sortBy)) {
      const nA = parseNumericish(A);
      const nB = parseNumericish(B);
      if (isNaN(nA) || isNaN(nB)) {
        const sA = (A ?? "").toString();
        const sB = (B ?? "").toString();
        return order === "asc" ? sA.localeCompare(sB) : sB.localeCompare(sA);
      }
      return order === "asc" ? nA - nB : nB - nA;
    }

    // String sorting
    const sA = (A ?? "").toString();
    const sB = (B ?? "").toString();
    return order === "asc" ? sA.localeCompare(sB) : sB.localeCompare(sA);
  });

  const handleShowMore = () => setVisibleRows((v) => v + 10);

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full table-auto text-sm">
        <thead className="bg-blue-gray-50 text-blue-gray-700 text-[11px] uppercase">
          <tr>
            {DISPLAY_COLUMNS.map((key) => (
              <th
                key={key}
                className="px-3 py-2 border-b cursor-pointer hover:text-blue-500 whitespace-nowrap"
                onClick={() => {
                  if (sortBy === key) {
                    setOrder(order === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy(key);
                    setOrder("asc");
                  }
                }}
              >
                {columnHeaderMap[key] || key}
                <span className="ml-1">
                  {sortBy === key ? (order === "asc" ? "🔼" : "🔽") : "↕"}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedData.slice(0, visibleRows).map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {DISPLAY_COLUMNS.map((key) => (
                <td
                  key={key}
                  className="px-3 py-2 border-b text-[11px] whitespace-nowrap max-w-[150px] truncate"
                  title={
                    key === "Date"
                      ? formatDate(row[key])
                      : row[key] !== null && row[key] !== undefined && row[key] !== ""
                      ? String(row[key])
                      : "-"
                  }
                >
                  {key === "Date"
                    ? formatDate(row[key])
                    : row[key] !== null && row[key] !== undefined && row[key] !== ""
                    ? row[key]
                    : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-center items-center mt-4 gap-2 text-xs">
        {visibleRows < sortedData.length ? (
          <button
            onClick={handleShowMore}
            className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Show More
          </button>
        ) : (
          <p className="text-gray-500 text-sm">End of records</p>
        )}
      </div>
    </div>
  );
};

export default SectionalDataTable;
