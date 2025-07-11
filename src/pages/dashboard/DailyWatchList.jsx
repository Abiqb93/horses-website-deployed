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
      const yyyyToday = today.getFullYear();
      const mmToday = String(today.getMonth() + 1).padStart(2, "0");
      const ddToday = String(today.getDate()).padStart(2, "0");
      const todayStr = `${yyyyToday}-${mmToday}-${ddToday}`;

      const results = [];

      try {
        const trackedRes = await fetch(
          `https://horseracesbackend-production.up.railway.app/api/horseTracking?user=${encodeURIComponent(userId)}`
        );
        const trackedJson = await trackedRes.json();
        const trackedNames = [...new Set(trackedJson.data.map(h => h.horseName?.toLowerCase().trim()))];

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
            raceDate.setHours(0, 0, 0, 0); // force local midnight
            const yyyy = raceDate.getFullYear();
            const mm = String(raceDate.getMonth() + 1).padStart(2, "0");
            const dd = String(raceDate.getDate()).padStart(2, "0");
            const formattedDate = `${yyyy}-${mm}-${dd}`;

            if (formattedDate !== todayStr) continue;

            results.push({
              type: "race",
              label,
              rawHorseName,
              raceTrack,
              raceTime,
              raceTitle,
              encodedHorseName: encodeURIComponent(rawHorseName?.trim() || ""),
              encodedRaceTitle: encodeURIComponent(raceTitle),
              encodedUrl: encodeURIComponent(sources[i].url),
              date: formattedDate,
            });
          }
        }

        // Watchlist
        const watchListRes = await fetch(`https://horseracesbackend-production.up.railway.app/api/race_watchlist/${userId}`);
        const userWatchList = await watchListRes.json();

        userWatchList.forEach((item) => {
          if (item.race_date?.split("T")[0] === todayStr) {
            results.push({
              type: "manual",
              id: item.id,
              raceTitle: item.race_title,
              raceDate: item.race_date?.split("T")[0],
              source: item.source_table,
              done: item.done,
            });
          }
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
                .sort((a, b) => (a.raceTime || "").localeCompare(b.raceTime || ""))
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
                      at {item.raceTrack} on <strong>{item.date}</strong> at <strong>{item.raceTime}</strong>
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
                        to={`/dashboard/racedetails?RaceTitle=${encodeURIComponent(item.raceTitle)}&meetingDate=${encodeURIComponent(item.raceDate)}&url=https://horseracesbackend-production.up.railway.app/api/${item.source}`}
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
