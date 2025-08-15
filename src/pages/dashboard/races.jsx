import React, { useState, useEffect, useRef } from "react";
import { Card, Typography, Input, Select, Option, Button } from "@material-tailwind/react";
import { MapPin, Users, Award, ChevronRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
// import {
//   MapPin,
//   Users,
//   Award,
//   Trophy,
//   BadgeCheck
// } from "lucide-react";

const formatDDMMYYYY = (dateStr) => {
  if (!dateStr) return null;
  // If it's ISO yyyy-mm-dd, just reorder
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-");
    return `${d}-${m}-${y}`;
  }
  // Fallback to Date parsing
  const d = new Date(dateStr);
  if (!isNaN(d)) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  return dateStr;
};

const countryNameMap = {
  GBR: "United Kingdom",
  HGK: "Hong Kong",
  FRA: "France",
  IRE: "Ireland",
  SAF: "South Africa",
  QAT: "Qatar",
  UAE: "United Arab Emirates",
  SAU: "Saudi Arabia",
  BAH: "Bahrain",
  USA: "United States",
  ZIM: "Zimbabwe",
  JAP: "Japan",
  CHI: "Chile",
  AUS: "Australia",
  ITY: "Italy",
  SWI: "Switzerland",
  BRA: "Brazil",
  ARG: "Argentina",
  ALL: "All Countries",
  GER: "Germany",
  CAN: "Canada",
  AST: "Austria",
  SLO: "Slovakia",
  TUR: "Turkey",
  BEL: "Belgium",
  SPA: "Spain",
  SWE: "Sweden",
  HOL: "Netherlands",
  NOR: "Norway",
  CZE: "Czech Republic",
  DEN: "Denmark",
  SIN: "Singapore",
  POL: "Poland",
  URG: "Uruguay",
  MAC: "Macau",
  OMN: "Oman",
  NZD: "New Zealand",
  PER: "Peru",
  JER: "Jersey",
  GUR: "Guernsey",
  MOR: "Morocco",
  HUN: "Hungary",
  VEN: "Venezuela",
  MAL: "Malaysia",
  KOR: "South Korea",
  RUS: "Russia",
  MEX: "Mexico",
  CHA: "Chad",
  PAN: "Panama",
  KAZ: "Kazakhstan",
  BAR: "Barbados",
  IND: "India",
  ECU: "Ecuador",
  DOM: "Dominican Republic",
};


const toLocalISO = (date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().split("T")[0];
};
// const formatChipLabel = (date, isYesterday) => {
//   if (isYesterday) return "YESTERDAY";
//   const weekday = date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
//   const dayNum = date.getDate();
//   return `${weekday} ${dayNum}`;
// };

// UPDATED: add onOpenDatePicker
// keep your existing helpers (toLocalISO, etc.) but we'll tweak the label:
const formatChipLabel = (date, isYesterday) => {
  if (isYesterday) return "Yesterday";
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  const dayNum = date.getDate();
  return `${weekday} ${dayNum}`;
};

const QuickDatesBar = ({ currentISO, onPick, dateInputRef }) => {
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - 1 - i); // start from yesterday
    return d;
  });

  const openPicker = () => {
    const el = dateInputRef?.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try { el.showPicker(); return; } catch {}
    }
    el.focus(); // fallback for Safari/Firefox
    el.click();
  };

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="
          flex w-full items-stretch
          bg-white text-black rounded-xl
          ring-1 ring-gray-200
          divide-x divide-gray-200
          shadow-sm
        "
      >
        {dates.map((d, i) => {
          const iso = toLocalISO(d);
          const selected = iso === currentISO;
          return (
            <button
              key={iso}
              onClick={() => onPick(iso)}
              type="button"
              className={[
                "min-w-[96px] flex-1 px-4 py-2 text-sm whitespace-nowrap transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300",
                selected
                  ? "bg-gray-50 font-semibold rounded-lg"
                  : "hover:bg-gray-50"
              ].join(" ")}
            >
              {formatChipLabel(d, i === 0)}
            </button>
          );
        })}

        {/* Select date (anchored input so calendar opens under this area) */}
        <div className="relative min-w-[140px] flex-1">
          {/* Hidden input anchors the native picker below this block */}
          <input
            ref={dateInputRef}
            type="date"
            value={currentISO}
            onChange={(e) => onPick(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 pointer-events-none z-0"
            aria-hidden="true"
            inputMode="none"
          />
          <button
            type="button"
            onClick={openPicker}
            className="
              relative z-10
              h-full w-full px-4 py-2 text-sm
              flex items-center justify-center
              hover:bg-gray-50 rounded-lg
              focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300
            "
          >
            Select date
          </button>
        </div>
      </div>
    </div>
  );
};


const TRACKING_CATEGORIES = [
  "Prospect",
  "Purchase",
  "Future Bet",
  "Stallion",
  "Mare",
  "Relative",
];

const getUserId = () => {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser).userId : "Guest";
  } catch {
    return "Guest";
  }
};

function TrackControl({ horseName, rowData }) {
  const [loading, setLoading] = React.useState(false);
  const [isTracked, setIsTracked] = React.useState(false);
  const [category, setCategory] = React.useState(TRACKING_CATEGORIES[0]);
  const [trackedType, setTrackedType] = React.useState(null);
  const [error, setError] = React.useState("");

  const user = React.useMemo(() => getUserId(), []);

  // Prefill category from existing tracking, if any
  React.useEffect(() => {
    let abort = false;
    const fetchStatus = async () => {
      try {
        setError("");
        const res = await fetch(
          `https://horseracesbackend-production.up.railway.app/api/horseTracking/${encodeURIComponent(
            horseName
          )}?user=${encodeURIComponent(user)}`
        );
        const json = await res.json();
        const list = Array.isArray(json?.data) ? json.data : [];
        if (abort) return;
        if (list.length > 0) {
          setIsTracked(true);
          const t = list[0]?.TrackingType || null;
          setTrackedType(t);
          if (t && TRACKING_CATEGORIES.includes(t)) setCategory(t);
        } else {
          setIsTracked(false);
          setTrackedType(null);
        }
      } catch (e) {
        if (!abort) setError("Failed to load tracking status");
      }
    };
    if (horseName) fetchStatus();
    return () => {
      abort = true;
    };
  }, [horseName, user]);

  const handleTrack = async () => {
    if (!horseName) return;
    setLoading(true);
    setError("");
    try {
      // Build payload using rowData to enrich (sire/dam/owner/trainer/etc.)
      const payload = {
        horseName,
        note: "", // first track no note required
        trackingDate: new Date().toISOString(),
        TrackingType: category,
        User: user,
        sireName: rowData?.sireName || "",
        damName: rowData?.damName || "",
        ownerFullName: rowData?.ownerFullName || "",
        trainerFullName: rowData?.trainerFullName || "",
        horseAge: rowData?.horseAge || "",
        horseGender: rowData?.horseGender || "",
        horseColour: rowData?.horseColour || "",
      };

      const res = await fetch(
        "https://horseracesbackend-production.up.railway.app/api/horseTracking",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error(await res.text());

      setIsTracked(true);
      setTrackedType(category);
    } catch (e) {
      setError("Failed to track horse");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (isTracked) {
    return (
      <span className="ml-2 inline-flex items-center rounded-full bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 text-[10px]">
        Tracked: <span className="ml-1 font-semibold">{trackedType || "—"}</span>
      </span>
    );
  }

  return (
    <span className="ml-2 inline-flex items-center gap-1">
      <select
        className="text-[10px] border border-gray-300 rounded px-1 py-0.5 bg-white"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {TRACKING_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleTrack}
        disabled={loading}
        className="ml-1 text-[8px] px-1 py-[1px] rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "…" : "+Track"}
      </button>
      {error && (
        <span className="text-[10px] text-red-600 ml-1">{error}</span>
      )}
    </span>
  );
}




// RaceTile Component
const RaceTile = ({ race, isTracked, onTrackClick, onClick }) => {
  return (
    <Card className="relative p-3 m-2 shadow-sm hover:shadow-md bg-white rounded-lg max-w-sm text-sm">
      {/* Title + Track Button */}
      <div className="flex justify-between items-start mb-1">
        <h3
          className="font-semibold text-gray-800 cursor-pointer hover:underline leading-snug"
          onClick={() => onClick(race)}
        >
          {race.raceTitle} (Class {race.raceNumber})
        </h3>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onTrackClick(race);
          }}
          className="text-xs font-medium text-green-700 hover:text-green-800"
        >
          {isTracked ? "Tracking" : "+ Track"}
        </button>
      </div>

      {/* Metadata */}
      <div
        onClick={() => onClick(race)}
        className="cursor-pointer space-y-0.5 text-gray-600"
      >
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4 text-gray-400" />
          <strong>{race.courseName}</strong> — {race.raceSurfaceName}
        </div>

        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-gray-400" />
          Runners: {race.numberOfRunners}
        </div>

        <div className="flex items-center gap-1">
          <Award className="w-4 h-4 text-gray-400" />
          Prize Fund: £{Number(race.prizeFund).toLocaleString()}
        </div>
      </div>

      {/* Top Horses */}
      {race.topHorses.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium text-gray-700 mb-1">Top Horses:</p>
          <ul className="list-disc list-inside text-blue-700 text-sm space-y-0.5">
            {race.topHorses.map((horse, index) => (
              <li key={index}>
                <Link
                  to={`/dashboard/horse/${encodeURIComponent(horse.horseName)}`}
                  className="hover:underline"
                >
                  {horse.horseName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );

};


// ReportTable Component
// ReportTable (cleaned)
const ReportTable = ({ tableData }) => {
  if (!tableData || tableData.length === 0) {
    return (
      <Card className="bg-white text-black mt-4">
        <div className="p-4 text-sm text-gray-500">No records</div>
      </Card>
    );
  }

  // Columns to hide completely (unchanged)
  const HIDE = new Set([
    // remove
    "raceTitle", "countrycode", "countryCode", "finishingTime",
    "leaderSectional", "winnerSectional", "distanceSectional",
    "sectionalFinishingTime", "hotRace", "distanceCumulative",
    "preRaceAdjustedRating", "preRaceMasterRating", "meetingDate",
    "courseName", "courseId", "raceNumber", "foalingDate",
    "performanceSymbol", "normalizedOwnerName",

    // moved to bar
    "raceSurfaceName", "raceType", "distance", "going", "numberOfRunners",
    "prizeFund", "prizeFundWinner", "raceClass", "scheduledTimeOfRaceLocal"
  ]);

  // Your desired header display names (for headers only)
  const columnHeaderMap = {
    positionOfficial: "Position",
    horseName: "Horse",

    horseAge: "Age",
    horseGender: "Gender",
    horseColour: "Colour",

    sireName: "Sire",
    damName: "Dam",

    jockeyFullName: "Jockey",
    trainerFullName: "Trainer",
    ownerFullName: "Owner",

    betfairWinSP: "SP",
    bSPAdvantage: "bSP Advantage",
    prizeMoneyWon: "Prize",
    distanceBeaten: "Distance Beaten",
    draw: "Draw",

    performanceRating: "Performance Rating",
    timefigure: "Timeform Rating",

    // Helpful aliases if your data uses these variants
    timeformRating: "Timeform Rating",
    jockeyName: "Jockey",
    trainerName: "Trainer",
    ownerName: "Owner",
  };

  // Build a stable column order to match your requested sequence
  const PREFERRED = [
    "positionOfficial",
    "horseName",

    "horseAge",
    "horseGender",
    "horseColour",

    "sireName",
    "damName",

    "jockeyFullName",
    "trainerFullName",
    "ownerFullName",

    "betfairWinSP",
    "bSPAdvantage",
    "prizeMoneyWon",
    "distanceBeaten",
    "draw",

    "performanceRating",
    "timefigure",       // if present
    "timeformRating",   // common alt field
  ];

  // collect all keys that aren't hidden
  const allKeys = Object.keys(
    tableData.reduce((acc, row) => Object.assign(acc, row), {})
  ).filter((k) => !HIDE.has(k));

  // final ordered columns: preferred first (if present), then the rest
  const preferredCols = PREFERRED.filter((k) => allKeys.includes(k));
  const remainingCols = allKeys.filter((k) => !preferredCols.includes(k));
  const columns = [...preferredCols, ...remainingCols];

  // sort rows by finishing position if possible
  const sorted = [...tableData].sort((a, b) => {
    const A = Number(a.positionOfficial ?? Infinity);
    const B = Number(b.positionOfficial ?? Infinity);
    return A - B;
  });

  return (
    <Card className="bg-white text-black mt-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-auto">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} className="border-b border-gray-200 py-2 px-3 text-left">
                  <Typography variant="small" className="text-[10px] font-bold uppercase text-blue-gray-600">
                    {columnHeaderMap[col] || col}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, ri) => (
              <tr key={ri}>
                {columns.map((col, ci) => (
                  <td key={ci} className="py-2 px-3 border-b border-gray-100">
                    <Typography className="text-[10px] font-medium text-blue-gray-700">
                      {col === "horseName" && row[col] ? (
                        <span className="inline-flex items-center">
                          <Link
                            to={`/dashboard/horse/${encodeURIComponent(row[col])}`}
                            className="text-blue-600 hover:underline"
                          >
                            {row[col]}
                          </Link>
                          {/* Inline tracking control beside the horse name */}
                          <TrackControl horseName={row[col]} rowData={row} />
                        </span>
                      ) : (
                        row[col] ?? "-"
                      )}
                    </Typography>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};



// Logs Component
const Logs = ({ logs }) => {
  return (
    <div className="mt-6">
      <Typography variant="h6" className="text-blue-gray-700 font-bold mb-4">
        Viewed Races
      </Typography>
      <ul className="list-disc list-inside text-blue-gray-600">
        {logs.map((log, index) => (
          <li key={index}>
            {log.date} - {log.raceTitle}
          </li>
        ))}
      </ul>
    </div>
  );
};

const RaceBar = ({ race, isOpen, isTracked, onToggle, onTrackClick, tableData }) => {
  const fmtMoney = (n) =>
    n !== undefined && n !== null && n !== ""
      ? `£${Number(n).toLocaleString()}`
      : null;

  // Pull meta from race or first record
  const meta = (race.records && race.records[0]) || {};

  // NEW: format meetingDate as dd-mm-yyyy
  const dateText = formatDDMMYYYY(race.meetingDate ?? meta.meetingDate);

  const metaLine1 = [
    dateText,                                     // <-- added here
    meta.scheduledTimeOfRaceLocal,
    race.distance ?? meta.distance,
    meta.going ?? race.going,
    race.raceSurfaceName ?? meta.raceSurfaceName,
    meta.raceType ?? race.raceType,
    (meta.raceClass ?? race.raceClass ?? race.raceNumber) &&
      `Class ${meta.raceClass ?? race.raceClass ?? race.raceNumber}`,
    (race.numberOfRunners ?? meta.numberOfRunners) &&
      `Runners: ${race.numberOfRunners ?? meta.numberOfRunners}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const metaLine2 = [
    fmtMoney(race.prizeFund ?? meta.prizeFund) &&
      `Prize Fund: ${fmtMoney(race.prizeFund ?? meta.prizeFund)}`,
    fmtMoney(meta.prizeFundWinner ?? race.prizeFundWinner) &&
      `Winner: ${fmtMoney(meta.prizeFundWinner ?? race.prizeFundWinner)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="bg-white">
      <div className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50">
        <button onClick={() => onToggle(race)} className="flex-1 flex items-center gap-3 text-left">
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-gray-700" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-700" />
          )}
          <div className="flex flex-col">
            <span className="font-semibold uppercase leading-snug">{race.raceTitle}</span>
            {metaLine1 && <span className="text-xs text-gray-600">{metaLine1}</span>}
            {metaLine2 && <span className="text-xs text-gray-500">{metaLine2}</span>}
          </div>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onTrackClick(race);
          }}
          className={`text-xs font-medium ${
            isTracked ? "text-green-700" : "text-green-700 hover:text-green-800"
          }`}
        >
          {isTracked ? "Tracking" : "+ Track"}
        </button>
      </div>

      {isOpen && (
        <div className="px-6 pb-4">
          <ReportTable tableData={tableData} />
        </div>
      )}
    </div>
  );
};




// Races Component
export function Races() {
  const [meetingDate, setMeetingDate] = useState("");
  const [racesData, setRacesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedRaceRecords, setSelectedRaceRecords] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [trackedRaces, setTrackedRaces] = useState([]);
  const [openCountries, setOpenCountries] = useState(new Set());
  const [openTracks, setOpenTracks] = useState({}); // { [country]: Set(courseName) }
  const [openRaces, setOpenRaces] = useState(new Set()); // Set(raceTitle)
  const [recordsMap, setRecordsMap] = useState({}); // { [raceTitle]: records[] }

  const dateInputRef = useRef(null);

  useEffect(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    setMeetingDate(toLocalISO(y));
    setSelectedCountry("GBR");
  }, []);

// Group data: country -> course -> races[]
const groupedByCountry = React.useMemo(() => {
  const groups = {};
  for (const race of racesData) {
    const country = race.countryCode || "UNK";
    const course = race.courseName || "Unknown";
    if (!groups[country]) groups[country] = {};
    if (!groups[country][course]) groups[country][course] = [];
    groups[country][course].push(race);
  }
  return groups;
}, [racesData]);

// Toggle helpers
const toggleCountry = (code) => {
  setOpenCountries((prev) => {
    const next = new Set(prev);
    next.has(code) ? next.delete(code) : next.add(code);
    return next;
  });
};

  const toggleTrack = (country, course) => {
    setOpenTracks((prev) => {
      const curr = new Set(prev[country] || []);
      curr.has(course) ? curr.delete(course) : curr.add(course);
      return { ...prev, [country]: curr };
    });
  };

  // OPEN a race tile to save + show outcomes inline
  const handleRaceToggle = async (race) => {
    const title = race.raceTitle;
    const opening = !openRaces.has(title);

    // toggle the UI
    setOpenRaces((prev) => {
      const next = new Set(prev);
      opening ? next.add(title) : next.delete(title);
      return next;
    });
    setRecordsMap((prev) => (prev[title] ? prev : { ...prev, [title]: race.records }));
    setLogs((prev) => [...prev, { date: meetingDate, raceTitle: title }]);

    // Save selection only when opening
    if (!opening) return;

    const raceData = {
      meetingDate,
      raceTitle: race.raceTitle,
      countryCode: race.countryCode,
      courseName: race.courseName,
      courseId: race.courseId,
      raceNumber: race.raceNumber,
      raceSurfaceName: race.raceSurfaceName,
      numberOfRunners: race.numberOfRunners,
      prizeFund: race.prizeFund,
      allHorses: race.allHorses,
      user: (() => {
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser).userId : "Guest";
      })(),
    };

    try {
      const response = await fetch("https://horseracesbackend-production.up.railway.app/api/save-race", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(raceData),
      });
      if (!response.ok) console.error("Failed to save race:", await response.text());
    } catch (e) {
      console.error("Error saving race selection:", e);
    }
  };

  const openDatePicker = () => {
    if (!dateInputRef.current) return;
    // Use showPicker if supported; otherwise trigger click()
    if (dateInputRef.current.showPicker) {
      dateInputRef.current.showPicker();
    } else {
      dateInputRef.current.click();
    }
  };

  const fetchRacesData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        meetingDate,
      }).toString();

      const response = await fetch(
        `https://horseracesbackend-production.up.railway.app/api/APIData_Table2?${queryParams}`
      );
      const data = await response.json();
      
      const races = Object.values(
        data.data.reduce((acc, record) => {
          if (!acc[record.raceTitle]) {
            acc[record.raceTitle] = {
              raceTitle: record.raceTitle,
              countryCode: record.countryCode,
              courseName: record.courseName,
              courseId: record.courseId, // Add courseId here
              raceNumber: record.raceNumber, // Add raceNumber here
              raceSurfaceName: record.raceSurfaceName,
              numberOfRunners: record.numberOfRunners,
              prizeFund: record.prizeFund,
              topHorses: { 1: null, 2: null, 3: null },
              allHorses: [], // New column for all horses
              records: [],
            };
          }
      
          // Add the horse to the `allHorses` array
          acc[record.raceTitle].allHorses.push({
            horseName: record.horseName,
            positionOfficial: record.positionOfficial,
            sireName: record.sireName,
            damName: record.damName,
            // Add any other necessary fields here
          });
      
          // Assign the horse to `topHorses` if it is in the top 3
          if (record.positionOfficial === 1 && !acc[record.raceTitle].topHorses[1]) {
            acc[record.raceTitle].topHorses[1] = {
              horseName: record.horseName,
              positionOfficial: record.positionOfficial,
            };
          }
          if (record.positionOfficial === 2 && !acc[record.raceTitle].topHorses[2]) {
            acc[record.raceTitle].topHorses[2] = {
              horseName: record.horseName,
              positionOfficial: record.positionOfficial,
            };
          }
          if (record.positionOfficial === 3 && !acc[record.raceTitle].topHorses[3]) {
            acc[record.raceTitle].topHorses[3] = {
              horseName: record.horseName,
              positionOfficial: record.positionOfficial,
            };
          }
      
          acc[record.raceTitle].records.push(record);
          return acc;
        }, {})
      );
      
      // Sort allHorses by positionOfficial
      races.forEach((race) => {
        race.allHorses.sort((a, b) => a.positionOfficial - b.positionOfficial);
      });
      

      races.forEach((race) => {
        race.topHorses = Object.values(race.topHorses).filter((horse) => horse !== null);
      });

      setRacesData(races);
      setCountryOptions([...new Set(races.map((race) => race.countryCode))]);
    } catch (error) {
      console.error("Error fetching races data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (meetingDate) {
      fetchRacesData();
    }
  }, [meetingDate]);

  useEffect(() => {
    if (selectedCountry) {
      const courses = racesData
        .filter((race) => race.countryCode === selectedCountry)
        .map((race) => race.courseName);
      const uniqueCourses = [...new Set(courses)];

      setCourseOptions(uniqueCourses);
      setSelectedCourse(uniqueCourses[0] || ""); // <-- Set default to first course
    }
  }, [selectedCountry, racesData]);

  useEffect(() => {
    if (selectedCountry && selectedCourse) {
      setFilteredData(
        racesData.filter(
          (race) =>
            race.countryCode === selectedCountry &&
            race.courseName === selectedCourse
        )
      );
    }
  }, [selectedCountry, selectedCourse]);

  const handleTileClick = async (race) => {
    setSelectedRaceRecords(race.records);
    setLogs((prevLogs) => [
      ...prevLogs,
      { date: meetingDate, raceTitle: race.raceTitle },
    ]);
    setShowTable(true);
  
    // Data to be saved in the database
    const raceData = {
      meetingDate,
      raceTitle: race.raceTitle,
      countryCode: race.countryCode,
      courseName: race.courseName,
      courseId: race.courseId, // Add courseId here
      raceNumber: race.raceNumber, // Add raceNumber here
      raceSurfaceName: race.raceSurfaceName,
      numberOfRunners: race.numberOfRunners,
      prizeFund: race.prizeFund,
      allHorses: race.allHorses, // Include all horses
      user: (() => {
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser).userId : "Guest";
      })(),
    };
  
    console.log("Payload being sent to backend:", raceData);
  
    try {
      // const response = await fetch("https://horseracesbackend-production.up.railway.app/api/save-race", {
      const response = await fetch("https://horseracesbackend-production.up.railway.app/api/save-race", {  
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(raceData),
      });
  
      if (response.ok) {
        console.log("Race selection saved successfully!");
      } else {
        const errorText = await response.text();
        console.error("Failed to save race selection:", errorText);
      }
    } catch (error) {
      console.error("Error saving race selection:", error);
    }
  };

const handleTrackClick = async (race) => {
  if (trackedRaces.includes(race.raceTitle)) return;

  const raceData = {
    meetingDate,
    raceTitle: race.raceTitle,
    countryCode: race.countryCode,
    courseName: race.courseName,
    courseId: race.courseId,
    raceNumber: race.raceNumber,
    raceSurfaceName: race.raceSurfaceName,
    numberOfRunners: race.numberOfRunners,
    prizeFund: race.prizeFund,
    allHorses: race.allHorses,
    user: (() => {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser).userId : "Guest";
    })(),
  };

  try {
    const response = await fetch("https://horseracesbackend-production.up.railway.app/api/save-race", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(raceData),
    });

    if (response.ok) {
      console.log("Race saved");
      setTrackedRaces((prev) => [...prev, race.raceTitle]);
    } else {
      const errorText = await response.text();
      console.error("Failed to save race:", errorText);
    }
  } catch (error) {
    console.error("Error saving race:", error);
  }
};

   return (
  <div className="mt-12 mb-8 flex flex-col gap-4">
    {/* Quick dates bar with SELECT DATE */}
    <QuickDatesBar
      currentISO={meetingDate}
      onPick={setMeetingDate}
      dateInputRef={dateInputRef}
    />



    {loading && (
      <Typography variant="small" className="text-center text-blue-gray-600 mt-6">
        Loading data...
      </Typography>
    )}

    {/* Countries (expandable) */}
    {/* Countries (expandable) */}
<div className="space-y-3">
  {Object.entries(groupedByCountry)
    // sort by full country name instead of code
    .sort(
      ([a], [b]) =>
        (countryNameMap[a] || a).localeCompare(countryNameMap[b] || b)
    )
    .map(([country, tracksObj]) => {
      const isCountryOpen = openCountries.has(country);
      const totalRaces = Object.values(tracksObj).reduce(
        (acc, arr) => acc + arr.length,
        0
      );
      // display label
      const countryLabel = countryNameMap[country] || country;

      return (
        <div key={country} className="rounded-lg border border-gray-200 bg-white">
          <button
            onClick={() => toggleCountry(country)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              {isCountryOpen ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
              {/* use full name here */}
              <span className="font-semibold">{countryLabel}</span>
            </div>
            <span className="text-xs text-gray-500">{totalRaces} races</span>
          </button>

          {/* Tracks (expandable) */}
          {isCountryOpen && (
            <div className="border-t">
              {/* INDENT from country -> track */}
              <div className="pl-4 md:pl-6 lg:pl-8 border-l-2 border-gray-200">
                {Object.entries(tracksObj)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([course, races]) => {
                    const isTrackOpen = (openTracks[country] || new Set()).has(course);
                    const surface = races[0]?.raceSurfaceName || "";

                    return (
                      <div key={course} className="bg-gray-50 rounded-md my-2">
                        <button
                          onClick={() => toggleTrack(country, course)}
                          className="w-full flex items-center justify-between px-4 md:px-5 py-3 hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            {isTrackOpen ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                            <span className="font-semibold uppercase">{course}</span>
                            {surface && (
                              <span className="text-xs uppercase tracking-wide text-gray-500">
                                {surface}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{races.length} races</span>
                        </button>

                        {/* Race bars (expandable → outcomes) */}
                        {isTrackOpen && (
                          <div className="border-t">
                            {/* INDENT from track -> race */}
                            <div className="pl-4 md:pl-6 lg:pl-8 border-l-2 border-gray-200">
                              <div className="divide-y bg-white rounded-md">
                                {races.map((race, idx) => {
                                  const isOpen = openRaces.has(race.raceTitle);
                                  const tableData =
                                    recordsMap[race.raceTitle] || race.records;

                                  return (
                                    <RaceBar
                                      key={race.raceTitle || idx}
                                      race={race}
                                      isOpen={isOpen}
                                      isTracked={trackedRaces.includes(race.raceTitle)}
                                      onToggle={handleRaceToggle}
                                      onTrackClick={handleTrackClick}
                                      tableData={tableData}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      );
    })}
</div>


    {logs.length > 0 && <Logs logs={logs} />}
  </div>
);




}

export default Races;
