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

const hk = (s) => s?.toLowerCase()?.trim();

import { useRef } from "react";

function useDebounce(callback, delay) {
  const timerRef = useRef(null);

  return (...args) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}


export function DailyWatchList() {
  const [watchListItems, setWatchListItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [notesMap, setNotesMap] = useState({});

  const [trackingInfoCache, setTrackingInfoCache] = useState({});


  const [trackedNotesMap, setTrackedNotesMap] = useState({});     // { horseKey: textarea value }
  const [trackedNotesOpen, setTrackedNotesOpen] = useState({});   // { horseKey: boolean }
  const [trackedNotesList, setTrackedNotesList] = useState({});   // { horseKey: [{note, trackingDate}, ...] }

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

        // set of tracked names, normalized
        const trackedNames = [...new Set(trackedData.map(h => hk(h.horseName)))];

        // Build a cache keyed by lowercased horse name, merging flags + metadata
        const trackingCache = {};
        trackedData.forEach(entry => {
          const key = hk(entry.horseName);
          if (!key) return;

          // keep latest/merged values
          const cur = trackingCache[key] || {};
          trackingCache[key] = {
            ...cur,
            // flags (0/1)
            bookmark: entry.bookmark ?? cur.bookmark ?? 0,
            notify:   entry.notify   ?? cur.notify   ?? 0,
            done:     entry.done     ?? cur.done     ?? 0,

            // metadata used in table
            TrackingType: entry.TrackingType ?? cur.TrackingType,
            sireName: entry.sireName ?? cur.sireName,
            damName: entry.damName ?? cur.damName,
            ownerFullName: entry.ownerFullName ?? cur.ownerFullName,
            trainerFullName: entry.trainerFullName ?? cur.trainerFullName,
          };
        });

        const latestNoteByHorse = {};
          trackedData.forEach(entry => {
            const key = hk(entry.horseName);
            if (!key) return;
            const t = new Date(entry.noteDateTime || entry.trackingDate || 0).getTime();
            if (!latestNoteByHorse[key] || t > latestNoteByHorse[key].ts) {
              latestNoteByHorse[key] = { ts: t, text: entry.note || "" };
            }
          });
          setTrackedNotesMap(prev => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(latestNoteByHorse).map(([k, v]) => [k, v.text || ""])
            )
          }));
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
            // 👇 Skip if this tracked horse is already done=1
            if ((trackingCache[horseName]?.done ?? 0) === 1) continue;

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
              // ✅ set raceTrack for watchlist rows
              raceTrack: titleCase(item.track || item.FixtureTrack || "-"),
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

// ===== NOTIFY API HELPERS (ADD) =====
const getUserId = () => {
  const storedUser = localStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser).userId : "Guest";
};

// Build payload for /api/notify_horses from a table "row"
const buildNotifyPayload = (row, isManual) => {
  const user_id = getUserId();
  const rec_date = (row.date || row.raceDate);                // already YYYY-MM-DD in your code
  const rec_time = row.raceTime || row.sortTime || "-";       // keep whatever is shown
  const track    = row.raceTrack ? String(row.raceTrack) : "-";
  const horse    = isManual ? (row.horseName || "-") : (row.rawHorseName || "-");
  const type     = isManual ? (row.source || row.label || "Watchlist") : (row.TrackingType || "Tracked");
  const race     = row.raceTitle || "-";
  const source   = (row.source || row.label || null);

  return { user_id, rec_date, rec_time, track, horse, type: String(type), race, source };
};

const apiAddNotify = async (payload) => {
  await fetch(`https://horseracesbackend-production.up.railway.app/api/notify_horses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

const apiDeleteNotifyByKeys = async (payload) => {
  const body = {
    user_id: payload.user_id,
    rec_date: payload.rec_date,
    rec_time: payload.rec_time,
    track: payload.track,
    horse: payload.horse,
    race: payload.race
  };
  await fetch(`https://horseracesbackend-production.up.railway.app/api/notify_horses/by-keys`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};
// ===== END NOTIFY API HELPERS =====


  const toggleNotification = async (id, notifyState) => {
  try {
    const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/race_watchlist/${id}/notify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notify: !notifyState }),
    });

    if (res.ok) {
      setWatchListItems((prev) => {
        const next = prev.map((item) =>
          item.type === "manual" && item.id === id
            ? { ...item, notify: !notifyState }
            : item
        );

        // Build payload for notify_horses from the updated row
        const row = next.find((x) => x.type === "manual" && x.id === id);
        if (row) {
          const payload = buildNotifyPayload(row, true /* isManual */);
          if (!notifyState) {
            // turning ON -> add
            apiAddNotify(payload).catch(console.error);
          } else {
            // turning OFF -> delete
            apiDeleteNotifyByKeys(payload).catch(console.error);
          }
        }
        return next;
      });
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
    

    // Debounced wrappers (one for watchlist notes, one for tracked-horse notes)
const debouncedUpdateWatchlistNote = useDebounce((id, value) => {
  updateNotes(id, value);
}, 700); // adjust delay if you like (e.g., 500-800ms)

const debouncedPostTrackedNote = useDebounce((rawHorseName, value) => {
  postTrackedNote(rawHorseName, value);
}, 700);


  const handleNotesChange = (id, value) => {
  setNotesMap(prev => ({ ...prev, [id]: value }));
  debouncedUpdateWatchlistNote(id, value);
};

  // ✅ Mark tracked horse as done (done=1) for ALL rows of this user+horse
const markTrackedHorseDone = async (rawHorseName) => {
  const storedUser = localStorage.getItem("user");
  const userId = storedUser ? JSON.parse(storedUser).userId : "Guest";
  const key = hk(rawHorseName);

  try {
    const res = await fetch(
      `https://horseracesbackend-production.up.railway.app/api/horseTracking/${encodeURIComponent(rawHorseName)}/flags?user=${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: 1 }),
      }
    );

    if (res.ok) {
  // optimistic cache update
    setTrackingInfoCache(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), done: 1 }
    }));

    // 👇 NEW: remove all tracked rows for this horse from the table
    setWatchListItems(prev =>
      prev.filter(
        it => !(it.type === "race" && hk(it.rawHorseName) === key)
      )
    );
  }
  } catch (err) {
    console.error("Error marking tracked horse as done:", err);
  }
};

const toggleTrackedHorseBookmark = async (rawHorseName, current) => {
  const storedUser = localStorage.getItem("user");
  const userId = storedUser ? JSON.parse(storedUser).userId : "Guest";
  const key = hk(rawHorseName);
  const next = current ? 0 : 1;

  try {
    const res = await fetch(
      `https://horseracesbackend-production.up.railway.app/api/horseTracking/${encodeURIComponent(rawHorseName)}/flags?user=${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmark: next }),
      }
    );

    if (res.ok) {
      setTrackingInfoCache(prev => ({
        ...prev,
        [key]: { ...(prev[key] || {}), bookmark: next }
      }));
    }
  } catch (err) {
    console.error("Error toggling tracked horse bookmark:", err);
  }
};

const toggleTrackedHorseNotify = async (row, current) => {
  const rawHorseName = row.rawHorseName;
  const storedUser = localStorage.getItem("user");
  const userId = storedUser ? JSON.parse(storedUser).userId : "Guest";
  const key = hk(rawHorseName);
  const next = current ? 0 : 1;

  try {
    const res = await fetch(
      `https://horseracesbackend-production.up.railway.app/api/horseTracking/${encodeURIComponent(rawHorseName)}/flags?user=${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notify: next }),
      }
    );

    if (res.ok) {
      setTrackingInfoCache(prev => ({
        ...prev,
        [key]: { ...(prev[key] || {}), notify: next }
      }));

      // notify_horses mirror
      const payload = buildNotifyPayload(row, false /* isManual */);
      if (next === 1) {
        apiAddNotify(payload).catch(console.error);
      } else {
        apiDeleteNotifyByKeys(payload).catch(console.error);
      }
    }
  } catch (err) {
    console.error("Error toggling tracked horse notify:", err);
  }
};



// Save a new note (append a row) for a tracked horse, debounced like watchlist
const postTrackedNote = async (rawHorseName, noteText) => {
  const storedUser = localStorage.getItem("user");
  const userId = storedUser ? JSON.parse(storedUser).userId : "Guest";
  const key = hk(rawHorseName);
  const info = trackingInfoCache[key] || {};

  // empty notes shouldn't create rows; you can relax this if needed
  const trimmed = (noteText || "").trim();
  if (!trimmed) return;

  const payload = {
    horseName: rawHorseName,
    note: trimmed,
    trackingDate: new Date().toISOString(),
    User: userId,
    TrackingType: info.TrackingType || "Prospect",
    sireName: info.sireName || "",
    damName: info.damName || "",
    ownerFullName: info.ownerFullName || "",
    trainerFullName: info.trainerFullName || "",
  };

  try {
    const res = await fetch("https://horseracesbackend-production.up.railway.app/api/horseTracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      // optional: refresh the notes list if it's open
      if (trackedNotesOpen[key]) {
        await fetchTrackedNotesList(rawHorseName);
      }
    }
  } catch (err) {
    console.error("Error posting tracked note:", err);
  }
};

// Debounced textarea handler for tracked-horse notes
const handleTrackedNotesChange = (rawHorseName, value) => {
  const key = hk(rawHorseName);
  setTrackedNotesMap(prev => ({ ...prev, [key]: value }));
  debouncedPostTrackedNote(rawHorseName, value);
};


// Fetch full notes list for a horse (for "View Notes")
const fetchTrackedNotesList = async (rawHorseName) => {
  const storedUser = localStorage.getItem("user");
  const userId = storedUser ? JSON.parse(storedUser).userId : "Guest";
  const key = hk(rawHorseName);
  try {
    const r = await fetch(`https://horseracesbackend-production.up.railway.app/api/horseTracking/${encodeURIComponent(rawHorseName)}?user=${encodeURIComponent(userId)}`);
    const j = await r.json();
    const arr = Array.isArray(j.data) ? j.data : [];
    // newest first
    arr.sort((a,b) => new Date(b.noteDateTime || b.trackingDate || 0) - new Date(a.noteDateTime || a.trackingDate || 0));
    setTrackedNotesList(prev => ({ ...prev, [key]: arr }));
  } catch (err) {
    console.error("Error fetching tracked notes list:", err);
  }
};

// Toggle open/close, lazy-load on open
const toggleTrackedNotesOpen = async (rawHorseName) => {
  const key = hk(rawHorseName);
  setTrackedNotesOpen(prev => {
    const next = { ...prev, [key]: !prev[key] };
    return next;
  });
  // If opening and no list yet, fetch
  if (!trackedNotesOpen[key]) {
    await fetchTrackedNotesList(rawHorseName);
  }
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
    <th className="px-3 py-2">Track</th> {/* moved here */}
    <th className="px-3 py-2">Reason</th>
    <th className="px-3 py-2">Horse</th>
    <th className="px-3 py-2">Type</th>
    <th className="px-3 py-2">Race</th>
    <th className="px-3 py-2 w-[200px]">Notes</th>
    <th className="px-3 py-2">Actions</th>
  </tr>
</thead>
<tbody>
  {watchListItems.map((item, idx) => {
    const isManual = item.type === "manual";
    const info = isManual ? {} : (trackingInfoCache[item.rawHorseName?.toLowerCase()?.trim()] || {});
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
        {/* Date */}
        <td className="px-3 py-2 whitespace-nowrap">
          {formatDate(item.date || item.raceDate)}
        </td>

        {/* Time */}
        <td className="px-3 py-2 whitespace-nowrap">
          {item.raceTime}
        </td>

        {/* Track (moved here) */}
        <td className="px-3 py-2">
          {titleCase(item.raceTrack || "-")}
        </td>

        {/* Reason */}
        <td className="px-3 py-2 text-gray-600 italic">
          {isManual ? `WatchList Record (${displaySource})` : "Tracked Horse Update"}
        </td>

        {/* Horse */}
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

        {/* Type */}
        <td className="px-3 py-2">
          {isManual ? displaySource : titleCase(info.TrackingType || "-")}
        </td>

        {/* Race */}
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

        {/* Notes */}
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
    <>
      {/* textarea for tracked horse, debounced autosave */}
      <textarea
        rows={2}
        className="w-full px-2 py-1 border rounded text-xs resize-y text-gray-800"
        placeholder="Add notes..."
        value={trackedNotesMap[hk(item.rawHorseName)] ?? ""}
        onChange={(e) => handleTrackedNotesChange(item.rawHorseName, e.target.value)}
      />
      {/* View / Hide Notes toggle */}
      <button
        className="mt-1 text-[11px] text-gray-600 hover:underline"
        onClick={() => toggleTrackedNotesOpen(item.rawHorseName)}
        type="button"
      >
        {trackedNotesOpen[hk(item.rawHorseName)] ? "Hide Notes" : "View Notes"}
      </button>

      {/* Notes list */}
      {trackedNotesOpen[hk(item.rawHorseName)] && (
        <div className="mt-2 bg-white border border-gray-200 rounded p-2 max-h-40 overflow-y-auto">
          {Array.isArray(trackedNotesList[hk(item.rawHorseName)]) &&
          trackedNotesList[hk(item.rawHorseName)].length > 0 ? (
            trackedNotesList[hk(item.rawHorseName)].map((n, i) => (
              <div key={i} className="text-[11px] mb-1 border-b pb-1">
                <div><strong>Note:</strong> {n?.note || "-"}</div>
                <div><strong>Date:</strong> {n?.trackingDate ? new Date(n.trackingDate).toLocaleString() : "-"}</div>
              </div>
            ))
          ) : (
            <div className="text-[11px] italic text-gray-500">No notes yet.</div>
          )}
        </div>
      )}
    </>
  )}
</td>


        {/* Actions */}
        {/* Actions */}
<td className="px-3 py-2 align-top">
  <div className="flex items-center gap-2">
    {isManual ? (
      <>
        {!item.bookmark && !item.done && (
          <button
            onClick={() => markAsDone(item.id)}
            className="text-xs text-black hover:underline"
            title="Mark as done"
          >
            ✓ Done
          </button>
        )}
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
    ) : (
      // 👇 NEW: actions for tracked-horse rows
      <>
        {/* Done */}
        {!trackingInfoCache[hk(item.rawHorseName)]?.done &&
        !trackingInfoCache[hk(item.rawHorseName)]?.bookmark && (
          <button
            onClick={() => markTrackedHorseDone(item.rawHorseName)}
            className="text-xs text-black hover:underline"
            title="Mark as done"
          >
            ✓ Done
          </button>
        )}


        {/* Bookmark */}
        <span
          className="cursor-pointer"
          onClick={() =>
            toggleTrackedHorseBookmark(
              item.rawHorseName,
              !!trackingInfoCache[hk(item.rawHorseName)]?.bookmark
            )
          }
        >
          {trackingInfoCache[hk(item.rawHorseName)]?.bookmark ? (
            <BookmarkCheck className="w-4 h-4 text-blue-600" />
          ) : (
            <Bookmark className="w-4 h-4 text-gray-400 hover:text-blue-600" />
          )}
        </span>

        {/* Notifications */}
        <span
  className="cursor-pointer"
  onClick={() =>
    toggleTrackedHorseNotify(
      item, // pass the full row
      !!trackingInfoCache[hk(item.rawHorseName)]?.notify
    )
  }
>
  {trackingInfoCache[hk(item.rawHorseName)]?.notify ? (
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
