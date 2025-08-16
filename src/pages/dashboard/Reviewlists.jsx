import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Flag } from "lucide-react";


// ---- Quick session cache helpers ----
const CACHE_KEY = "reviewListCache";
const MAX_AGE_MS = 30 * 60 * 1000; // 30 mins

function loadCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > MAX_AGE_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function saveCache(data) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
}

export function ReviewListPage({ embedded = false }) {
  const [horseHistoryMap, setHorseHistoryMap] = useState([]);
  const [trackingInfoCache, setTrackingInfoCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState({});
  const [expandedReasons, setExpandedReasons] = useState({});
  const [doneIds, setDoneIds] = useState({});
  // ---- Tracking additions (STATE) ----
  const [trackingNotesDraft, setTrackingNotesDraft] = useState({}); // horseId -> note text
  const [trackingTypeDraft, setTrackingTypeDraft] = useState({});   // horseId -> category
  const [trackingBusy, setTrackingBusy] = useState({});             // horseId -> boolean

  // Same 6 categories you use in DynamicTable
  const TRACKING_CATEGORIES = [
    "Prospect",
    "Purchase",
    "Future Bet",
    "Stallion",
    "Mare",
    "Relative",
  ];

  // Read user like in DynamicTable
  const getUserId = () => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser).userId : "Guest";
    } catch {
      return "Guest";
    }
  };

  const titleCase = (str) =>
    str?.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

  const formatDate = (input) => {
    const date = new Date(input);
    if (isNaN(date)) return input;
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };


  const toggleDate = (date) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date],
    }));
    saveCache({
      horseHistoryMap,
      trackingInfoCache,
      expandedDates: { ...expandedDates, [date]: !expandedDates[date] },
      expandedReasons,
      doneIds
    });
  };

  const toggleReason = (date, reason) => {
    const key = `${date}__${reason}`;
    setExpandedReasons(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    saveCache({
      horseHistoryMap,
      trackingInfoCache,
      expandedDates,
      expandedReasons: { ...expandedReasons, [key]: !expandedReasons[key] },
      doneIds
    });
  };
  useEffect(() => {

  const cached = loadCache();
    if (cached) {
      setHorseHistoryMap(cached.horseHistoryMap || {});
      setTrackingInfoCache(cached.trackingInfoCache || {});
      setExpandedDates(cached.expandedDates || {});
      setExpandedReasons(cached.expandedReasons || {});
      setDoneIds(cached.doneIds || {});
      setLoading(false);
      return; // don't refetch
    }
  const fetchReviewList = async () => {
    setLoading(true);

    const today = new Date();
    const getPastDate = (daysAgo) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split("T")[0];
    };
    const dateStrings = [1, 2, 3].map(getPastDate);

    // 1. Fetch recent APIData_Table2 records
    const allRecords = [];
    for (const date of dateStrings) {
      try {
        const queryParams = new URLSearchParams({ meetingDate: date }).toString();
        const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/APIData_Table2?${queryParams}`);
        const json = await res.json();
        allRecords.push(...(json.data || []));
      } catch (error) {
        console.error(`❌ Failed to fetch for date ${date}`, error);
      }
    }

    // 2. Fetch review_horses table (only NOT reviewed by me)
    const uid = getUserId();
    const reviewRes = await fetch(`https://horseracesbackend-production.up.railway.app/api/review_horses?user=${encodeURIComponent(uid)}`);
    const reviewData = await reviewRes.json();
    const reviewMap = {};
    (reviewData || []).forEach(row => {
      const name = row.horseName?.toLowerCase()?.trim();
      if (name) reviewMap[name] = row;
    });


    // 3. Filter only reviewed horses
    const filtered = allRecords.filter(r => reviewMap[r.horseName?.toLowerCase()?.trim()]);

    // 4. Format and merge data
    const formatted = filtered.map(r => {
      const nameKey = r.horseName?.toLowerCase()?.trim();
      const review = reviewMap[nameKey];

      const reasons = [];
      if (review.condition1) reasons.push("Early rating > 80");
      if (review.condition2) reasons.push("Improved > 5");
      // if (review.condition3) reasons.push("New Timeform p or P Rating");

      return {
        horseId: review.id,
        notes: review.notes || "",
        horseName: r.horseName,
        meetingDate: r.meetingDate,
        raceTitle: titleCase(r.raceTitle),
        scheduledTimeOfRaceLocal: r.scheduledTimeOfRaceLocal || null,
        performanceRating: r.performanceRating || "-",
        damName: titleCase(r.damName) || "-",
        sireName: titleCase(r.sireName) || "-",
        ownerFullName: titleCase(r.ownerFullName) || "-",
        trainerFullName: titleCase(r.trainerFullName) || "-",
        horseColour: titleCase(r.horseColour) || "",   // ✅ NEW
        horseAge: r.horseAge || "",                    // ✅ NEW
        horseGender: titleCase(r.horseGender) || "",   // ✅ NEW
        qualifyingReason: reasons.join("; ")
      };
    });

    // 5. Group by date and reason
    const groupByDateAndReason = (entries) => {
  const grouped = {};

  // Standardize category names
  const allCategories = [
    "Early rating > 80",
    "Improved > 5"
    // "New Timeform p or P Rating"
  ];

  entries.forEach(entry => {
    const date = entry.meetingDate?.slice(0, 10);
    if (!grouped[date]) {
      grouped[date] = {
        "Early rating > 80": [],
        "Improved > 5": []
        // "New Timeform p or P Rating": []
      };
    }

    // Add entry to relevant categories
    const reasons = entry.qualifyingReason?.split("; ").filter(Boolean) || [];
    reasons.forEach(reason => {
      if (grouped[date][reason]) {
        grouped[date][reason].push(entry);
      }
    });
  });

  // Ensure every date includes all categories, even if empty
  Object.keys(grouped).forEach(date => {
    allCategories.forEach(cat => {
      if (!grouped[date][cat]) grouped[date][cat] = [];
    });
  });

  return grouped;
    };


    const grouped = groupByDateAndReason(formatted);
    setHorseHistoryMap(grouped);

    const uniqueHorseNames = new Set();
    Object.values(grouped).forEach(byReason => {
      Object.values(byReason).forEach(list => {
        (list || []).forEach(e => {
          if (e?.horseName) uniqueHorseNames.add(e.horseName.trim());
        });
      });
    });

    // const uid = getUserId();
    const fetchOne = async (name) => {
      try {
        const res = await fetch(
          `https://horseracesbackend-production.up.railway.app/api/horseTracking/${encodeURIComponent(name)}?user=${encodeURIComponent(uid)}`
        );
        const json = await res.json();
        const arr = Array.isArray(json?.data) ? json.data : [];
        if (arr.length > 0) {
          // take the first as “current state”; keep all notes
          return {
            tracked: true,
            type: arr[0]?.TrackingType || "Unspecified",
            date: arr[0]?.trackingDate || null,
            notes: arr.map(r => ({ note: r?.note, trackingDate: r?.trackingDate })),
          };
        }
      } catch (e) {
        console.error("Prefetch tracking failed for", name, e);
      }
      return { tracked: false, type: null, date: null, notes: [] };
    };

    // parallel but polite
    const names = Array.from(uniqueHorseNames);
    const chunks = (a, n) => a.length ? [a.slice(0, n), ...chunks(a.slice(n), n)] : [];
    for (const batch of chunks(names, 10)) {
      const results = await Promise.all(batch.map(n => fetchOne(n)));
      setTrackingInfoCache(prev => {
        const next = { ...prev };
        batch.forEach((n, i) => next[n.toLowerCase()] = results[i]);
        return next;
      });
    }


    // Keep all dates expanded by default
    const allDates = Object.keys(grouped);
    const defaultExpanded = {};
    allDates.forEach(d => { defaultExpanded[d] = true; });
    setExpandedDates(defaultExpanded);
    // Save everything into cache
    saveCache({
      horseHistoryMap: grouped,
      trackingInfoCache,
      expandedDates: defaultExpanded,
      expandedReasons,
      doneIds
    });

    setLoading(false);
  };

  fetchReviewList();
}, []);



// ---- Tracking additions (HANDLERS) ----
const handleTrackHorse = async (entry) => {
  const user = getUserId();
  if (!entry?.horseName) return;
  const horseKey = entry.horseName.toLowerCase().trim();
  const horseId = entry.horseId;
  const note = trackingNotesDraft[horseId]?.trim() || "";
  const type = trackingTypeDraft[horseId] || "Prospect";

  setTrackingBusy(prev => ({ ...prev, [horseId]: true }));
  try {
    // match DynamicTable payload & endpoint
    const payload = {
      horseName: entry.horseName,
      note,
      trackingDate: new Date().toISOString(),
      TrackingType: type,
      User: user,
      sireName: entry?.sireName || "",
      damName: entry?.damName || "",
      ownerFullName: entry?.ownerFullName || "",
      trainerFullName: entry?.trainerFullName || "",
      horseAge: entry?.horseAge || "",
      horseGender: entry?.horseGender || "",
      horseColour: entry?.horseColour || "",
    };

    const res = await fetch("https://horseracesbackend-production.up.railway.app/api/horseTracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());

    // re-fetch notes list for this horse (keeps parity with your sample)
    const r = await fetch(
      `https://horseracesbackend-production.up.railway.app/api/horseTracking/${encodeURIComponent(entry.horseName)}?user=${encodeURIComponent(user)}`
    );
    const j = await r.json();
    const arr = Array.isArray(j?.data) ? j.data : [];

    setTrackingInfoCache(prev => ({
      ...prev,
      [horseKey]: arr.length
        ? {
            tracked: true,
            type: arr[0]?.TrackingType || type,
            date: arr[0]?.trackingDate || new Date().toISOString(),
            notes: arr.map(x => ({ note: x?.note, trackingDate: x?.trackingDate })),
          }
        : { tracked: true, type, date: new Date().toISOString(), notes: note ? [{ note, trackingDate: new Date().toISOString() }] : [] }
    }));

    // clear draft note for this horse row
    setTrackingNotesDraft(p => {
      const c = { ...p };
      delete c[horseId];
      return c;
    });
  } catch (e) {
    console.error("Error tracking horse:", e);
    alert("Error tracking horse.");
  } finally {
    setTrackingBusy(prev => ({ ...prev, [horseId]: false }));
  }
};

const handleStopTracking = async (entry) => {
  const user = getUserId();
  if (!entry?.horseName) return;
  if (!window.confirm(`Stop tracking ${entry.horseName}?`)) return;
  const horseKey = entry.horseName.toLowerCase().trim();
  try {
    const res = await fetch(
      `https://horseracesbackend-production.up.railway.app/api/horseTracking/${encodeURIComponent(entry.horseName)}?user=${encodeURIComponent(user)}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error(await res.text());
    setTrackingInfoCache(prev => {
      const n = { ...prev };
      delete n[horseKey];
      return n;
    });
  } catch (e) {
    console.error("Error stopping tracking:", e);
    alert("Failed to stop tracking.");
  }
};

const handleMarkDone = async (entry) => {
  const storedUser = localStorage.getItem("user");
  const userId = storedUser ? JSON.parse(storedUser).userId : "Guest";

  // Optimistic strike-through immediately
  setDoneIds(prev => ({ ...prev, [entry.horseId]: true }));

  try {
    const res = await fetch(
      `https://horseracesbackend-production.up.railway.app/api/review_horses/${entry.horseId}/reviewStatus`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reviewed: true }),
      }
    );
    if (!res.ok) throw new Error(await res.text());
    // success: keep strike-through; on next reload it won’t show at all
  } catch (e) {
    console.error("Failed to mark done:", e);
    alert("Could not mark as done.");
    // Revert strike-through if the request failed
    setDoneIds(prev => {
      const copy = { ...prev };
      delete copy[entry.horseId];
      return copy;
    });
  }
};


  return (
   <div className={`${embedded ? "" : "bg-gray-50 min-h-screen px-4 py-6"} font-sans text-gray-900`}>
     <div className={`${embedded ? "" : "max-w-screen-xl mx-auto space-y-6"}`}>
       {!embedded && <h1 className="text-2xl font-bold">Review List</h1>}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="divide-y divide-gray-100">
          {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="animate-spin h-4 w-4 text-gray-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span>Loading watch list data...</span>
              </div>
            ) : (
            Object.entries(horseHistoryMap).map(([date, reasons]) => (
              <div key={date} className="py-4">
                {/* Date toggle */}
                <button
                  onClick={() => toggleDate(date)}
                  className="text-sm font-semibold text-black mb-2 hover:underline focus:outline-none"
                >
                  {expandedDates[date] ? "▾" : "▸"} {formatDate(date)}
                </button>

                {/* Reason groups under each date */}
                {expandedDates[date] &&
                  Object.entries(reasons).map(([reason, horses]) => (
                    <div key={reason} className="pl-4 mb-2">
                      {/* Reason toggle */}
                      <button
                        onClick={() => toggleReason(date, reason)}
                        className="text-sm font-bold text-gray-700 mb-1 hover:underline focus:outline-none"
                      >
                        {expandedReasons[`${date}__${reason}`] ? "▾" : "▸"} {reason}
                      </button>

                      {/* Horse cards under each reason */}
                     {expandedReasons[`${date}__${reason}`] && (
                        horses.length === 0 ? (
                          <div className="pl-6 text-sm text-gray-500 italic">(no qualifiers today)</div>
                        ) : (
                          horses.map((entry, idx) => {
                            const key = entry.horseName?.toLowerCase()?.trim();
                            const encodedHorseName = encodeURIComponent(entry.horseName?.trim());
                            const formattedDateOnly = entry.meetingDate?.slice(0, 10);
                            const encodedDate = encodeURIComponent(formattedDateOnly);
                            const encodedRaceTitle = encodeURIComponent(entry.raceTitle?.trim());
                            const encodedUrl = encodeURIComponent(
                              "https://horseracesbackend-production.up.railway.app/api/APIData_Table2"
                            );

                            return (
                              // <div key={`horse-${date}-${reason}-${idx}`} className="pl-6 pb-4 border-l border-gray-200">
                              <div
                                 key={`horse-${date}-${reason}-${idx}`}
                                 className={`pl-6 pb-4 border-l border-gray-200 ${
                                  doneIds[entry.horseId] ? "line-through decoration-gray-500 decoration-2 opacity-60" : ""
                                 }`}
                              >  
                                <h3 className="font-bold text-black uppercase text-sm flex items-center justify-between flex-wrap">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Link
                                      to={`/dashboard/horse/${encodedHorseName}`}
                                      className="hover:underline"
                                    >
                                      {entry.horseName}
                                    </Link>

                                    {/* TRACKING STATUS / CONTROLS */}
                                    {(() => {
                                      const k = entry.horseName?.toLowerCase()?.trim();
                                      const info = trackingInfoCache[k];

                                      if (info?.tracked) {
                                        return (
                                          <>
                                            <span className="text-[9px] px-1 py-[1px] border border-gray-300 text-black rounded-sm ml-1 align-super">
                                              Tracked: {info?.type || "Unspecified"}
                                            </span>
                                            {info?.date && (
                                              <span className="text-[10px] text-gray-500 italic">
                                                Since {new Date(info.date).toLocaleString()}
                                              </span>
                                            )}
                                            <button
                                              onClick={() => handleStopTracking(entry)}
                                              className="text-[10px] text-red-600 underline"
                                              title="Stop tracking"
                                            >
                                              untrack
                                            </button>
                                            {/* Quick add note */}
                                            <div className="flex items-center gap-2 mt-1 w-full">
                                              <input
                                                type="text"
                                                className="text-[11px] px-2 py-1 border rounded flex-1"
                                                placeholder="Add a note..."
                                                value={trackingNotesDraft[entry.horseId] ?? ""}
                                                onChange={(e) =>
                                                  setTrackingNotesDraft((p) => ({
                                                    ...p,
                                                    [entry.horseId]: e.target.value,
                                                  }))
                                                }
                                              />
                                              <button
                                                className="bg-blue-600 text-white text-[10px] px-2 py-[2px] rounded leading-none"
                                                onClick={() => handleTrackHorse(entry)}
                                                disabled={!!trackingBusy[entry.horseId]}
                                              >
                                                {trackingBusy[entry.horseId] ? "Saving..." : "+ Add Note"}
                                              </button>
                                            </div>
                                          </>
                                        );
                                      }

                                      return (
                                        <div className="flex items-center gap-2">
                                          <select
                                            className="text-[11px] border rounded px-2 py-1"
                                            value={trackingTypeDraft[entry.horseId] ?? "Prospect"}
                                            onChange={(e) =>
                                              setTrackingTypeDraft((p) => ({
                                                ...p,
                                                [entry.horseId]: e.target.value,
                                              }))
                                            }
                                          >
                                            {/* {TRACKING_CATEGORIES.map((c) => (
                                              <option key={c} value={c}>
                                                {c}
                                              </option>
                                            ))} */}
                                            {TRACKING_CATEGORIES
                                              .filter(c => c !== "New Timeform p" && c !== "P")
                                              .map(c => (
                                                <option key={c} value={c}>{c}</option>
                                              ))}
                                          </select>
                                          <input
                                            type="text"
                                            className="text-[11px] px-2 py-1 border rounded"
                                            placeholder="Add a note..."
                                            value={trackingNotesDraft[entry.horseId] ?? ""}
                                            onChange={(e) =>
                                              setTrackingNotesDraft((p) => ({
                                                ...p,
                                                [entry.horseId]: e.target.value,
                                              }))
                                            }
                                          />
                                          <button
                                            className="px-2 py-[3px] bg-blue-600 text-white text-[10px] rounded leading-none"
                                            onClick={() => handleTrackHorse(entry)}
                                            disabled={!!trackingBusy[entry.horseId]}
                                          >
                                            {trackingBusy[entry.horseId] ? "Saving..." : "+ Track"}
                                          </button>
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  {/* Tick Done button at right */}
                                  <button
                                    onClick={() => handleMarkDone(entry)}
                                    className="text-[10px] flex items-center gap-1 px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                                    title="Mark reviewed"
                                  >
                                    ✓ <span>Done</span>
                                  </button>
                                </h3>





                                <div className="pl-4 text-sm text-black space-y-1 mt-1">
                                  {/* Metadata */}
                                  {(() => {
                                    const meta = [
                                      entry.sireName && `${entry.sireName} (S)`,
                                      entry.damName && `${entry.damName} (D)`,
                                      entry.ownerFullName && `${entry.ownerFullName} (O)`,
                                      entry.trainerFullName && `${entry.trainerFullName} (T)`,
                                      entry.horseColour && `${entry.horseColour} (C)`,
                                      entry.horseAge && `Age: ${entry.horseAge}`,
                                      entry.horseGender && `${entry.horseGender}`
                                    ].filter(Boolean);

                                    return meta.length > 0 ? (
                                      <div className="text-xs text-black">{meta.join(" | ")}</div>
                                    ) : null;
                                  })()}

                                  {/* Race title */}
                                  <div className="flex items-center gap-2 mt-1">
                                    <Flag className="w-4 h-4 text-gray-400" />
                                    <Link
                                      to={`/dashboard/racedetails?url=${encodedUrl}&RaceTitle=${encodedRaceTitle}&meetingDate=${encodedDate}`}
                                      className="hover:underline text-indigo-700 text-sm"
                                    >
                                      {entry.raceTitle}
                                    </Link>
                                  </div>

                                  {/* Date, time, rating */}
                                  <div className="flex gap-4 items-center flex-wrap text-sm">
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
                                      <span className="text-green-700 font-semibold">
                                        Rating: {entry.performanceRating}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )
                      )}

                    </div>
                  ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  </div>
);


}

export default ReviewListPage;
