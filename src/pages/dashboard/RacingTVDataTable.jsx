import React, { useEffect, useState } from "react";

const RacingTVDataTable = ({ horseName }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state to mirror the Sectional/Race History tables
  const [sortBy, setSortBy] = useState("");
  const [order, setOrder] = useState("asc");
  const [visibleRows, setVisibleRows] = useState(10);

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
    "Max Length Pos",
  ];

  const META_COLUMNS = new Set(["Date", "Track", "RaceID"]);

  const NUMERICISH = new Set([
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
    "Max Length Pos",
  ]);

  const parseNumericish = (val) => {
    if (val === null || val === undefined) return NaN;
    const nums = String(val).match(/[-+]?\d*\.?\d+/g);
    if (!nums || nums.length === 0) return NaN;
    return parseFloat(nums[nums.length - 1]);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return isNaN(d.getTime())
      ? String(date)
      : d.toLocaleDateString("en-GB").replaceAll("/", "-");
  };

  const capitalizeWords = (str) => {
    if (!str) return "-";
    return String(str)
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
    if (!horseName) return;

    setLoading(true);

    fetch(
      `https://horseracesbackend-production.up.railway.app/api/racingtv/${horseName
        .toLowerCase()
        .trim()}`
    )
      .then((res) => res.json())
      .then((json) => {
        const raw = Array.isArray(json?.data) ? json.data : [];
        const filtered = raw.filter((row) =>
          DISPLAY_COLUMNS.some((col) => {
            if (META_COLUMNS.has(col)) return false;
            const val = row[col];
            return val !== null && val !== undefined && val !== "" && val !== "-";
          })
        );
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

  const sortedData = [...data].sort((a, b) => {
    if (!sortBy) return 0;
    const A = a?.[sortBy];
    const B = b?.[sortBy];

    if (sortBy === "Date") {
      const tA = A ? new Date(A).getTime() : 0;
      const tB = B ? new Date(B).getTime() : 0;
      return order === "asc" ? tA - tB : tB - tA;
    }

    if (NUMERICISH.has(sortBy)) {
      const nA = parseNumericish(A);
      const nB = parseNumericish(B);
      if (isNaN(nA) || isNaN(nB)) {
        const sA = (A ?? "").toString();
        const sB = (B ?? "").toString();
        return order === "asc" ? sA.localeCompare(sB) : sB.localeCompare(sA);
      }
      return order === "asc" ? nA - nB : nB - nA;
    }

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
                {key}
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
              {DISPLAY_COLUMNS.map((key) => {
                let value = row[key];
                if (key === "Date") value = formatDate(value);
                if (key === "Track") value = capitalizeWords(value);
                if (value === null || value === undefined || value === "") value = "-";

                return (
                  <td
                    key={key}
                    className="px-3 py-2 border-b text-[11px] whitespace-nowrap max-w-[150px] truncate"
                    title={String(value)}
                  >
                    {value}
                  </td>
                );
              })}
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

export default RacingTVDataTable;
