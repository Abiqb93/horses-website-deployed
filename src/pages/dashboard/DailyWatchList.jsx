import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  BellRing,
  Flag,
  MapPin,
  Calendar,
  Clock,
  Tag,
  Check
} from "lucide-react";

export function DailyWatchList() {
  const [watchListItems, setWatchListItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const toUKTime = (rawTime, sourceLabel = "") => {
    try {
      if (!rawTime || typeof rawTime !== "string") return "-";
      const cleaned = rawTime.trim().toLowerCase();

      // === 1. France format e.g., 13h30 ===
      if (sourceLabel === "FranceRaceRecords" && cleaned.includes("h")) {
        const [hh, mm] = cleaned.split("h").map(Number);
        if (isNaN(hh) || isNaN(mm)) return "-";
        const date = new Date();
        date.setHours(hh, mm);
        return date.toLocaleTimeString("en-GB", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).toLowerCase();
      }

      // === 2. Dot format (with or without am/pm) e.g., 2.38pm or 14.38
      const dotMatch = cleaned.match(/^(\d{1,2})\.(\d{2})(am|pm)?$/);
      if (dotMatch) {
        let hh = parseInt(dotMatch[1]);
        const mm = parseInt(dotMatch[2]);
        const meridian = dotMatch[3];

        // If am/pm exists, convert manually
        if (meridian === "pm" && hh < 12) hh += 12;
        if (meridian === "am" && hh === 12) hh = 0;

        const date = new Date();
        date.setHours(hh, mm);
        return date.toLocaleTimeString("en-GB", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).toLowerCase();
      }

      // === 3. Colon format (24h or 12h) ===
      const colonMatch = cleaned.match(/^(\d{1,2}):(\d{2})(am|pm)?$/);
      if (colonMatch) {
        let hh = parseInt(colonMatch[1]);
        const mm = parseInt(colonMatch[2]);
        const meridian = colonMatch[3];

        if (meridian === "pm" && hh < 12) hh += 12;
        if (meridian === "am" && hh === 12) hh = 0;

        const date = new Date();
        date.setHours(hh, mm);
        return date.toLocaleTimeString("en-GB", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).toLowerCase();
      }

      // === 4. Raw am/pm without formatting → normalize (e.g., 2pm or 11am)
      const rawMeridianMatch = cleaned.match(/^(\d{1,2})(am|pm)$/);
      if (rawMeridianMatch) {
        let hh = parseInt(rawMeridianMatch[1]);
        const mm = 0;
        const meridian = rawMeridianMatch[2];

        if (meridian === "pm" && hh < 12) hh += 12;
        if (meridian === "am" && hh === 12) hh = 0;

        const date = new Date();
        date.setHours(hh, mm);
        return date.toLocaleTimeString("en-GB", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).toLowerCase();
      }

      // === 5. Already formatted (e.g., '5:20 pm') — return as-is
      if (cleaned.includes("am") || cleaned.includes("pm")) {
        return cleaned.replace(/\s*/g, "").replace("am", " am").replace("pm", " pm");
      }

      return cleaned;
    } catch {
      return "-";
    }
  };

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
            const rawTime = entry.RaceTime || entry.Time || entry.time || "-";
            const formattedTime = toUKTime(rawTime, label);

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
            raceDate.setHours(0, 0, 0, 0);
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
              raceTime: formattedTime,
              raceTitle,
              encodedHorseName: encodeURIComponent(rawHorseName?.trim() || ""),
              encodedRaceTitle: encodeURIComponent(raceTitle),
              encodedUrl: encodeURIComponent(sources[i].url),
              date: formattedDate,
              sortTime: rawTime
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
              raceTime: toUKTime(item.race_time),
              sortTime: item.race_time,
              source: item.source_table,
              done: item.done,
              notify: item.notify
            });
          }
        });

        // Sorting based on time in minutes since midnight
        const timeToMinutes = (raw, source = "") => {
          try {
            const cleaned = (raw || "").toLowerCase().trim();

            if (source === "FranceRaceRecords" && cleaned.includes("h")) {
              const [hh, mm] = cleaned.split("h").map(Number);
              return hh * 60 + mm;
            }

            const dotMatch = cleaned.match(/^(\d{1,2})\.(\d{2})(am|pm)?$/);
            if (dotMatch) {
              let hh = parseInt(dotMatch[1]);
              const mm = parseInt(dotMatch[2]);
              const meridian = dotMatch[3];
              if (meridian === "pm" && hh < 12) hh += 12;
              if (meridian === "am" && hh === 12) hh = 0;
              return hh * 60 + mm;
            }

            const colonMatch = cleaned.match(/^(\d{1,2}):(\d{2})(am|pm)?$/);
            if (colonMatch) {
              let hh = parseInt(colonMatch[1]);
              const mm = parseInt(colonMatch[2]);
              const meridian = colonMatch[3];
              if (meridian === "pm" && hh < 12) hh += 12;
              if (meridian === "am" && hh === 12) hh = 0;
              return hh * 60 + mm;
            }

            const meridianOnly = cleaned.match(/^(\d{1,2})(am|pm)$/);
            if (meridianOnly) {
              let hh = parseInt(meridianOnly[1]);
              const mm = 0;
              const meridian = meridianOnly[2];
              if (meridian === "pm" && hh < 12) hh += 12;
              if (meridian === "am" && hh === 12) hh = 0;
              return hh * 60;
            }

            return 1440; // fallback = end of day
          } catch {
            return 1440;
          }
        };

        results.sort((a, b) => {
          const aMins = timeToMinutes(a.sortTime, a.label || a.source);
          const bMins = timeToMinutes(b.sortTime, b.label || b.source);
          return aMins - bMins;
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

  const toggleNotification = async (id, notifyState) => {
    try {
      const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/race_watchlist/${id}/notify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notify: !notifyState }),
      });

      if (res.ok) {
        setWatchListItems((prev) =>
          prev.map((item) =>
            item.type === "manual" && item.id === id
              ? { ...item, notify: !notifyState }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Error toggling notification:", err);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen px-2 py-4 sm:px-4 md:px-6 lg:px-8 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Daily Watch List</h1>

        {/* ✅ Updates */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            Updates
          </h2>

          <div className="divide-y divide-gray-100">
            {watchListItems.filter(item => item.type === "race").map((item, idx) => (
              <div
                key={`update-${idx}`}
                className="py-4 space-y-1 text-gray-800"
              >
                <h3 className="font-semibold flex items-center gap-2">
                  {" "}
                  <Link
                    to={`/dashboard/horse/${item.encodedHorseName}`}
                    className="text-blue-700 hover:underline"
                  >
                    {item.rawHorseName}
                  </Link>
                </h3>

                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span><Flag className="w-4 h-4 text-gray-400" /></span>
                  <Link
                    to={`/dashboard/racedetails?url=${item.encodedUrl}&RaceTitle=${item.encodedRaceTitle}`}
                    className="text-blue-600 hover:underline"
                  >
                    {item.raceTitle}
                  </Link>
                </p>

                <div className="flex text-sm text-gray-500 gap-4 mt-1">
                  <span><Tag className="w-4 h-4 text-gray-400 mr-1 inline" /> {item.raceTrack}</span>
                  <span><Calendar className="w-4 h-4 text-gray-400 mr-1 inline" /> {item.date}</span>
                  <span><Clock className="w-4 h-4 text-gray-400 mr-1 inline" /> {item.raceTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 📌 Watchlist Runners */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            Watchlist Runners
          </h2>

          <div className="divide-y divide-gray-100 space-y-2">
            {watchListItems.filter(item => item.type === "manual").map((item, idx) => (
              <div
                key={`manual-${idx}`}
                className={`relative py-4 space-y-1 pr-10 ${item.done ? "text-gray-400 line-through" : "text-gray-800"}`}
              >
                {/* Bell icon in top-right */}
                {!item.done && (
                  <span
                    className="absolute top-2 right-2 cursor-pointer"
                    onClick={() => toggleNotification(item.id, item.notify)}
                    title={item.notify ? "Notifications enabled" : "Enable notifications"}
                  >
                    {item.notify ? (
                      <BellRing size={20} className="text-green-500 transition-colors duration-200" />
                    ) : (
                      <Bell size={20} className="text-gray-400 transition-colors duration-200" />
                    )}
                  </span>
                )}
                <h3 className="font-semibold flex items-center gap-2">
                  {" "}
                  <Link
                    to={`/dashboard/racedetails?RaceTitle=${encodeURIComponent(item.raceTitle)}&meetingDate=${encodeURIComponent(item.raceDate)}&url=https://horseracesbackend-production.up.railway.app/api/${item.source}`}
                    className="hover:underline text-blue-700"
                  >
                    {titleCase(item.raceTitle)}
                  </Link>
                </h3>

                <div className="flex text-sm text-gray-500 gap-4 mt-1">
                  <span><Calendar className="w-4 h-4 text-gray-400 mr-1 inline" /> {item.raceDate}</span>
                  <span><Clock className="w-4 h-4 text-gray-400 mr-1 inline" /> {item.raceTime}</span>
                  <span>🔖 {item.source}</span>
                </div>

                {!item.done && (
                  <>
                    <button
                      onClick={() => markAsDone(item.id)}
                      className="text-black text-sm hover:underline"
                      title="Mark as done"
                    >
                      ✓ Mark as Done
                    </button>

                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

}

export default DailyWatchList;
