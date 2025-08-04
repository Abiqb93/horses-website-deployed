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
  const [horseHistoryMap, setHorseHistoryMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [highRatingHorses, setHighRatingHorses] = useState([]);
  const [notesMap, setNotesMap] = useState({});
  const [expandedNotes, setExpandedNotes] = useState({});
  const [trackingInfoCache, setTrackingInfoCache] = useState({});
  const notesTimeouts = {}; // store timeout refs for debounce

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

        // 🔹 Find High-Performance Horses based on multiple logic criteria
        const qualifying = [];
        const historyMap = {};
        const qualifyingReasons = {};

        await Promise.all(
          trackedNames.map(async (horse) => {
            try {
              const res = await fetch(
                `https://horseracesbackend-production.up.railway.app/api/APIData_Table2/horse?horseName=${encodeURIComponent(horse)}`
              );
              const json = await res.json();
              const records = (json.data || []).filter(r => r.meetingDate).sort(
                (a, b) => new Date(a.meetingDate) - new Date(b.meetingDate)
              );

              if (records.length === 0) return;

              const last = records[records.length - 1];
              const penultimate = records.length >= 2 ? records[records.length - 2] : null;

              const ranOver80InFirst3 = records.slice(0, 3).some(
                r => Number(r.performanceRating) > 80
              );

              const improvedMoreThan5 =
                penultimate &&
                Number(last.performanceRating) - Number(penultimate.performanceRating) > 5;

              const hasPSymbol = records.some(
                r => r.preRaceMasterSymbol &&
                r.preRaceMasterSymbol.toLowerCase().includes("p")
              );

              const qualifies = ranOver80InFirst3 || improvedMoreThan5 || hasPSymbol;

              if (qualifies && Number(last.performanceRating) > 90) {
                console.log(`🌟 ${horse} qualifies for High Performance section`);
                qualifying.push(horse);
                historyMap[horse] = last;

                let reason = [];
                if (ranOver80InFirst3) reason.push("Early rating > 80");
                if (improvedMoreThan5) reason.push("Improved > 5");
                if (hasPSymbol) reason.push("'p' in symbol");
                qualifyingReasons[horse] = reason.join("; ");
              }
            } catch (err) {
              console.error(`❌ Error fetching race data for ${horse}:`, err);
            }
          })
        );

        const enriched = qualifying.map(horse => {
          const info = trackingCache[horse] || {};
          const race = historyMap[horse] || {};
          return {
            horseName: horse,
            damName: titleCase(info.damName) || "-",
            sireName: titleCase(info.sireName) || "-",
            ownerFullName: titleCase(info.ownerFullName) || "-",
            trainerFullName: titleCase(info.trainerFullName) || "-",
            performanceRating: race.performanceRating || "-",
            meetingDate: race.meetingDate || "-",
            raceTitle: titleCase(race.raceTitle) || "-",
            qualifyingReason: qualifyingReasons[horse] || "-"
          };
        });

        setHorseHistoryMap(enriched);


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
        const timeToMinutes = (raw, source = "") => {
          try {
            const cleaned = (raw || "").toLowerCase().trim();
            if (source === "FranceRaceRecords" && cleaned.includes("h")) {
              const [hh, mm] = cleaned.split("h").map(Number);
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

        {/* ✅ Updates */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            Updates
          </h2>

          <table className="w-full text-sm text-left text-black border border-gray-200">
              <thead className="bg-gray-100 text-xs uppercase">
                <tr>
                  <th className="px-2 py-2">Horse</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">Sire</th>
                  <th className="px-2 py-2">Dam</th>
                  <th className="px-2 py-2">Owner</th>
                  <th className="px-2 py-2">Trainer</th>
                  <th className="px-2 py-2">Race Title</th>
                  <th className="px-2 py-2">Track</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {watchListItems.filter(item => item.type === "race").map((item, idx) => {
                  const info = trackingInfoCache[item.rawHorseName?.toLowerCase()?.trim()] || {};
                  return (
                    <tr key={`update-${idx}`} className="border-t">
                      <td className="px-2 py-1 text-xs font-semibold uppercase max-w-[100px] truncate">
                        <Link
                          to={`/dashboard/horse/${item.encodedHorseName}`}
                          className="hover:underline block"
                          title={item.rawHorseName}
                        >
                          {item.rawHorseName}
                        </Link>
                      </td>

                      <td className="px-2 py-1 text-xs">{titleCase(info.TrackingType) || "-"}</td>
                      <td className="px-2 py-1 text-xs">{titleCase(info.sireName) || "-"}</td>
                      <td className="px-2 py-1 text-xs">{titleCase(info.damName) || "-"}</td>
                      <td className="px-2 py-1 text-xs">{titleCase(info.ownerFullName) || "-"}</td>
                      <td className="px-2 py-1 text-xs">{titleCase(info.trainerFullName) || "-"}</td>
                      <td className="px-2 py-1 text-xs">
                        <Link
                          to={`/dashboard/racedetails?url=${item.encodedUrl}&RaceTitle=${item.encodedRaceTitle}`}
                          className="hover:underline text-blue-600"
                        >
                          {titleCase(item.raceTitle)}
                        </Link>
                      </td>
                      <td className="px-2 py-1 text-xs">{titleCase(item.raceTrack) || "-"}</td>
                      <td className="px-2 py-1 text-xs">{formatDate(item.date)}</td>
                      <td className="px-2 py-1 text-xs">{item.raceTime}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

        </div>

        {/* 📌 Watchlist Runners */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            Watchlist Runners
          </h2>

          <div className="overflow-x-auto">
  <table className="w-full text-sm text-left text-black border border-gray-200">
    <thead className="bg-gray-100 text-xs uppercase">
      <tr>
        <th className="px-2 py-2">Race</th>
        <th className="px-2 py-2">Date</th>
        <th className="px-2 py-2">Time</th>
        <th className="px-2 py-2">Source</th>
        <th className="px-2 py-2">Notes</th>
        <th className="px-2 py-2">Actions</th>
      </tr>
    </thead>
    <tbody>
      {watchListItems.filter(item => item.type === "manual").map((item, idx) => (
        <tr key={`manual-${idx}`} className={`${item.done ? "text-gray-400 line-through" : "text-black"} border-t`}>
          <td className="px-2 py-1 text-xs max-w-[160px] truncate">
            <Link
              to={`/dashboard/racedetails?RaceTitle=${encodeURIComponent(item.raceTitle)}&meetingDate=${encodeURIComponent(item.raceDate)}&url=https://horseracesbackend-production.up.railway.app/api/${item.source}`}
              className="hover:underline block"
              title={titleCase(item.raceTitle)}
            >
              {titleCase(item.raceTitle)}
            </Link>
          </td>
          <td className="px-2 py-1 text-xs">{formatDate(item.raceDate)}</td>
          <td className="px-2 py-1 text-xs">{item.raceTime}</td>
          <td className="px-2 py-1 text-xs">{item.source}</td>
          <td className="px-2 py-1">
            <textarea
              rows={1}
              className="w-full px-2 py-1 border rounded text-xs text-gray-700 resize-none"
              placeholder="Add notes..."
              value={notesMap[item.id] ?? item.notes}
              disabled={item.done}
              onChange={(e) => handleNotesChange(item.id, e.target.value)}
            />
          </td>
          <td className="px-2 py-1 text-xs flex gap-2 items-center">
            {!item.bookmark && !item.done && (
              <button
                onClick={() => markAsDone(item.id)}
                className="text-black text-xs hover:underline"
                title="Mark as done"
              >
                ✓ Done
              </button>
            )}
            <span
              className="cursor-pointer"
              onClick={() => toggleBookmark(item.id, item.bookmark)}
              title={item.bookmark ? "Bookmarked" : "Add Bookmark"}
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
              title={item.notify ? "Notifications enabled" : "Enable notifications"}
            >
              {item.notify ? (
                <BellRing className="w-4 h-4 text-green-500" />
              ) : (
                <Bell className="w-4 h-4 text-gray-400 hover:text-green-500" />
              )}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

        </div>

        {/* 📊 Yesterday's APIData_Table2 Records */}
<div className="bg-white rounded-xl shadow-sm p-6 mt-6">
  <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
    Review List
  </h2>

  <div className="divide-y divide-gray-100">
    {Array.isArray(horseHistoryMap) && horseHistoryMap.length > 0 ? (
      horseHistoryMap.map((entry, idx) => {
        const key = entry.horseName?.toLowerCase()?.trim();
        const tracking = trackingInfoCache[key] || {};
        const encodedHorseName = encodeURIComponent(entry.horseName?.trim());
        const formattedDateOnly = entry.meetingDate?.slice(0, 10);
        const encodedDate = encodeURIComponent(formattedDateOnly);
        const encodedRaceTitle = encodeURIComponent(entry.raceTitle?.trim());
        const encodedUrl = encodeURIComponent("https://horseracesbackend-production.up.railway.app/api/APIData_Table2");

        return (
          <div key={`highperf-${idx}`} className="py-4 space-y-1 text-gray-800">
            {/* HORSE NAME */}
            <h3 className="font-bold text-black uppercase text-base flex items-center gap-1 flex-wrap">
              <Link to={`/dashboard/horse/${encodedHorseName}`} className="hover:underline">
                {entry.horseName}
              </Link>

              <sup className="flex items-center gap-1">
                {tracking.TrackingType && (
                  <span className="bg-gray-200 text-gray-800 text-[10px] px-1.5 py-[1px] rounded-full leading-tight">
                    {tracking.TrackingType}
                  </span>
                )}
                {tracking.note && (
                  <button
                    onClick={() =>
                      setExpandedNotes(prev => ({
                        ...prev,
                        [encodedHorseName]: !prev[encodedHorseName],
                      }))
                    }
                    className="text-blue-600 text-[10px] hover:underline"
                  >
                    [notes]
                  </button>
                )}
              </sup>
            </h3>

            {/* Notes section */}
            {expandedNotes[encodedHorseName] && tracking.note && (
              <div className="text-xs text-black pl-4 mt-1">{tracking.note}</div>
            )}

            {/* Metadata and Race Info */}
            <div className="pl-4 text-sm text-black space-y-1 mt-1">
              {(() => {
                const meta = [];
                if (entry.sireName) meta.push(`${entry.sireName} (S)`);
                if (entry.damName) meta.push(`${entry.damName} (D)`);
                if (entry.ownerFullName) meta.push(`${entry.ownerFullName} (O)`);
                if (entry.trainerFullName) meta.push(`${entry.trainerFullName} (T)`);
                return meta.length > 0 ? (
                  <div className="text-xs text-black">{meta.join(" | ")}</div>
                ) : null;
              })()}

              {/* Race Title */}
              <div className="flex items-center gap-2 mt-1">
                <Flag className="w-4 h-4 text-gray-400" />
                <Link
                  to={`/dashboard/racedetails?url=${encodedUrl}&RaceTitle=${encodedRaceTitle}&meetingDate=${encodedDate}`}
                  className="hover:underline text-indigo-700"
                >
                  {entry.raceTitle}
                </Link>
              </div>

              {/* Date, Time, Rating */}
              <div className="flex gap-4 items-center flex-wrap">
                <span>
                  <Calendar className="w-4 h-4 text-gray-400 mr-1 inline" />
                  {formatDate(entry.meetingDate)}
                </span>

                {entry.scheduledTimeOfRaceLocal && (
                  <span>
                    <Clock className="w-4 h-4 text-gray-400 mr-1 inline" />
                    {new Date(entry.scheduledTimeOfRaceLocal).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                      timeZone: "Europe/London",
                    })}
                  </span>
                )}

                {entry.performanceRating && (
                  <span className="text-green-700 font-semibold text-sm">
                    Rating: {entry.performanceRating}
                  </span>
                )}
              </div>

              {/* Qualifying Reason */}
              {entry.qualifyingReason && (
                <div className="text-xs italic text-gray-600 mt-1">
                  Reason: {entry.qualifyingReason}
                </div>
              )}
            </div>
          </div>
        );
      })
    ) : (
      <p className="text-gray-500 text-sm">No high performance records found.</p>
    )}
  </div>
</div>














      </div>
    </div>
  );

}

export default DailyWatchList;
