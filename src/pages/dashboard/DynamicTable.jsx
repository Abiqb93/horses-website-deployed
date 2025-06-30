import React, { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import SectionalDataTable from "./SectionalDataTable"; 

const excludedColumns = new Set([
  "raceNumber", "courseId", "preRaceMasterRating", "preRaceAdjustedRating",
  "distanceCumulative", "bSPAdvantage", "betfairWinSP", "draw", "horseAge",
  "horseGender", "jockeyFullName", "trainerFullName", "ownerFullName",
  "sectionalFinishingTime", "distanceSectional", "winnerSectional",
  "leaderSectional", "finishingTime", "raceClass", "prizeFund",
  "raceSurfaceName", "damName", "sireName"
]);

const numericColumns = new Set([
  "positionOfficial", "distance", "numberOfRunners", "prizeFundWinner",
  "hotRace", "performanceRating", "prizeMoneyWon"
]);

const DynamicTable = ({ data, refreshHorseData }) => {
  const [sortBy, setSortBy] = useState("");
  const [order, setOrder] = useState("asc");
  const [visibleRows, setVisibleRows] = useState(5);
  const [filters, setFilters] = useState({ discipline: "", year: "", trainer: "", owner: "" });
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingData, setTrackingData] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [isTracked, setIsTracked] = useState(false);
  const [trackingDate, setTrackingDate] = useState(null);
  const [trackingRefreshFlag, setTrackingRefreshFlag] = useState(0);
  const [activeTab, setActiveTab] = useState("history"); // Default to history tab
  const [trackingType, setTrackingType] = useState("Prospect");

  const sortedByDate = data && data.length > 0
    ? [...data].sort((a, b) => new Date(b.meetingDate) - new Date(a.meetingDate))
    : [];

  const latestRecord = sortedByDate[0];

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/horseTracking/${latestRecord?.horseName}`);
        
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          setTrackingData(json.data);
          setIsTracked(true);
          setTrackingDate(json.data[0]?.trackingDate ?? null);
        } else {
          setTrackingData([]);
          setIsTracked(false);
          setTrackingDate(null);
        }
      } catch (err) {
        console.error("Error fetching tracking data:", err);
      }
    };

    if (latestRecord?.horseName) fetchTracking();
  }, [latestRecord?.horseName, trackingRefreshFlag]);


  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-500 mt-4">No data found.</p>;
  }

  if (!latestRecord) {
    return <p className="text-sm text-gray-500 mt-4">No valid horse record to show.</p>;
  }

  const {
    horseName,
    horseAge,
    foalingDate,
    horseGender,
    horseColour,
    sireName,
    damName,
    countryCode,
    performanceRating,
  } = latestRecord;


  const user = localStorage.getItem("userId") || "Guest";

  const handleTrackHorse = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        horseName,
        note: note.trim(),
        trackingDate: new Date().toISOString(),
        TrackingType: trackingType,
        User: user,
      };

      console.log("Tracking payload being sent:", payload);

      // const res = await fetch("https://horseracesbackend-production.up.railway.app/api/horseTracking", {
      const res = await fetch("https://horseracesbackend-production.up.railway.app/api/horseTracking", {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to track horse");

      // ✅ Immediately set UI to reflect tracked status
      setIsTracked(true);
      setShowNotes(true);
      setTrackingDate(new Date().toISOString());

      // ✅ Clear the input field
      setNote("");

      // ✅ Re-fetch full tracking notes to update the list
      const refreshTrackingData = async () => {
        try {
          // const r = await fetch(`https://horseracesbackend-production.up.railway.app/api/horseTracking/${horseName}`);
          const r = await fetch(`https://horseracesbackend-production.up.railway.app/api/horseTracking/${horseName}`);

          const json = await r.json();
          setTrackingData(Array.isArray(json.data) ? json.data : []);
        } catch (err) {
          console.error("Error re-fetching tracking list:", err);
        }
      };

      await refreshTrackingData();

      // ✅ Trigger parent refresh (e.g. to reload race table)
      if (typeof refreshHorseData === 'function') refreshHorseData();

    } catch (err) {
      console.error("Error tracking horse:", err);
      alert("Error tracking horse.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleStopTracking = async () => {
    if (!window.confirm(`Are you sure you want to stop tracking ${horseName}?`)) return;
    try {
      // const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/horseTracking/${horseName}`, {
      const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/horseTracking/${horseName}`, {
        
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to stop tracking");
      setIsTracked(false);
      setTrackingData([]);
      setTrackingDate(null);
    } catch (err) {
      console.error("Error stopping tracking:", err);
      alert("Failed to stop tracking.");
    }
  };

  const filteredColumns = Object.keys(data[0]).filter(key => !excludedColumns.has(key));
  const disciplineOptions = [...new Set(data.map(d => d.raceType).filter(Boolean))].sort();
  const yearOptions = [...new Set(data.map(d => new Date(d.meetingDate).getFullYear()).filter(Boolean))].sort((a, b) => b - a);
  const trainerOptions = [...new Set(data.map(d => d.trainerFullName).filter(Boolean))].sort();
  const ownerOptions = [...new Set(data.map(d => d.ownerFullName).filter(Boolean))].sort();

  const filteredData = data.filter(row => {
    const matchDiscipline = !filters.discipline || row.raceType === filters.discipline;
    const matchYear = !filters.year || new Date(row.meetingDate).getFullYear().toString() === filters.year;
    const matchTrainer = !filters.trainer || row.trainerFullName === filters.trainer;
    const matchOwner = !filters.owner || row.ownerFullName === filters.owner;
    return matchDiscipline && matchYear && matchTrainer && matchOwner;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortBy) return 0;
    const valA = a[sortBy] ?? "";
    const valB = b[sortBy] ?? "";
    return numericColumns.has(sortBy)
      ? order === "asc" ? Number(valA) - Number(valB) : Number(valB) - Number(valA)
      : order === "asc" ? valA.toString().localeCompare(valB.toString()) : valB.toString().localeCompare(valA.toString());
  });

  const handleShowMore = () => setVisibleRows(prev => prev + 5);

  const ownerList = [...new Set(data.map(d => d.ownerFullName).filter(Boolean))];
  const trainerList = [...new Set(data.map(d => d.trainerFullName).filter(Boolean))];
  const maxPrize = Math.max(...data.map(d => Number(d.prizeFund || 0)));

return (
  <Card className="bg-white text-black mt-4">
    <CardBody className="px-6 pt-6 pb-4">
      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b pb-2">
        <button
          onClick={() => setActiveTab("history")}
          className={`text-sm px-3 py-1 rounded-t-md border-b-2 ${activeTab === "history" ? "border-blue-600 text-blue-700 font-semibold" : "border-transparent text-gray-500"}`}
        >
          Races History
        </button>
        <button
          onClick={() => setActiveTab("sectional")}
          className={`text-sm px-3 py-1 rounded-t-md border-b-2 ${activeTab === "sectional" ? "border-blue-600 text-blue-700 font-semibold" : "border-transparent text-gray-500"}`}
        >
          Sectional Data
        </button>
      </div>

      {/* Horse Summary */}
      <div className="mb-6 p-4 rounded-xl shadow bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-300 relative">
        <div className="absolute top-4 right-4 flex flex-col items-end space-y-2">
          <select
            className="text-xs border rounded px-2 py-1"
            value={trackingType}
            onChange={(e) => setTrackingType(e.target.value)}
          >
            <option value="Prospect">Prospect</option>
            <option value="Purchase">Purchase</option>
            <option value="Future Bet">Future Bet</option>
            <option value="Stallion">Stallion</option>
            <option value="Mare">Mare</option>
            <option value="Relative">Relative</option>
          </select>
          <div className="flex space-x-2 items-center">
            <input
              type="text"
              placeholder="Add a note..."
              className="text-xs px-2 py-1 border rounded"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded"
              onClick={handleTrackHorse}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : isTracked ? "+ Add Note" : "+ Track"}
            </button>
          </div>

          {isTracked && (
            <>
              <button className="px-3 py-1 bg-green-700 text-white text-xs rounded">
                Tracked as {trackingData?.[0]?.TrackingType || "Unspecified"}
              </button>
              {trackingDate && (
                <Typography className="text-[10px] italic text-gray-500 mt-1">
                  Since {new Date(trackingDate).toLocaleString()}
                </Typography>
              )}
              <button
                className="text-[10px] text-red-600 underline mt-1"
                onClick={handleStopTracking}
              >
                Stop Tracking
              </button>
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="mt-2 text-xs px-2 py-1 border rounded bg-white hover:bg-gray-100"
              >
                {showNotes ? "Hide Notes" : "View Notes"}
              </button>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Typography variant="h5" className="font-bold text-blue-800">{horseName}</Typography>
            <Typography className="text-sm text-gray-700">Age: {horseAge || "-"} (Foaled: {foalingDate || "-"})</Typography>
            <Typography className="text-sm text-gray-700">Sex: {horseGender || "-"} | Colour: {horseColour || "-"}</Typography>
            <Typography className="text-sm text-gray-700">Sire: <span className="font-medium">{sireName || "-"}</span> | Dam: <span className="font-medium">{damName || "-"}</span></Typography>
            <Typography className="text-sm text-gray-700">Country: {countryCode || "-"}</Typography>
          </div>
          <div className="space-y-1">
            <Typography className="text-sm text-gray-700">Trainer(s): {trainerList.join(", ")}</Typography>
            <Typography className="text-sm text-gray-700">Owner(s): {ownerList.join(", ")}</Typography>
            <Typography className="text-sm text-gray-700">Latest Rating: <span className="font-semibold">{performanceRating || "-"}</span></Typography>
            <Typography className="text-sm text-gray-700">Top Prize: <span className="font-semibold">{maxPrize || "-"}</span></Typography>
          </div>
        </div>

        {isTracked && showNotes && (
          <div className="mt-4 bg-white border border-gray-200 rounded-md p-2 max-h-48 overflow-y-auto">
            <Typography className="text-sm font-medium mb-1 text-gray-700">Tracking Notes:</Typography>
            {Array.isArray(trackingData) && trackingData.length > 0 ? (
              trackingData.map((entry, idx) => (
                <div key={idx} className="text-xs mb-1 border-b pb-1">
                  <div><strong>Note:</strong> {entry?.note || "-"}</div>
                  <div><strong>Date:</strong> {entry?.trackingDate ? new Date(entry.trackingDate).toLocaleString() : "-"}</div>
                </div>
              ))
            ) : (
              <p className="text-xs italic text-gray-500">No notes available yet.</p>
            )}
          </div>
        )}
      </div>

      {/* History Tab Content */}
      {activeTab === "history" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <select className="text-xs p-2 border rounded" value={filters.discipline} onChange={(e) => setFilters(prev => ({ ...prev, discipline: e.target.value }))}>
              <option value="">Discipline</option>
              {disciplineOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="text-xs p-2 border rounded" value={filters.year} onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}>
              <option value="">Year</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="text-xs p-2 border rounded" value={filters.trainer} onChange={(e) => setFilters(prev => ({ ...prev, trainer: e.target.value }))}>
              <option value="">Trainer</option>
              {trainerOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="text-xs p-2 border rounded" value={filters.owner} onChange={(e) => setFilters(prev => ({ ...prev, owner: e.target.value }))}>
              <option value="">Owner</option>
              {ownerOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-blue-gray-50 text-blue-gray-700 text-[11px] uppercase">
                <tr>
                  {filteredColumns.map((key) => (
                    <th key={key} className={`px-3 py-2 border-b ${key === "raceTitle" ? "w-[300px] min-w-[300px]" : ""} cursor-pointer hover:text-blue-500`} onClick={() => {
                      if (sortBy === key) {
                        setOrder(order === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy(key);
                        setOrder("asc");
                      }
                    }}>
                      {key}
                      <span className="ml-1">{sortBy === key ? (order === "asc" ? "🔼" : "🔽") : "↕"}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.slice(0, visibleRows).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {filteredColumns.map((key) => (
                      <td key={key} className="px-3 py-2 border-b text-[11px] whitespace-nowrap">
                        {row[key] !== null && row[key] !== undefined ? row[key] : "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center items-center mt-4 gap-2 text-xs">
            {visibleRows < sortedData.length ? (
              <button onClick={handleShowMore} className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300">
                Show More
              </button>
            ) : (
              <p className="text-gray-500 text-sm">End of records</p>
            )}
          </div>
        </>
      )}

      {/* Sectional Tab Content */}
      {activeTab === "sectional" && (
        <SectionalDataTable horseName={horseName} />
      )}
    </CardBody>
  </Card>
);
};

export default DynamicTable;
