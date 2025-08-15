import React, { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { Link } from "react-router-dom";

export function IrelandRaceRecords() {
  const [records, setRecords] = useState([]);
  const [expandedKey, setExpandedKey] = useState(null);
  const [expandedRaceId, setExpandedRaceId] = useState(null);
  const [watchedRaceTitles, setWatchedRaceTitles] = useState([]);

  useEffect(() => {
    fetchData();
    fetchWatchedRaces();
  }, []);

  const fetchWatchedRaces = async () => {
    const storedUser = localStorage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser).userId : "Guest";

    try {
      const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/race_watchlist/${userId}`);
      const data = await res.json();
      const titles = data.map(item => item.race_title?.trim().toLowerCase());
      setWatchedRaceTitles(titles);
    } catch (error) {
      console.error("Error fetching watched races:", error);
    }
  };


  const fetchData = async () => {
    try {
      const response = await fetch("https://horseracesbackend-production.up.railway.app/api/IrelandRaceRecords");
      const data = await response.json();
      setRecords(data.data || []);
    } catch (error) {
      console.error("Error fetching IrelandRaceRecords:", error);
    }
  };

  const formatToMySQLDate = (input) => {
    if (!input || typeof input !== "string") return null;

    const cleaned = input
      .trim()
      .replace(/\s+/g, " ")
      .replace(/(\d{1,2})(st|nd|rd|th)/g, "$1")
      .replace(/,/g, "");

    const parsedDate = new Date(cleaned);
    if (isNaN(parsedDate)) return null;

    const yyyy = parsedDate.getFullYear();
    const mm = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const dd = String(parsedDate.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`; // ✅ Local YYYY-MM-DD
  };

  const handleAddToWatchlist = async (race, date) => {
    const storedUser = localStorage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser).userId : null;

    if (!userId) {
      alert("Please log in to use the watch list feature.");
      return;
    }
    console.log("Raw date input:", date);
    console.log("Parsed date:", formatToMySQLDate(date));
    const raceTitle = race["Race Title"]?.trim();
      const formattedDate = formatToMySQLDate(date); // ✅ use passed-in date

      if (!raceTitle || !formattedDate) {
        console.error("Invalid raceTitle or date", { raceTitle, formattedDate });
        alert("Missing race title or date. Cannot add to watch list.");
        return;
      }

      const payload = {
        user_id: userId,
        race_title: raceTitle,
        race_date: formattedDate,
        race_time: race["Race Time"],
        track: race["Course"],
        source_table: "IrelandRaceRecords"
      };

      console.log("Payload being sent:", payload); // ✅ Should now show correct date

      try {
        const response = await fetch("http://localhost:8080/api/race_watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          await fetchWatchedRaces();
        } else {
          const errorText = await response.text();
          console.error("Failed to add to watch list:", errorText);
        }
      } catch (error) {
        console.error("Error adding to watch list:", error);
      }
    };

  const normalizeDateString = (str) => str?.replace(/\s{2,}/g, " ").trim();

  const groupByCourseAndDate = (data) => {
    const grouped = {};
    const seen = new Set();

    data.forEach((item) => {
      const course = item.Course;
      const date = normalizeDateString(item.Date);
      const key = `${course}-${date}`;
      if (!seen.has(key)) {
        seen.add(key);
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push({ course, date });
      }
    });

    return grouped;
  };

  const toggleExpanded = (course, date) => {
    const key = `${course}-${normalizeDateString(date)}`;
    setExpandedKey((prev) => (prev === key ? null : key));
    setExpandedRaceId(null);
  };

  const toggleRaceTable = (raceID) => {
    setExpandedRaceId((prev) => (prev === raceID ? null : raceID));
  };

  const getRacesForCourseDate = (course, date) => {
    const normalizedDate = normalizeDateString(date);
    const seenRaceIds = new Set();
    return records.filter((entry) => {
      const match =
        entry.Course === course &&
        normalizeDateString(entry.Date) === normalizedDate &&
        entry["Race Code"] &&
        !seenRaceIds.has(entry["Race Code"]);
      if (match) {
        seenRaceIds.add(entry["Race Code"]);
      }
      return match;
    });
  };

  const getEntriesForRace = (raceID) =>
    records.filter((entry) => entry["Race Code"] === raceID);

  const columnMap = [
    "Number", "Horse Name", "Silks Description", "Jockey Short", "Trainer Short",
    "Weight", "Age", "Colour", "Sex", "Sire-Dam",
    "Form", "Jockey", "Trainer", "Owner", "Last Runs"
  ];

  const grouped = groupByCourseAndDate(records);

  return (
    <div className="mt-8 mb-6 px-4 flex flex-col gap-4">
      {Object.entries(grouped).map(([date, courseGroup]) => (
        <div key={date}>
          <Typography variant="h6" className="text-gray-800 font-medium mb-2">
            Racing on {date}
          </Typography>

          {courseGroup.map((cg, idx) => {
            const cardKey = `${cg.course}-${normalizeDateString(cg.date)}`;
            const isExpanded = expandedKey === cardKey;

            return (
              <div key={idx}>
                {/* First Tier: Course + Date */}
                <Card
                  className="shadow-sm border border-gray-200 mb-1 px-4 py-2 cursor-pointer bg-gray-50"
                  onClick={() => toggleExpanded(cg.course, cg.date)}
                >
                  <CardBody className="p-0 flex justify-between items-center text-sm text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-red-700 font-bold uppercase">{cg.course}</span>
                      <span>/ {cg.date}</span>
                    </div>
                  </CardBody>
                </Card>

                {isExpanded && (
                  <div className="ml-4 mt-2 mb-4 space-y-2">
                    {getRacesForCourseDate(cg.course, cg.date).map((race, i) => (
                      <div key={i}>
                        {/* Second Tier: Race Summary */}
                        <div
                          onClick={() => race["Race Code"] && toggleRaceTable(race["Race Code"])}
                          className="flex justify-between items-start bg-white border border-gray-200 px-4 py-3 rounded-md text-sm shadow-sm hover:shadow-md transition cursor-pointer"
                        >
                          <div className="flex flex-col gap-1 max-w-[60%]">
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-900 text-white text-xs font-bold px-2 py-1 rounded">
                                {race["Race Code"] || "?"}
                              </span>
                              <span className="font-medium">{race["Race Time"] || "-"}</span>
                              <span className="font-normal text-gray-700">{race["Race Title"] || "-"}</span>
                                {race["Race Title"] && !watchedRaceTitles.includes(race["Race Title"].trim().toLowerCase()) ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // prevent race table toggle
                                      handleAddToWatchlist(race, cg.date);
                                    }}
                                    className="ml-2 px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    +Watch
                                  </button>
                                ) : race["Race Title"] ? (
                                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-400 text-white rounded">
                                    Watching
                                  </span>
                                ) : null}
                            </div>
                            <span className="text-gray-500 text-xs">{race["Stage"] || "-"}</span>
                          </div>
                          <div className="flex flex-wrap justify-end gap-x-6 gap-y-1 text-gray-700 text-right text-xs">
                            <div><strong>{race["Distance"] || "-"}</strong></div>
                            <div><strong>{race["Prize"] || "-"}</strong></div>
                            <div><strong>{race["Max Runners"] || "-"}</strong></div>
                            <div><strong>{race["Race Description"] || "-"}</strong></div>
                          </div>
                        </div>

                        {/* Third Tier: Race Entry Table */}
                        {expandedRaceId === race["Race Code"] && (
                          <Card className="bg-white text-black mt-2">
                            <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
                              <table className="w-full min-w-[900px] table-auto">
                                <thead>
                                  <tr>
                                    {columnMap.map((col) => (
                                      <th key={col} className="py-2 px-3 bg-gray-100 text-left text-[11px] font-bold uppercase border-b">
                                        {col}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {getEntriesForRace(race["Race Code"]).map((entry, idx) => (
                                    <tr key={idx}>
                                      {columnMap.map((col, j) => {
                                          const value = entry[col] ?? "-";
                                          const isHorseCol = col === "Horse Name";

                                          return (
                                            <td key={j} className="py-2 px-3 border-b text-xs">
                                              {isHorseCol ? (
                                                <Link
                                                  to={`/dashboard/horse/${encodeURIComponent(value.trim())}`}
                                                  className="text-blue-700 underline hover:text-blue-900"
                                                >
                                                  {value}
                                                </Link>
                                              ) : (
                                                value
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
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default IrelandRaceRecords;
