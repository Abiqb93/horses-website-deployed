import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function DailyWatchList() {
  const [watchListItems, setWatchListItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = localStorage.getItem("user");
      const userId = storedUser ? JSON.parse(storedUser).userId : "Guest";
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const results = [];

      try {
        // Fetch tracked horses
        const trackedRes = await fetch(
          `https://horseracesbackend-production.up.railway.app/api/horseTracking?user=${encodeURIComponent(userId)}`
        );
        const trackedJson = await trackedRes.json();
        const trackedNames = [...new Set(trackedJson.data.map(h => h.horseName?.toLowerCase().trim()))];

        // Fetch upcoming races and results
        const sources = [
          { label: "RacesAndEntries", url: "https://horseracesbackend-production.up.railway.app/api/RacesAndEntries" },
          { label: "FranceRaceRecords", url: "https://horseracesbackend-production.up.railway.app/api/FranceRaceRecords" },
          { label: "IrelandRaceRecords", url: "https://horseracesbackend-production.up.railway.app/api/IrelandRaceRecords" },
          { label: "ClosingEntries", url: "https://horseracesbackend-production.up.railway.app/api/ClosingEntries" },
          { label: "DeclarationsTracking", url: "https://horseracesbackend-production.up.railway.app/api/DeclarationsTracking" },
          { label: "EntriesTracking", url: "https://horseracesbackend-production.up.railway.app/api/EntriesTracking" },
        ];

        const fetches = await Promise.all(sources.map(src => fetch(src.url).then(r => r.json())));
        for (let i = 0; i < fetches.length; i++) {
          const label = sources[i].label;
          const data = fetches[i].data || [];

          for (const entry of data) {
            const rawHorseName = entry.Horse || entry["Horse Name"];
            const horseName = rawHorseName?.toLowerCase().trim();
            if (!trackedNames.includes(horseName)) continue;

            const raceTrack = entry.FixtureTrack || entry.Track || entry.Course || entry.Racecourse || entry.track || "-";
            const raceTime = entry.RaceTime || entry.Time || entry.time || "-";
            const raceTitle = entry.RaceTitle || entry.title || entry.Race || "-";

            let dateStr = entry.FixtureDate || entry.Date || entry.date;
            let raceDate;
            if (label === "FranceRaceRecords") {
              const [dd, mm, yyyy] = dateStr.split("/");
              raceDate = new Date(`${yyyy}-${mm}-${dd}`);
            } else if (label === "IrelandRaceRecords") {
              dateStr = dateStr.replace(/^\w+,\s*/, "").replace(/(\d+)(st|nd|rd|th)/, "$1");
              raceDate = new Date(dateStr);
            } else {
              raceDate = new Date(Date.parse(dateStr));
            }
            if (isNaN(raceDate)) continue;

            const encodedHorseName = encodeURIComponent(rawHorseName?.trim() || "");
            const encodedRaceTitle = encodeURIComponent(raceTitle);
            const encodedUrl = encodeURIComponent(sources[i].url);

            results.push({
              type: "race",
              label,
              rawHorseName,
              raceTrack,
              raceTime,
              raceTitle,
              encodedHorseName,
              encodedRaceTitle,
              encodedUrl,
              date: dateStr
            });
          }
        }

        // Fetch recent results
        const recentDates = [0, 1, 2].map(offset => {
          const d = new Date();
          d.setDate(d.getDate() - offset);
          return d.toISOString().split("T")[0];
        });

        const resultsFetches = await Promise.all(
          recentDates.map(date =>
            fetch(`https://horseracesbackend-production.up.railway.app/api/APIData_Table2?meetingDate=${date}`)
              .then(res => res.json())
              .then(json => ({ date, records: json.data || [] }))
          )
        );

        for (const { date, records } of resultsFetches) {
          for (const record of records) {
            const horseName = record.horseName?.toLowerCase().trim();
            if (trackedNames.includes(horseName)) {
              results.push({
                type: "result",
                horseName: record.horseName,
                position: record.positionOfficial,
                raceTitle: record.raceTitle,
                country: record.countryCode,
                track: record.courseName || "-",
                date,
              });
            }
          }
        }

        // ✅ Fetch race_watchlist items
        const watchListRes = await fetch(`https://horseracesbackend-production.up.railway.app/api/race_watchlist/${userId}`);
        const userWatchList = await watchListRes.json();

        userWatchList.forEach((item) => {
          results.push({
            type: "manual",
            id: item.id,
            raceTitle: item.race_title,
            raceDate: item.race_date?.split("T")[0],
            source: item.source_table,
            done: item.done,
          });
        });

        setWatchListItems(results);
      } catch (err) {
        console.error("Daily Watch List Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const markAsDone = async (id) => {
    try {
      const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/race_watchlist/${id}/done`, {
        method: "PATCH"
      });

      if (res.ok) {
        setWatchListItems((prev) =>
          prev.map((item) =>
            item.type === "manual" && item.id === id ? { ...item, done: true } : item
          )
        );
      }
    } catch (err) {
      console.error("Error marking as done:", err);
    }
  };

  const titleCase = (str) => str?.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <h1 className="text-xl font-bold text-yellow-900 mb-4">Daily Watch List</h1>

      {loading ? (
        <p className="text-gray-600 italic">Loading...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-4 space-y-6">

          {/* === UPDATES === */}
          <div>
            <h2 className="text-md font-semibold text-blue-900 mb-2">🔄 Updates</h2>
            <ul className="list-disc list-inside space-y-2">
              {watchListItems
                .filter(item => item.type === "race")
                .map((item, idx) => (
                  <li key={`update-${idx}`} className="text-sm text-gray-800 flex justify-between items-start">
                    <span>
                      <Link
                        to={`/dashboard/horse/${item.encodedHorseName}`}
                        className="text-blue-700 font-medium hover:underline"
                      >
                        {item.rawHorseName}
                      </Link>{" "}
                      is running in{" "}
                      <Link
                        to={`/dashboard/racedetails?url=${item.encodedUrl}&RaceTitle=${item.encodedRaceTitle}`}
                        className="text-indigo-700 hover:underline"
                      >
                        {item.raceTitle}
                      </Link>{" "}
                      at {item.raceTrack} on <strong>{item.date}</strong>
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          {/* === RESULTS === */}
          <div>
            <h2 className="text-md font-semibold text-green-900 mb-2">🏁 Results</h2>
            <ul className="list-disc list-inside space-y-2">
              {watchListItems
                .filter(item => item.type === "result")
                .map((item, idx) => (
                  <li key={`result-${idx}`} className="text-sm text-gray-800 flex justify-between items-start">
                    <span>
                      <Link
                        to={`/dashboard/horse/${encodeURIComponent(item.horseName)}`}
                        className="text-blue-700 font-medium hover:underline"
                      >
                        {titleCase(item.horseName)}
                      </Link>{" "}
                      finished <strong>{item.position}</strong> in{" "}
                      <Link
                        to={`/dashboard/racedetails?url=${encodeURIComponent(`https://horseracesbackend-production.up.railway.app/api/${item.source}`)}&RaceTitle=${encodeURIComponent(item.raceTitle)}&meetingDate=${encodeURIComponent(item.raceDate?.split("T")[0])}`}
                        className="text-indigo-700 hover:underline"
                      >
                        {item.raceTitle}
                      </Link>{" "}
                      on <strong>{item.date}</strong>
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          {/* === WATCHLIST === */}
          <div>
            <h2 className="text-md font-semibold text-gray-900 mb-2">📌 Watchlist</h2>
            <ul className="list-disc list-inside space-y-2">
              {watchListItems
                .filter(item => item.type === "manual")
                .map((item, idx) => (
                  <li
                    key={`manual-${idx}`}
                    className={`text-sm flex justify-between items-start ${
                      item.done ? "text-gray-400 line-through" : "text-gray-800"
                    }`}
                  >
                    <span>
                      <Link
                        to={`/dashboard/racedetails?RaceTitle=${encodeURIComponent(item.raceTitle)}&meetingDate=${encodeURIComponent(item.raceDate?.split("T")[0])}&url=https://horseracesbackend-production.up.railway.app/api/${item.source}`}
                        className="text-indigo-700 hover:underline"
                      >
                        {titleCase(item.raceTitle)}
                      </Link>{" "}
                      on <strong>{item.raceDate}</strong> ({item.source})
                    </span>

                    {!item.done && (
                      <button
                        onClick={() => markAsDone(item.id)}
                        className="ml-4 text-black text-sm hover:underline"
                        title="Mark as done"
                      >
                        ✓
                      </button>
                    )}
                  </li>
                ))}
            </ul>
          </div>

        </div>
      )}
    </div>
  );

}

export default DailyWatchList;
