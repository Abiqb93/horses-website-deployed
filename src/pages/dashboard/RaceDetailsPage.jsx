import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardBody, Typography } from "@material-tailwind/react";

export function RaceDetailPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const tableUrl = queryParams.get("url");
  const raceTitleParam = queryParams.get("RaceTitle");

  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [matchedTitle, setMatchedTitle] = useState("");

  // Map table name to field name
  const getRaceTitleField = (url) => {
    if (url.includes("RacesAndEntries")) return "RaceTitle";
    if (url.includes("FranceRaceRecords")) return "Race";
    if (url.includes("IrelandRaceRecords")) return "Race Title";
    if (url.includes("ClosingEntries")) return "title";
    if (url.includes("DeclarationsTracking")) return "RaceTitle";
    if (url.includes("EntriesTracking")) return "RaceTitle";
    return null;
  };

  const normalize = (str) =>
    (str || "").toLowerCase().replace(/\s+/g, " ").trim();

  useEffect(() => {
    const fetchTableData = async () => {
      console.log("[RaceDetailPage] 🚀 Fetching from:", tableUrl);
      console.log("[RaceDetailPage] 🎯 Filtering by RaceTitle param:", raceTitleParam);

      try {
        if (!tableUrl) {
          setError("No table URL provided.");
          return;
        }

        const response = await fetch(tableUrl);
        const json = await response.json();
        const records = json.data || [];

        if (records.length === 0) {
          setError("No records found.");
          return;
        }

        const raceField = getRaceTitleField(tableUrl);
        console.log("[RaceDetailPage] 🧩 Using race field:", raceField);

        let filtered = records;

        if (raceTitleParam && raceField) {
          const target = normalize(raceTitleParam);
          filtered = records.filter((r) => {
            const val = normalize(r[raceField]);
            const match = val.includes(target);
            if (match) {
              console.log("[MATCH ✅]", val);
            }
            return match;
          });

          if (filtered.length > 0) {
            setMatchedTitle(filtered[0][raceField]);
          } else {
            setMatchedTitle(raceTitleParam); // fallback
          }
        } else {
          setMatchedTitle(raceTitleParam); // fallback
        }

        if (filtered.length === 0) {
          setError("No records matched the provided RaceTitle.");
        } else {
          setData(filtered);
        }
      } catch (err) {
        console.error("[RaceDetailPage] ❗ Error fetching:", err);
        setError("Failed to load race data.");
      }
    };

    fetchTableData();
  }, [tableUrl, raceTitleParam]);

  if (error) {
    return (
      <div className="px-4 py-6">
        <Typography variant="h6" color="red">{error}</Typography>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="px-4 py-6">
        <Typography>Loading race records...</Typography>
      </div>
    );
  }

  // Clean up columns: remove URLs and race title column
  const raceField = getRaceTitleField(tableUrl);
  const columns = Object.keys(data[0]).filter((col) => {
    if (col === raceField) return false;
    return !data.some(row => {
      const val = String(row[col] || "");
      return val.startsWith("http://") || val.startsWith("https://");
    });
  });

  return (
    <div className="mt-8 mb-6 px-4 flex flex-col gap-4">
      <Typography variant="h5" className="text-gray-900 font-bold mb-4">
        Race Records for: <span className="text-indigo-700">{matchedTitle}</span>
      </Typography>

      <Card className="bg-white text-black">
        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
          <table className="w-full min-w-[900px] table-auto">
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className="py-2 px-3 bg-gray-100 text-left text-[11px] font-bold uppercase border-b"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((entry, idx) => (
                <tr key={idx}>
                  {columns.map((col, j) => (
                    <td key={j} className="py-2 px-3 border-b text-xs">
                      {entry[col] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

export default RaceDetailPage;
