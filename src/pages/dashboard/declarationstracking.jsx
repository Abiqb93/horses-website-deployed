import React, { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { Link } from "react-router-dom";


export function DeclarationsTracking() {
  const [RacesAndEntries, setRacesAndEntries] = useState([]);
  const [expandedKey, setExpandedKey] = useState(null);
  const [expandedRaceId, setExpandedRaceId] = useState(null);
  const [watchedRaceTitles, setWatchedRaceTitles] = useState([]);
  
  useEffect(() => {
  fetchData();
  fetchWatchedRaces(); // fetch watchlist when component loads
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

  const formatToMySQLDate = (input) => {
    const parsed = new Date(input?.trim().replace(/\s+/g, " "));
    if (isNaN(parsed)) return null;

    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`; // 🟢 Correct local YYYY-MM-DD
  };

  const fetchData = async () => {
    try {
      const response = await fetch("https://horseracesbackend-production.up.railway.app/api/DeclarationsTracking");
      
      const data = await response.json();
      setRacesAndEntries(data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleAddToWatchlist = async (race) => {
    const storedUser = localStorage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser).userId : null;

    if (!userId) {
      alert("Please log in to use the watch list feature.");
      return;
    }

    const payload = {
      user_id: userId,
      race_title: race.RaceTitle?.trim(),
      race_date: formatToMySQLDate(race.Date),
      race_time: race.RaceTime,
      source_table: "DeclarationsTracking"
    };

    try {
      const response = await fetch("https://horseracesbackend-production.up.railway.app/api/race_watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchWatchedRaces(); // refresh watchlist state
      } else {
        const errorText = await response.text();
        console.error("Failed to add to watch list:", errorText);
      }
    } catch (error) {
      console.error("Error adding to watch list:", error);
    }
  };

  const groupByDateWithUniqueRaces = (data) => {
    const grouped = {};
    const seen = new Set();

    data.forEach((item) => {
      const date = item.Date;
      const key = `${item.Track}-${item.Date}-${item.Session}-${item.RaceType}`;
      if (!seen.has(key)) {
        seen.add(key);
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push({
          track: item.Track,
          date: item.Date,
          race_type: item.RaceType,
          session: item.Session,
        });
      }
    });

    return grouped;
  };

  const formatDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return "";
    const cleaned = dateStr.replace(/\s{2,}/g, " ");
    const dateObj = new Date(cleaned);
    if (isNaN(dateObj)) return cleaned;
    return dateObj.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const toggleExpanded = (track, date) => {
    const key = `${track}-${date}`;
    setExpandedKey((prev) => (prev === key ? null : key));
    setExpandedRaceId(null);
  };

  const toggleRaceTable = (raceID) => {
    setExpandedRaceId((prev) => (prev === raceID ? null : raceID));
  };

  const getUniqueRacesForTrackDate = (track, date) => {
    const seen = new Set();
    return RacesAndEntries.filter((entry) => {
      const match = entry.Track === track && entry.Date === date;
      const id = entry.RaceID;
      if (match && !seen.has(id)) {
        seen.add(id);
        return true;
      }
      return false;
    });
  };

  const getRaceEntries = (raceID) =>
    RacesAndEntries.filter((entry) => entry.RaceID === raceID);

  const groupedByDate = groupByDateWithUniqueRaces(RacesAndEntries);

  return (
    <div className="mt-8 mb-6 px-4 flex flex-col gap-4">
      {Object.entries(groupedByDate).map(([date, races]) => (
        <div key={date}>
          <Typography variant="h6" className="text-gray-800 font-medium mb-2">
            Racing on {formatDate(date)}
          </Typography>

          {races.map((race, index) => {
            const cardKey = `${race.track}-${race.date}`;
            const isExpanded = expandedKey === cardKey;

            return (
              <div key={index}>
                <Card
                  className="shadow-sm border border-gray-200 mb-1 px-4 py-2 cursor-pointer"
                  onClick={() => toggleExpanded(race.track, race.date)}
                >
                  <CardBody className="p-0 flex items-center justify-between text-sm text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-red-700 font-bold uppercase">{race.track}</span>
                      <span>/ {formatDate(race.date)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span>{race.race_type}</span>
                      <span>{race.session}</span>
                    </div>
                  </CardBody>
                </Card>

                {isExpanded && (
                  <div className="ml-4 mt-2 mb-4 space-y-2">
                    {getUniqueRacesForTrackDate(race.track, race.date).map((entry, i) => (
                      <div key={i}>
                        <div
                          onClick={() => toggleRaceTable(entry.RaceID)}
                          className="flex justify-between items-start bg-white border border-gray-200 px-4 py-3 rounded-md text-sm shadow-sm hover:shadow-md transition cursor-pointer"
                        >
                          <div className="flex flex-col gap-1 max-w-[60%]">
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-900 text-white text-xs font-bold px-2 py-1 rounded">
                                {entry.RaceID}
                              </span>
                              <span className="font-medium">{entry.RaceTime}</span>
                              <span className="font-normal text-gray-700">{entry.RaceTitle}</span>
                                {entry.RaceTitle && !watchedRaceTitles.includes(entry.RaceTitle.trim().toLowerCase()) ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation(); // prevent expand toggle
                                      handleAddToWatchlist(entry);
                                    }}
                                    className="ml-2 px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    +Watch
                                  </button>
                                ) : entry.RaceTitle ? (
                                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-400 text-white rounded">
                                    Watching
                                  </span>
                                ) : null}

                            </div>
                            <span className="text-gray-500">{entry.Status}</span>
                          </div>
                          <div className="flex flex-wrap justify-end gap-x-6 gap-y-1 text-gray-700 text-right">
                            <div><strong>{entry.Distance}</strong></div>
                            <div><strong>{entry.AgeGroup}</strong></div>
                            <div><strong>{entry.Prize}</strong></div>
                            <div><strong>{entry.SF_MF}</strong></div>
                            <div><strong>{entry.FSL}</strong></div>
                            <div><strong>{entry.seq}</strong></div>
                            <div><strong>{entry.Entries}</strong></div>
                          </div>
                        </div>

                        {expandedRaceId === entry.RaceID && (
                          <Card className="bg-white text-black mt-2">
                            <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
                              <table className="w-full min-w-[640px] table-auto">
                                <thead>
                                  <tr>
                                    {[
                                      "Declared",
                                      "No.",
                                      "No_Draw",
                                      "Horse",
                                      "Rider",
                                      "Age",
                                      "Sex",
                                      "Rating",
                                      "Weight",
                                      "Trainer",
                                      "Owner",
                                      "Elim Seq",
                                    ].map((col) => (
                                      <th
                                        key={col}
                                        className="border-b border-blue-gray-50 py-3 px-5 text-left bg-gray-100"
                                      >
                                        <Typography variant="small" className="text-[11px] font-bold uppercase">
                                          {col}
                                        </Typography>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {getRaceEntries(entry.RaceID).map((record, idx) => (
                                    <tr key={idx}>
                                      <td className="py-3 px-5 border-b border-blue-gray-50">
                                        {["true", "1", true, 1].includes(record.Declared?.toString().toLowerCase?.() ?? record.Declared) ? (
                                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded font-bold">
                                                Declared
                                            </span>
                                            ) : (
                                            ""
                                            )}
                                      </td>
                                      {[
                                        record["No."],
                                        record.No_Draw,
                                        <Link
                                          to={`/dashboard/horse/${encodeURIComponent(record.Horse?.trim())}`}
                                          className="text-blue-700 underline hover:text-blue-900"
                                        >
                                          {record.Horse ?? "-"}
                                        </Link>,
                                        record.Rider,
                                        record.Age,
                                        record.Sex,
                                        record.Rating,
                                        record.Weight,
                                        record.Trainer,
                                        record.Owner,
                                        record["Elim Seq"],
                                      ].map((value, i) => (
                                        <td key={i} className="py-3 px-5 border-b border-blue-gray-50">
                                          <Typography className="text-xs font-semibold text-blue-gray-600">
                                            {value !== null && value !== undefined ? value : "-"}
                                          </Typography>
                                        </td>
                                      ))}
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

export default DeclarationsTracking;
