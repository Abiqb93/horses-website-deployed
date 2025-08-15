import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import SectionalDataTable from "./SectionalDataTable"; 
import RacingTVDataTable from "./RacingTVDataTable";

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

  // Group records by (horseName, foalingDate)
  const groupedByHorse = data.reduce((acc, row) => {
    const key = `${row.horseName}_${row.foalingDate}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  // Find the group with the latest meetingDate
  let latestHorseKey = null;
  let latestHorseRecord = null;

  Object.entries(groupedByHorse).forEach(([key, records]) => {
    const mostRecent = records.reduce((a, b) =>
      new Date(a.meetingDate) > new Date(b.meetingDate) ? a : b
    );
    if (
      !latestHorseRecord ||
      new Date(mostRecent.meetingDate) > new Date(latestHorseRecord.meetingDate)
    ) {
      latestHorseRecord = mostRecent;
      latestHorseKey = key;
    }
  });

  const [selectedHorseName, selectedFoalingDate] = latestHorseKey
    ? latestHorseKey.split("_")
    : [null, null];

  const filteredHorseRecords = data.filter(
    (d) =>
      d.horseName === selectedHorseName &&
      d.foalingDate === selectedFoalingDate
  );

  const latestRecord = latestHorseRecord;


  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser).userId : "Guest";
        const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/horseTracking/${latestRecord?.horseName}?user=${user}`);
        
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


  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser).userId : "Guest";

  const handleTrackHorse = async () => {
    setIsSubmitting(true);
    try {
      // If tracked already, require a non-empty note for "+ Add Note"
      if (isTracked && !note.trim()) {
        alert("Please write a note before adding.");
        setIsSubmitting(false);
        return;
      }

      const mostRecent = latestRecord || {};
      const trackingTypeToSend = isTracked
        ? (trackingData?.[0]?.TrackingType ?? trackingType) // preserve original
        : trackingType;

      const payload = {
        horseName,
        note: (isTracked ? note.trim() : (note || "").trim()), // first track allows empty
        trackingDate: new Date().toISOString(),
        TrackingType: trackingTypeToSend,
        User: user,
        sireName: mostRecent?.sireName || "",
        damName: mostRecent?.damName || "",
        ownerFullName: mostRecent?.ownerFullName || "",
        trainerFullName: mostRecent?.trainerFullName || "",
        horseAge: mostRecent?.horseAge || "",
        horseGender: mostRecent?.horseGender || "",
        horseColour: mostRecent?.horseColour || "",
      };

      const res = await fetch("https://horseracesbackend-production.up.railway.app/api/horseTracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to track horse");

      // Refresh tracking list and UI
      const r = await fetch(`https://horseracesbackend-production.up.railway.app/api/horseTracking/${horseName}?user=${user}`);
      const json = await r.json();
      const newData = Array.isArray(json.data) ? json.data : [];
      setTrackingData(newData);
      setIsTracked(true);
      setShowNotes(true);
      setTrackingDate(newData[0]?.trackingDate ?? new Date().toISOString());

      if (typeof refreshHorseData === "function") refreshHorseData();
      setNote("");
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
      const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/horseTracking/${horseName}?user=${user}`, {
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

const filteredColumns = [
  "positionOfficial",
  "countryCode",
  "raceType",
  "distance",
  "raceTitle",
  "going",
  "numberOfRunners",
  "prizeFundWinner",
  "performanceRating",
  "meetingDate",
  "courseName"
];


  const disciplineOptions = [...new Set(
    filteredHorseRecords.map(d => d.raceType).filter(Boolean)
  )].sort();

  const yearOptions = [...new Set(
    filteredHorseRecords.map(d => new Date(d.meetingDate).getFullYear()).filter(Boolean)
  )].sort((a, b) => b - a);

  const trainerOptions = [...new Set(
    filteredHorseRecords.map(d => d.trainerFullName).filter(Boolean)
  )].sort();

  const ownerOptions = [...new Set(
    filteredHorseRecords.map(d => d.ownerFullName).filter(Boolean)
  )].sort();

  const filteredData = filteredHorseRecords.filter(row => {
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

    const formatDate = (date) => {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

const columnHeaderMap = {
  positionOfficial: "Position",
  horseName: "Horse",
  countryCode: "Country",
  raceType: "Race Type",
  distance: "Distance",
  raceTitle: "Title",
  going: "Going",
  numberOfRunners: "Runners",
  prizeFundWinner: "Prize",
  performanceRating: "Performance Rating",
  meetingDate: "Date",
  courseName: "Course"
};

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

        <button
          onClick={() => setActiveTab("stride")}
          className={`text-sm px-3 py-1 rounded-t-md border-b-2 ${activeTab === "stride" ? "border-blue-600 text-blue-700 font-semibold" : "border-transparent text-gray-500"}`}
        >
          Stride Data
        </button>
      </div>

      {/* Horse Summary */}
      <div className="mb-6 p-4 rounded-xl shadow bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-300 relative">
        
        {/* Top-right controls now only show Track button if not tracked */}
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

          {!isTracked && (
            <button
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded"
              onClick={handleTrackHorse}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "+ Track"}
            </button>
          )}

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

            </>
          )}
        </div>

        {/* Horse details */}
        <div className="space-y-1">
{/* Horse name + Latest Rating inline and prominent */}
<div className="flex items-center gap-4">
  <Typography variant="h5" className="font-bold text-blue-800">
    {horseName}
  </Typography>
  <Typography className="text-base font-bold text-gray-800">
    Latest Rating: <span className="text-lg text-blue-700 font-extrabold">{performanceRating || "-"}</span>
  </Typography>
</div>
  <Typography className="text-sm text-gray-700">
    {sireName ? `${sireName} (S)` : "-"} | {damName ? `${damName} (D)` : "-"} | {horseColour ? `${horseColour} (C)` : "-"} | {horseGender ? `${horseGender} (G)` : "-"}
  </Typography>

  <Typography className="text-sm text-gray-700">
    Foaled: {foalingDate ? new Date(foalingDate).toLocaleDateString("en-GB").replaceAll("/", "-") : "-"}
  </Typography>

  <Typography className="text-sm text-gray-700">
    Trainer(s): {trainerList.length > 0 ? trainerList.join(", ") : "-"}
  </Typography>

  <Typography className="text-sm text-gray-700">
    Owner(s): {ownerList.length > 0 ? ownerList.join(", ") : "-"}
  </Typography>

  <Typography className="text-sm text-gray-700">
    Top Prize: <span className="font-semibold">{maxPrize || "-"}</span>
  </Typography>

  {/* Add Note + View Notes goes here if tracked */}
  {isTracked && (
    <>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          placeholder="Add a note..."
          className="text-xs px-3 py-2 border rounded-full flex-grow focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          className="text-[11px] font-medium text-blue-700 hover:underline focus:outline-none"
          onClick={handleTrackHorse}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "+ Add Note"}
        </button>
      </div>

      <div className="mt-1">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="text-[11px] text-gray-600 hover:underline focus:outline-none"
        >
          {showNotes ? "Hide Notes" : "View Notes"}
        </button>
      </div>
    </>
  )}
        </div>


        {/* Notes list */}
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
                    <th
                      key={key}
                      className={`px-3 py-2 border-b ${key === "raceTitle" ? "w-[300px] min-w-[300px]" : ""} cursor-pointer hover:text-blue-500`}
                      onClick={() => {
                        if (sortBy === key) {
                          setOrder(order === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy(key);
                          setOrder("asc");
                        }
                      }}
                    >
                      {columnHeaderMap[key] || key}
                      <span className="ml-1">
                        {sortBy === key ? (order === "asc" ? "🔼" : "🔽") : "↕"}
                      </span>
                    </th>
                  ))}

                </tr>
              </thead>
              <tbody>
                {sortedData.slice(0, visibleRows).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {filteredColumns.map((key) => (
                      <td key={key} className="px-3 py-2 border-b text-[11px] whitespace-nowrap">
                        {key === "raceTitle" ? (
                          <Link
                            to={`/dashboard/racedetails?url=${encodeURIComponent(
                              "https://horseracesbackend-production.up.railway.app/api/APIData_Table2"
                            )}&RaceTitle=${encodeURIComponent(
                              row.raceTitle?.trim().toLowerCase() || ""
                            )}&meetingDate=${formatDate(row.meetingDate)}`}
                            className="text-indigo-700 font-medium hover:underline"
                          >
                            {row[key]}
                          </Link>
                        ) : key === "meetingDate" ? (
                          row[key] ? new Date(row[key]).toLocaleDateString("en-GB").replaceAll("/", "-") : "-"
                        ) : (
                          row[key] !== null && row[key] !== undefined ? row[key] : "-"
                        )}
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

      {activeTab === "stride" && (
        <RacingTVDataTable horseName={horseName} />
      )}


    </CardBody>
  </Card>
);
};

export default DynamicTable;
