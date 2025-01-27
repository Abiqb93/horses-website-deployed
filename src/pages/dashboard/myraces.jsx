import React, { useState, useEffect } from "react";

export function MyRace() {
  const [raceData, setRaceData] = useState([]); // State to store race data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRaceData = async () => {
      try {
        const response = await fetch("https://horseracesbackend-production.up.railway.app/api/race_selection_log");
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json();
        setRaceData(data.data); // Use `data.data` to extract the actual records
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRaceData();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this record?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/race_selection_log/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      // Remove the deleted record from the UI
      setRaceData((prevData) => prevData.filter((race) => race.id !== id));
      alert("Record deleted successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete the record. Please try again.");
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-lg font-bold mb-4">Race Selection Log</h1>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!isLoading && !error && raceData.length > 0 && (
        <table className="table-auto border-collapse border border-gray-300 w-full text-sm bg-white shadow-md">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-2 py-2 w-12">ID</th>
              <th className="border border-gray-300 px-2 py-2 w-32">Meeting Date</th>
              <th className="border border-gray-300 px-2 py-2 w-64">Race Title</th>
              <th className="border border-gray-300 px-2 py-2 w-16">Country</th>
              <th className="border border-gray-300 px-2 py-2 w-32">Course</th>
              <th className="border border-gray-300 px-2 py-2 w-32">Race Surface</th>
              <th className="border border-gray-300 px-2 py-2 w-20">Number of Runners</th>
              <th className="border border-gray-300 px-2 py-2 w-20">Prize Fund</th>
              <th className="border border-gray-300 px-2 py-2 w-20">User</th>
              <th className="border border-gray-300 px-2 py-2 w-96">Horses</th>
              <th className="border border-gray-300 px-2 py-2 w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {raceData.map((race) => {
              const horses = JSON.parse(race.allHorses).sort(
                (a, b) => a.positionOfficial - b.positionOfficial
              );

              return (
                <tr key={race.id} className="hover:bg-gray-100">
                  <td className="border border-gray-300 px-2 py-2">{race.id}</td>
                  <td className="border border-gray-300 px-2 py-2">
                    {new Date(race.meetingDate).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-300 px-2 py-2">{race.raceTitle}</td>
                  <td className="border border-gray-300 px-2 py-2">{race.countryCode}</td>
                  <td className="border border-gray-300 px-2 py-2">{race.courseName}</td>
                  <td className="border border-gray-300 px-2 py-2">{race.raceSurfaceName}</td>
                  <td className="border border-gray-300 px-2 py-2">{race.numberOfRunners}</td>
                  <td className="border border-gray-300 px-2 py-2">{race.prizeFund}</td>
                  <td className="border border-gray-300 px-2 py-2">{race.user}</td>
                  <td className="border border-gray-300 px-2 py-2">
                    <ul className="list-disc ml-4">
                      {horses.map((horse, index) => (
                        <li key={index} className="py-1">
                          {horse.positionOfficial}. {horse.horseName}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    <button
                      onClick={() => handleDelete(race.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {!isLoading && !error && raceData.length === 0 && <p>No race data available.</p>}
    </div>
  );
};

export default MyRace;
