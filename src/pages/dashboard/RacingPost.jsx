import React, { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { Link } from "react-router-dom";

// --- helpers ---
const formatToMySQLDate = (input) => {
  const d = new Date(input);
  if (isNaN(d)) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const dateOnlyISO = (input) => {
  const d = new Date(input);
  if (isNaN(d)) return input;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const normalizeSpaces = (str) =>
  typeof str === "string" ? str.replace(/\s{2,}/g, " ").trim() : str;

// --- component ---
export function RacingPost() {
  const [rows, setRows] = useState([]); // normalized RacingPost rows
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
      const titles = Array.isArray(data) ? data.map((x) => x.race_title) : [];
      setWatchedRaceTitles(titles);
    } catch (err) {
      console.error("Error fetching watchlist races:", err);
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch("https://horseracesbackend-production.up.railway.app/api/racingpost");
      const data = await res.json();
      const raw = Array.isArray(data) ? data : data.data || [];

      // Normalize each RacingPost row with the fields your UI expects
      const normalized = raw.map((r) => ({
        ...r, // keep original fields for the inner table
        FixtureTrack: r.racecourse ?? null,
        FixtureDate: dateOnlyISO(r.raceDateISO ?? null),
        RaceID: r.raceId ?? null,
        RaceTime: r.timeLabel ?? null,
        RaceTitle: r.raceTitle ?? null,
        AgeGroup: r.ageBand ?? null,
        Distance: r.distance ?? null,
        RaceClass: r.raceClass ?? null,
        Runners: r.runners ?? null,
        TV: r.tv ?? null,
        Going: r.rawGoingText ?? null,
        Status: r.raceIsOver ? "Finished" : "Scheduled",
      }));

      setRows(normalized);
    } catch (error) {
      console.error("Error fetching RacingPost data:", error);
      setRows([]);
    }
  };

  const storedUser = localStorage.getItem("user");
  const userId = storedUser ? JSON.parse(storedUser).userId : null;

  const handleAddToWatchlist = async (race) => {
    if (!userId) {
      alert("Please log in to add to your watch list.");
      return;
    }

    const payload = {
      user_id: userId,
      race_title: race.RaceTitle,
      race_date: formatToMySQLDate(race.FixtureDate),
      race_time: race.RaceTime,
      track: race.FixtureTrack ?? null,
      source_table: "RacingPost",
    };

    try {
      const res = await fetch("https://horseracesbackend-production.up.railway.app/api/race_watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setWatchedRaceTitles((prev) => [...prev, race.RaceTitle]);
      } else {
        const errText = await res.text();
        console.error("Watchlist add failed:", errText);
      }
    } catch (error) {
      console.error("Error adding to watch list:", error);
    }
  };

  // --- grouping & UI helpers ---
  const formatDateLong = (dateStr) => {
    if (!dateStr) return "";
    const cleaned = normalizeSpaces(dateStr);
    const d = new Date(cleaned);
    if (isNaN(d)) return cleaned;
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const groupByDateWithUniqueTracks = (data) => {
    // Create buckets of unique (track, date)
    const grouped = {};
    const seenPairs = new Set();

    data.forEach((item) => {
      const track = item.FixtureTrack;
      const date = item.FixtureDate;
      if (!track || !date) return;

      const key = `${track}__${date}`;
      if (!seenPairs.has(key)) {
        seenPairs.add(key);
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push({ track, date });
      }
    });

    return grouped;
  };

  const toggleExpanded = (track, date) => {
    const key = `${track}__${date}`;
    setExpandedKey((prev) => (prev === key ? null : key));
    setExpandedRaceId(null);
  };

  const toggleRaceTable = (raceID) => {
    setExpandedRaceId((prev) => (prev === raceID ? null : raceID));
  };

  const getUniqueRacesForTrackDate = (track, date) => {
    const seen = new Set();
    return rows.filter((r) => {
      const match =
        r.FixtureTrack === track &&
        r.FixtureDate === date &&
        r.RaceID != null;
      if (!match) return false;
      if (seen.has(r.RaceID)) return false;
      seen.add(r.RaceID);
      return true;
    });
  };

  const getRaceEntries = (raceID) => rows.filter((r) => r.RaceID === raceID);

  const groupedByDate = groupByDateWithUniqueTracks(rows);

  return (
    <div className="mt-8 mb-6 px-4 flex flex-col gap-4">
      {Object.entries(groupedByDate).map(([date, tracks]) => (
        <div key={date}>
          <Typography variant="h6" className="text-gray-800 font-medium mb-2">
            Racing on {formatDateLong(date)}
          </Typography>

          {tracks.map((t, idx) => {
            const cardKey = `${t.track}__${t.date}`;
            const isExpanded = expandedKey === cardKey;

            return (
              <div key={cardKey}>
                <Card
                  className="shadow-sm border border-gray-200 mb-1 px-4 py-2 cursor-pointer"
                  onClick={() => toggleExpanded(t.track, t.date)}
                >
                  <CardBody className="p-0 flex items-center justify-between text-sm text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-red-700 font-bold uppercase">{t.track}</span>
                      <span>/ {formatDateLong(t.date)}</span>
                    </div>
                    {/* For RacingPost we don't have 'Session'/'RaceType' per track/day; keep this area minimal */}
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">Racing Post</span>
                    </div>
                  </CardBody>
                </Card>

                {isExpanded && (
                  <div className="ml-4 mt-2 mb-4 space-y-2">
                    {getUniqueRacesForTrackDate(t.track, t.date).map((entry) => (
                      <div key={entry.RaceID}>
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

                              {/* +Watch Button */}
                              {!watchedRaceTitles.includes(entry.RaceTitle) ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToWatchlist(entry);
                                  }}
                                  className="ml-2 px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  +Watch
                                </button>
                              ) : (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-400 text-white rounded">
                                  Watching
                                </span>
                              )}
                            </div>
                            <span className="text-gray-500">
                              {entry.Status}
                              {entry.Going ? ` • Going: ${entry.Going}` : ""}
                              {entry.TV ? ` • TV: ${entry.TV}` : ""}
                            </span>
                          </div>

                          {/* Right-side compact meta (RacingPost fields) */}
                          <div className="flex flex-wrap justify-end gap-x-6 gap-y-1 text-gray-700 text-right">
                            {entry.Distance ? <div><strong>{entry.Distance}</strong></div> : null}
                            {entry.AgeGroup ? <div><strong>{entry.AgeGroup}</strong></div> : null}
                            {entry.RaceClass ? <div><strong>Class {entry.RaceClass}</strong></div> : null}
                            {entry.Runners ? <div><strong>{entry.Runners} runners</strong></div> : null}
                            {entry.TV ? <div><strong>{entry.TV}</strong></div> : null}
                            {entry.Going ? <div><strong>{entry.Going}</strong></div> : null}
                          </div>
                        </div>

                        {expandedRaceId === entry.RaceID && (
                          <Card className="bg-white text-black mt-2">
                            <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
                              <table className="w-full min-w-[640px] table-auto">
                                <thead>
                                  <tr>
                                    {[
                                      "No.",
                                      "Draw",
                                      "Horse",
                                      "Jockey",
                                      "Age",
                                      "Color/Sex",
                                      "Official Rating",
                                      "Weight",
                                      "Trainer",
                                      "Owner",
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
                                  {getRaceEntries(entry.RaceID).map((rec, idx) => {
                                    const rating =
                                      rec.officialRating ??
                                      rec.RPR ??
                                      rec.TS ??
                                      "-";
                                    const weight =
                                      rec.weight ??
                                      (rec.weight_lbs ? `${rec.weight_lbs} lbs` : "-");

                                    return (
                                      <tr key={`${rec.raceId}-${idx}`}>
                                        {[
                                          rec.number ?? "-",
                                          rec.draw ?? "-",
                                          <Link
                                            to={`/dashboard/horse/${encodeURIComponent((rec.horseName ?? "-").trim())}`}
                                            className="text-blue-700 underline hover:text-blue-900"
                                          >
                                            {rec.horseName ?? "-"}
                                          </Link>,
                                          rec.jockey ?? "-",
                                          rec.age ?? "-",
                                          rec.colorSex ?? "-",
                                          rating,
                                          weight,
                                          rec.trainer ?? "-",
                                          rec.owner ?? "-",
                                        ].map((value, i) => (
                                          <td key={i} className="py-3 px-5 border-b border-blue-gray-50">
                                            <Typography className="text-xs font-semibold text-blue-gray-600">
                                              {value}
                                            </Typography>
                                          </td>
                                        ))}
                                      </tr>
                                    );
                                  })}
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

export default RacingPost;
