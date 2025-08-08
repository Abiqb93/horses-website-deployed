import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  BellRing,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Clock,
  Tag,
  Flag
} from "lucide-react";

export function DailyWatchList() {
  const [watchListItems, setWatchListItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [notesMap, setNotesMap] = useState({});

  const [trackingInfoCache, setTrackingInfoCache] = useState({});
  const notesTimeouts = {}; // store timeout refs for debounce

  const sourceDisplayMap = {
    racesandentries: "Racecards & Entries",
    declarationstracking: "Declarations Tracking",
    entriestracking: "Entries Tracking",
    closingentries: "Early Closing Entries",
    irelandracerecords: "Ireland Race Records",
    franceracerecords: "France Race Records"
  };

  const toUKTime = (rawTime, sourceLabel = "") => {
  try {
    if (!rawTime || typeof rawTime !== "string") return "-";
    const cleaned = rawTime.trim().toLowerCase();

    // === 1. France format e.g., 13h30 ===
    if (sourceLabel.toLowerCase() === "franceracerecords" && cleaned.includes("h")) {
        const [hh, mm] = cleaned.split("h").map(Number);
        if (isNaN(hh) || isNaN(mm)) return "-";

        // Construct time in France time zone (Europe/Paris)
        const franceDate = new Date();
        franceDate.setHours(hh, mm, 0);

        // Convert and return in UK local time (Europe/London)
        const ukTime = new Intl.DateTimeFormat("en-GB", {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Europe/London'
        }).format(franceDate);

        return ukTime.toLowerCase();
      }

    // === 2. 24-hour dot format e.g., 14.38 ===
    const dot24Match = cleaned.match(/^(\d{1,2})\.(\d{2})$/);
    if (dot24Match) {
      const hh = parseInt(dot24Match[1]);
      const mm = parseInt(dot24Match[2]);
      const date = new Date();
      date.setHours(hh, mm);
      return date.toLocaleTimeString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).toLowerCase();
    }

    // === 3. Dot + am/pm e.g., 2.38pm ===
    const dotMatch = cleaned.match(/^(\d{1,2})\.(\d{2})(am|pm)$/);
    if (dotMatch) {
      let hh = parseInt(dotMatch[1]);
      const mm = parseInt(dotMatch[2]);
      const meridian = dotMatch[3];

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

    // ✅ 4. Colon format (24-hour like 18:23) → convert to 12-hour
    const colon24Match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
    if (colon24Match) {
      const hh = parseInt(colon24Match[1]);
      const mm = parseInt(colon24Match[2]);
      const date = new Date();
      date.setHours(hh, mm);
      return date.toLocaleTimeString("en-GB", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).toLowerCase();
    }

    // === 5. Colon + am/pm e.g., 2:38pm ===
    const colonMatch = cleaned.match(/^(\d{1,2}):(\d{2})(am|pm)$/);
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

    // === 6. Raw am/pm e.g., 2pm ===
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

    // === 7. Already formatted (e.g., '2:45pm') ===
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
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const todayStr = `${yyyy}-${mm}-${dd}`;

      const results = [];

      try {
        // 🔹 Fetch horse tracking info
        const trackedRes = await fetch(
          `https://horseracesbackend-production.up.railway.app/api/horseTracking?user=${encodeURIComponent(userId)}`
        );
        const trackedJson = await trackedRes.json();
        const trackedData = trackedJson.data || [];

        const trackedNames = [...new Set(trackedData.map(h => h.horseName?.toLowerCase().trim()))];
        const trackingCache = {};
        trackedData.forEach(entry => {
          const key = entry.horseName?.toLowerCase()?.trim();
          if (key) trackingCache[key] = entry;
        });
        setTrackingInfoCache(trackingCache);



        // 🔹 Other Races and Watchlist
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
            const rawTime =
              label === "IrelandRaceRecords"
                ? entry["Race Time"]
                : label === "FranceRaceRecords"
                ? entry.Time || entry.time
                : entry.RaceTime || entry.Time || entry.time || "-";

            const formattedTime = toUKTime(rawTime, label);
            const raceTitle =
              label === "IrelandRaceRecords"
                ? entry["Race Title"]
                : entry.RaceTitle || entry.title || entry.Race || "-";

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
            const ryyyy = raceDate.getFullYear();
            const rmm = String(raceDate.getMonth() + 1).padStart(2, "0");
            const rdd = String(raceDate.getDate()).padStart(2, "0");
            const formattedDate = `${ryyyy}-${rmm}-${rdd}`;
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
              sortTime: rawTime,
              sireName: entry.sireName || entry.Sire || "-",
              damName: entry.damName || entry.Dam || "-",
              ownerFullName: entry.ownerFullName || entry.Owner || "-",
              trainerFullName: entry.trainerFullName || entry.Trainer || "-"
            });
          }
        }

        // 🔹 Watchlist
        const watchListRes = await fetch(`https://horseracesbackend-production.up.railway.app/api/race_watchlist/${userId}`);
        const userWatchList = await watchListRes.json();
        userWatchList.forEach((item) => {
          if (item.race_date?.split("T")[0] === todayStr) {
            results.push({
              type: "manual",
              id: item.id,
              raceTitle: titleCase(item.race_title),
              raceDate: item.race_date?.split("T")[0],
              raceTime: toUKTime(item.race_time),
              sortTime: item.race_time,
              source: item.source_table,
              done: item.done,
              notify: item.notify,
              bookmark: item.bookmark,
              notes: item.notes || ""
            });
          }
        });

        // 🔹 Sort
        const timeToMinutes = (timeStr, source = "") => {
          try {
            if (!timeStr) return 1440;
            const str = timeStr.toLowerCase().trim();

            if (source === "franceracerecords" && str.includes("h")) {
              const [hh, mm] = str.split("h").map(Number);
              return hh * 60 + mm;
            }

            const dotMatch = str.match(/^(\d{1,2})\.(\d{2})(am|pm)?$/);
            if (dotMatch) {
              let [_, h, m, mer] = dotMatch;
              let hh = parseInt(h), mm = parseInt(m);
              if (mer === "pm" && hh < 12) hh += 12;
              if (mer === "am" && hh === 12) hh = 0;
              return hh * 60 + mm;
            }

            const colonMatch = str.match(/^(\d{1,2}):(\d{2})(am|pm)?$/);
            if (colonMatch) {
              let [_, h, m, mer] = colonMatch;
              let hh = parseInt(h), mm = parseInt(m);
              if (mer === "pm" && hh < 12) hh += 12;
              if (mer === "am" && hh === 12) hh = 0;
              return hh * 60 + mm;
            }

            const rawMer = str.match(/^(\d{1,2})(am|pm)$/);
            if (rawMer) {
              let hh = parseInt(rawMer[1]);
              const mer = rawMer[2];
              if (mer === "pm" && hh < 12) hh += 12;
              if (mer === "am" && hh === 12) hh = 0;
              return hh * 60;
            }

            return 1440;
          } catch {
            return 1440;
          }
        };



        results.sort((a, b) => {
          const aMins = timeToMinutes(a.sortTime, a.label || a.source);
          const bMins = timeToMinutes(b.sortTime, b.label || b.source);
          return aMins - bMins;
        });

        // ✅ Sort by date first, then by time
        results.sort((a, b) => {
          const dateA = new Date(a.date || a.meetingDate || a.raceDate || "2100-01-01");
          const dateB = new Date(b.date || b.meetingDate || b.raceDate || "2100-01-01");

          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
          }

          const sourceA = (a.source || a.label || "").toLowerCase();
          const sourceB = (b.source || b.label || "").toLowerCase();

          const timeA = timeToMinutes(a.sortTime || a.raceTime, sourceA);
          const timeB = timeToMinutes(b.sortTime || b.raceTime, sourceB);

          return timeA - timeB;
        });

        setWatchListItems(results);
        setNotesMap(Object.fromEntries(results.filter(i => i.type === "manual").map(i => [i.id, i.notes || ""])));
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


  const toggleBookmark = async (id, currentState) => {
    try {
      const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/race_watchlist/${id}/bookmark`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmark: !currentState }),
      });

      if (res.ok) {
        setWatchListItems(prev =>
          prev.map(item =>
            item.type === "manual" && item.id === id
              ? { ...item, bookmark: !currentState }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    }
  };

  const updateNotes = async (id, notesValue) => {
      try {
        const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/race_watchlist/${id}/notes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notesValue }),
        });

        if (res.ok) {
          setWatchListItems(prev =>
            prev.map(item =>
              item.type === "manual" && item.id === id
                ? { ...item, notes: notesValue }
                : item
            )
          );
        }
      } catch (err) {
        console.error("Error updating notes:", err);
      }
    };

    const handleNotesChange = (id, value) => {
    setNotesMap(prev => ({ ...prev, [id]: value }));

    if (notesTimeouts[id]) clearTimeout(notesTimeouts[id]);

    notesTimeouts[id] = setTimeout(() => {
      updateNotes(id, value);
    }, 600); // Debounce delay in ms
  };

  const formatDate = (input) => {
        const date = new Date(input);
        if (isNaN(date)) return input;
        const dd = String(date.getDate()).padStart(2, "0");
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const yyyy = date.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
      };
return (
  <div className="bg-gray-50 min-h-screen px-2 py-4 sm:px-4 md:px-6 lg:px-8 font-sans text-gray-900">
    <div className="w-full space-y-4 px-2 sm:px-4 md:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">Daily Watch List</h1>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="animate-spin h-4 w-4 text-gray-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span>Loading watch list data...</span>
        </div>
      ) : (
<div className="bg-white rounded-xl shadow-sm p-6">
  <div className="w-full overflow-x-auto">
    <table className="min-w-[1000px] w-full text-xs text-left text-black border border-gray-200 rounded overflow-hidden">
      <thead className="bg-gray-100 uppercase text-gray-700">
        <tr>
          <th className="px-3 py-2">Date</th>
          <th className="px-3 py-2">Time</th>
          <th className="px-3 py-2">Reason</th>
          <th className="px-3 py-2">Horse</th>
          <th className="px-3 py-2">Type</th>
          <th className="px-3 py-2">Race</th>
          <th className="px-3 py-2">Track</th>
          <th className="px-3 py-2 w-[200px]">Notes</th>
          <th className="px-3 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {watchListItems.map((item, idx) => {
          const isManual = item.type === "manual";
          const info = isManual ? {} : trackingInfoCache[item.rawHorseName?.toLowerCase()?.trim()] || {};
          const notesValue = notesMap[item.id] ?? item.notes;
          const sourceKey = (item.source || item.label || "").toLowerCase();
          const displaySource = sourceDisplayMap[sourceKey] || titleCase(item.source || item.label || "-");

          return (
            <tr
              key={`entry-${idx}`}
              className={`border-t ${
                isManual && item.done ? "text-gray-400 line-through bg-gray-50" : "text-black bg-white"
              }`}
            >
              <td className="px-3 py-2 whitespace-nowrap">{formatDate(item.date || item.raceDate)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{item.raceTime}</td>
              <td className="px-3 py-2 text-gray-600 italic">
                {isManual ? `WatchList Record (${displaySource})` : "Tracked Horse Update"}
              </td>
              <td className="px-3 py-2 font-bold text-blue-800 whitespace-nowrap align-top">
                {isManual ? (
                  "-"
                ) : (
                  <>
                    <Link
                      to={`/dashboard/horse/${item.encodedHorseName}`}
                      className="hover:underline"
                      title={item.rawHorseName}
                    >
                      {item.rawHorseName}
                    </Link>
                    <div className="mt-1 text-[10px] text-gray-600 font-normal leading-tight">
                      {info.sireName && <div>{titleCase(info.sireName)} (S)</div>}
                      {info.damName && <div>{titleCase(info.damName)} (D)</div>}
                      {info.ownerFullName && <div>{titleCase(info.ownerFullName)} (O)</div>}
                      {info.trainerFullName && <div>{titleCase(info.trainerFullName)} (T)</div>}
                    </div>

                  </>
                )}
              </td>
              <td className="px-3 py-2">
                {isManual ? displaySource : titleCase(info.TrackingType || "-")}
              </td>
              <td className="px-3 py-2 font-bold text-blue-800 max-w-[180px] truncate">
                <Link
                  to={`/dashboard/racedetails?RaceTitle=${encodeURIComponent(
                    item.raceTitle
                  )}&meetingDate=${encodeURIComponent(item.date || item.raceDate)}&url=https://horseracesbackend-production.up.railway.app/api/${item.source || item.label}`}
                  className="hover:underline"
                >
                  {titleCase(item.raceTitle)}
                </Link>
              </td>
              <td className="px-3 py-2">{titleCase(item.raceTrack || "-")}</td>
              <td className="px-3 py-2 w-[200px] align-top">
                {isManual ? (
                  <textarea
                    rows={2}
                    className="w-full px-2 py-1 border rounded text-xs resize-y text-gray-800"
                    placeholder="Add notes..."
                    value={notesValue}
                    disabled={item.done}
                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                  />
                ) : (
                  "-"
                )}
              </td>
              <td className="px-3 py-2 align-top">
                <div className="flex items-center gap-2">
                  {isManual && !item.bookmark && !item.done && (
                    <button
                      onClick={() => markAsDone(item.id)}
                      className="text-xs text-black hover:underline"
                      title="Mark as done"
                    >
                      ✓ Done
                    </button>
                  )}
                  {isManual && (
                    <>
                      <span
                        className="cursor-pointer"
                        onClick={() => toggleBookmark(item.id, item.bookmark)}
                      >
                        {item.bookmark ? (
                          <BookmarkCheck className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Bookmark className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                        )}
                      </span>
                      <span
                        className="cursor-pointer"
                        onClick={() => toggleNotification(item.id, item.notify)}
                      >
                        {item.notify ? (
                          <BellRing className="w-4 h-4 text-green-500" />
                        ) : (
                          <Bell className="w-4 h-4 text-gray-400 hover:text-green-500" />
                        )}
                      </span>
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
</div>

      )}
    </div>
  </div>
);

}

export default DailyWatchList;
