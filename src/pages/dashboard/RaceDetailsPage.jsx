import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardBody, Typography } from "@material-tailwind/react";

export function RaceDetailPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const tableUrl = queryParams.get("url");
  const raceTitleParam = queryParams.get("RaceTitle");
  const meetingDate = queryParams.get("meetingDate");

  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [matchedTitle, setMatchedTitle] = useState("");

  const getRaceTitleField = (url) => {
    if (url.includes("APIData_Table2")) return "raceTitle";
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
      console.log("[RaceDetailPage] 🎯 Filtering by RaceTitle:", raceTitleParam);

      try {
        if (!tableUrl) {
          setError("No table URL provided.");
          return;
        }

        let records = [];

        if (tableUrl.includes("APIData_Table2")) {
          if (!meetingDate) {
            setError("Meeting date is required for APIData_Table2.");
            return;
          }

          const filteredUrl = `${tableUrl}?meetingDate=${encodeURIComponent(meetingDate)}`;
          const response = await fetch(filteredUrl);
          if (!response.ok) throw new Error("Failed to fetch from APIData_Table2");
          const json = await response.json();
          records = json.data || [];
        } else {
          const response = await fetch(tableUrl);
          if (!response.ok) throw new Error("Failed to fetch from source");
          const json = await response.json();
          records = json.data || [];
        }

        if (records.length === 0) {
          setError("No records found.");
          return;
        }

        const raceField = getRaceTitleField(tableUrl);
        let filtered = records;

        if (raceTitleParam && raceField) {
          const target = normalize(raceTitleParam);
          filtered = records.filter((r) => {
            const val = normalize(r[raceField]);
            return val === target;
          });

          if (filtered.length > 0) {
            setMatchedTitle(filtered[0][raceField]);
          } else {
            setMatchedTitle(raceTitleParam);
          }
        } else {
          setMatchedTitle(raceTitleParam);
        }

        if (filtered.length === 0) {
          setError("No records matched the provided RaceTitle.");
        } else {
          setData(filtered);
        }
      } catch (err) {
        console.error("[RaceDetailPage] ❗ Error:", err);
        setError("Failed to load race data.");
      }
    };

    fetchTableData();
  }, [tableUrl, raceTitleParam, meetingDate]);

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
              {data
                .sort((a, b) => {
                  const posA = parseInt(a.positionOfficial);
                  const posB = parseInt(b.positionOfficial);
                  return (isNaN(posA) ? Infinity : posA) - (isNaN(posB) ? Infinity : posB);
                })
                .map((entry, idx) => (
                <tr key={idx}>
                  {columns.map((col, j) => (
                    <td key={j} className="py-2 px-3 border-b text-xs">
                      {(() => {
                        const rawHorseName = entry[col];
                        const normalizedCol = col.toLowerCase().trim();
                        const isHorseNameCol = ["horse", "horse name", "horsename"].includes(normalizedCol);

                        if (isHorseNameCol && rawHorseName) {
                          return (
                            <a
                              href={`/dashboard/horse/${encodeURIComponent(rawHorseName.trim())}`}
                              className="text-blue-600 hover:underline"
                            >
                              {rawHorseName}
                            </a>
                          );
                        }

                        return rawHorseName ?? "-";
                      })()}
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
