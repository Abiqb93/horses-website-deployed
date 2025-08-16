import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
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
          const url = `${tableUrl}?meetingDate=${encodeURIComponent(meetingDate)}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("Failed to fetch from APIData_Table2");
          const json = await res.json();
          records = json.data || [];
        } else {
          const res = await fetch(tableUrl);
          if (!res.ok) throw new Error("Failed to fetch");
          const json = await res.json();
          records = json.data || [];
        }

        if (!records.length) {
          setError("No records found.");
          return;
        }

        const raceField = getRaceTitleField(tableUrl);
        let filtered = records;

        if (raceTitleParam && raceField) {
          const target = normalize(raceTitleParam);
          filtered = records.filter((r) => normalize(r[raceField]) === target);
          if (filtered.length) {
            setMatchedTitle(filtered[0][raceField]);
          } else {
            setMatchedTitle(raceTitleParam);
          }
        } else setMatchedTitle(raceTitleParam);

        if (!filtered.length) setError("No records matched the provided RaceTitle.");
        else setData(filtered);
      } catch (err) {
        console.error(err);
        setError("Failed to load race data.");
      }
    };
    fetchTableData();
  }, [tableUrl, raceTitleParam, meetingDate]);

  if (error) {
    return (
      <div className="px-4 py-6">
        <Typography color="red">{error}</Typography>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="px-4 py-6">
        <Typography>Loading race records...</Typography>
      </div>
    );
  }

  const raceField = getRaceTitleField(tableUrl);
  const columns = Object.keys(data[0]).filter((col) => {
    if (col === raceField) return false;
    return !data.some((row) => {
      const v = String(row[col] || "");
      return v.startsWith("http://") || v.startsWith("https://");
    });
  });

  return (
    <div className="mt-8 mb-6 px-4 flex flex-col gap-4">
      <Typography variant="h5" className="text-gray-900 font-bold mb-4">
        Race Records for: <span className="text-indigo-700">{matchedTitle}</span>
      </Typography>

      <Card className="bg-white text-black">
        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
          <table className="min-w-[900px] w-full table-auto">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col} className="py-2 px-3 text-[11px] font-bold uppercase bg-gray-100 border-b text-left">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data
                .sort((a, b) => {
                  const A = parseInt(a.positionOfficial);
                  const B = parseInt(b.positionOfficial);
                  return (isNaN(A) ? Infinity : A) - (isNaN(B) ? Infinity : B);
                })
                .map((entry, idx) => (
                  <tr key={idx}>
                    {columns.map((col) => {
                      const val = entry[col];
                      const normalizedCol = col.toLowerCase().trim();
                      const isHorse = ["horse", "horse name", "horsename"].includes(normalizedCol);

                      return (
                        <td key={col} className="py-2 px-3 border-b text-xs">
                          {isHorse && val ? (
                            <Link
                              to={`/dashboard/horse/${encodeURIComponent(val.trim())}`}
                              className="text-blue-600 hover:underline"
                            >
                              {val}
                            </Link>
                          ) : (
                            val ?? "-"
                          )}
                        </td>
                      );
                    })}
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
