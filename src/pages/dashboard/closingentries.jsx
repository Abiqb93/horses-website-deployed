import React, { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { Link } from "react-router-dom";


export function ClosingEntries() {
  const [entries, setEntries] = useState([]);
  const [expandedKey, setExpandedKey] = useState(null);
  const [expandedRaceId, setExpandedRaceId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // const response = await fetch("http://localhost:8080/api/ClosingEntries");
      const response = await fetch("https://horseracesbackend-production.up.railway.app/api/ClosingEntries");
      
      const data = await response.json();
      setEntries(data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const formatDate = (dateStr) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj)) return dateStr;
    return dateObj.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const groupDataByDateTrack = () => {
    const grouped = {};
    entries.forEach((item) => {
      const date = item.date;
      const track = item.track;
      if (!grouped[date]) grouped[date] = {};
      if (!grouped[date][track]) grouped[date][track] = [];
      grouped[date][track].push(item);
    });
    return grouped;
  };

  const toggleExpanded = (track, date) => {
    const key = `${track}-${date}`;
    setExpandedKey((prev) => (prev === key ? null : key));
    setExpandedRaceId(null);
  };

  const toggleRaceDetails = (raceID) => {
    setExpandedRaceId((prev) => (prev === raceID ? null : raceID));
  };

  const groupedData = groupDataByDateTrack();

  return (
    <div className="mt-8 mb-6 px-4 flex flex-col gap-4">
      {Object.entries(groupedData).map(([date, tracks]) => (
        <div key={date}>
          <Typography variant="h6" className="text-gray-800 font-medium mb-2">
            Racing on {formatDate(date)}
          </Typography>

          {Object.entries(tracks).map(([track, races]) => {
            const key = `${track}-${date}`;
            const isExpanded = expandedKey === key;

            // Unique races for this track-date
            const uniqueRaces = Array.from(
              new Map(races.map((item) => [item.race_id, item])).values()
            );

            return (
              <div key={key}>
                <Card
                  className="shadow-sm border border-gray-200 mb-1 px-4 py-2 cursor-pointer"
                  onClick={() => toggleExpanded(track, date)}
                >
                  <CardBody className="p-0 flex items-center justify-between text-sm text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-red-700 font-bold uppercase">{track}</span>
                      <span>/ {formatDate(date)}</span>
                    </div>
                    <div className="text-gray-600 text-sm">
                      {uniqueRaces.length} race{uniqueRaces.length > 1 ? "s" : ""}
                    </div>
                  </CardBody>
                </Card>

                {isExpanded && (
                  <div className="ml-4 mt-2 mb-4 space-y-2">
                    {uniqueRaces.map((race, idx) => (
                      <div key={idx}>
                        <div
                          onClick={() => toggleRaceDetails(race.race_id)}
                          className="flex justify-between items-start bg-white border border-gray-200 px-4 py-3 rounded-md text-sm shadow-sm hover:shadow-md transition cursor-pointer"
                        >
                          <div className="flex flex-col gap-1 max-w-[60%]">
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-900 text-white text-xs font-bold px-2 py-1 rounded">
                                {race.race_id}
                              </span>
                              <span className="font-medium">{race.time}</span>
                              <span className="font-normal text-gray-700">{race.title}</span>
                            </div>
                            <span className="text-gray-500">{race.status}</span>
                          </div>
                          <div className="flex flex-wrap justify-end gap-x-6 gap-y-1 text-gray-700 text-right">
                            <div><strong>{race.distance}</strong></div>
                            <div><strong>{race.age_group}</strong></div>
                            <div><strong>{race.prize_money}</strong></div>
                            <div><strong>{race.confirmation_deadline}</strong></div>
                          </div>
                        </div>

                        {expandedRaceId === race.race_id && (
                          <Card className="bg-white text-black mt-2">
                            <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
                              <table className="w-full min-w-[640px] table-auto">
                                <thead>
                                  <tr>
                                    {["Horse", "Rider", "Age", "Sex", "Weight", "Trainer", "Owner"].map((col) => (
                                      <th
                                        key={col}
                                        className="border-b border-blue-gray-50 py-3 px-5 text-left bg-gray-100"
                                      >
                                        <Typography variant="small" className="text-[11px] font-bold uppercase">
                                          {col}
                                        </Typography>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {entries
                                    .filter((e) => e.race_id === race.race_id)
                                    .map((record, i) => (
                                      <tr key={i}>
                                        {[
                                          record.Horse,
                                          record.Rider,
                                          record.Age,
                                          record.Sex,
                                          record.Weight,
                                          record.Trainer,
                                          record.Owner,
                                        ].map((value, j) => (
                                          <td key={j} className="py-3 px-5 border-b border-blue-gray-50">
                                            {j === 0 ? (
                                              <Typography className="text-xs font-semibold text-blue-700 underline">
                                                <Link
                                                  to={`/dashboard/horse/${encodeURIComponent(record.Horse?.trim())}`}
                                                  className="text-blue-700 underline hover:text-blue-900 text-xs font-semibold"
                                                >
                                                  {record.Horse ?? "-"}
                                                </Link>
                                              </Typography>
                                            ) : (
                                              <Typography className="text-xs font-semibold text-blue-gray-600">
                                                {value ?? "-"}
                                              </Typography>
                                            )}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </CardBody>
                          </Card>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default ClosingEntries;
