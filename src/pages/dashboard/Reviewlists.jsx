import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Flag } from "lucide-react";

export function ReviewListPage() {
  const [horseHistoryMap, setHorseHistoryMap] = useState([]);
  const [trackingInfoCache, setTrackingInfoCache] = useState({});
  const [expandedNotes, setExpandedNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState({});
  const [expandedReasons, setExpandedReasons] = useState({});
  const [editingNotes, setEditingNotes] = useState({});

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
  };

  const toggleReason = (date, reason) => {
    const key = `${date}__${reason}`;
    setExpandedReasons(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  useEffect(() => {
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

    // 2. Fetch review_horses table
    const reviewRes = await fetch("https://horseracesbackend-production.up.railway.app/api/review_horses");
    const reviewData = await reviewRes.json();
    const reviewMap = {};
    reviewData.forEach(row => {
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
      if (review.condition3) reasons.push("New Rating");

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
    "Improved > 5",
    "New Rating"
  ];

  entries.forEach(entry => {
    const date = entry.meetingDate?.slice(0, 10);
    if (!grouped[date]) {
      grouped[date] = {
        "Early rating > 80": [],
        "Improved > 5": [],
        "New Rating": []
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

    // Keep all dates expanded by default
    const allDates = Object.keys(grouped);
    const defaultExpanded = {};
    allDates.forEach(d => { defaultExpanded[d] = true; });
    setExpandedDates(defaultExpanded);
    setLoading(false);
  };

  fetchReviewList();
}, []);


const handleSaveNote = async (horseId) => {
  const note = editingNotes[horseId];

  if (typeof note !== "string") {
    alert("Note is invalid or missing.");
    return;
  }

  console.log("🔼 Saving note:", note, "for horseId:", horseId);

  try {
    const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/review_horses/${horseId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: note }),
    });

    if (!res.ok) {
      const errMsg = await res.text();
      throw new Error(`Failed to save: ${errMsg}`);
    }

    // Update note in local display (UI)
    setHorseHistoryMap(prev => {
      const newMap = { ...prev };
      for (const date in newMap) {
        for (const reason in newMap[date]) {
          newMap[date][reason] = newMap[date][reason].map(horse =>
            horse.horseId === horseId ? { ...horse, notes: note } : horse
          );
        }
      }
      return newMap;
    });

    setExpandedNotes(prev => ({ ...prev, [horseId]: false }));

    // Optionally reset editing state
    setEditingNotes(prev => {
      const copy = { ...prev };
      delete copy[horseId];
      return copy;
    });

  } catch (err) {
    console.error("❌ Failed to save note:", err);
    alert("Failed to save note.");
  }
};



  return (
  <div className="bg-gray-50 min-h-screen px-4 py-6 font-sans text-gray-900">
    <div className="max-w-screen-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Review List</h1>

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
                          <div className="pl-6 text-sm text-gray-500 italic">(no horses found)</div>
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
                              <div key={`horse-${date}-${reason}-${idx}`} className="pl-6 pb-4 border-l border-gray-200">
                                <h3 className="font-bold text-black uppercase text-sm flex items-center gap-1 flex-wrap">
                                  <Link to={`/dashboard/horse/${encodedHorseName}`} className="hover:underline">
                                    {entry.horseName}
                                  </Link>

                                  <sup className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        setExpandedNotes(prev => ({
                                          ...prev,
                                          [entry.horseId]: !prev[entry.horseId],
                                        }))
                                      }
                                      className="text-blue-600 text-[10px] hover:underline"
                                    >
                                      [notes]
                                    </button>
                                  </sup>
                                </h3>

                                {/* Note textarea */}
                                {expandedNotes[entry.horseId] && (
                                  <div className="text-xs text-black pl-4 mt-1">
                                    <textarea
                                      className="w-full text-sm border border-gray-300 rounded-md p-1"
                                      rows={3}
                                      value={editingNotes[entry.horseId] ?? entry.notes}
                                      onChange={(e) =>
                                        setEditingNotes(prev => ({
                                          ...prev,
                                          [entry.horseId]: e.target.value,
                                        }))
                                      }
                                    />
                                    <div className="flex gap-2 mt-1">
                                      <button
                                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded"
                                        onClick={() => handleSaveNote(entry.horseId)}
                                      >
                                        Save
                                      </button>
                                      <button
                                        className="text-gray-600 text-xs underline"
                                        onClick={() =>
                                          setExpandedNotes(prev => ({ ...prev, [entry.horseId]: false }))
                                        }
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}

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
