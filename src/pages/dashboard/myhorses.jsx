import React, { useState, useEffect } from "react";
import { Typography, Button, Textarea } from "@material-tailwind/react";

const TableView = ({ tableData, onSaveHorse, onDeleteHorse }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });
  };

  const getCountryCode = (country) => {
    const countryMap = {
      UK: "gb", // Map 'UK' to 'gb' for United Kingdom
      US: "us", // Map 'US' to 'us'
      // Add additional mappings if needed
    };
    return countryMap[country.toUpperCase()] || country.toLowerCase();
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300 text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1 border text-left w-1/20">Horse</th>
            <th className="px-2 py-1 border text-center">Country</th>
            <th className="px-2 py-1 border text-center">Runs</th>
            <th className="px-2 py-1 border text-center">Wins</th>
            <th className="px-2 py-1 border text-center">Stakes Wins</th>
            <th className="px-2 py-1 border text-center">Group Wins</th>
            <th className="px-2 py-1 border text-center">Group 1 Wins</th>
            <th className="px-2 py-1 border text-center">Date</th>
            <th className="px-2 py-1 border text-center">Notes</th>
            <th className="px-2 py-1 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((horse) => (
            <tr key={horse.id}>
              <td className="px-2 py-1 border text-left whitespace-normal">
                {horse.Sire || "N/A"}
              </td>
              <td className="px-2 py-1 border text-center">
                {horse.Country ? (
                  <div className="flex items-center justify-center space-x-2">
                    <img
                      src={`https://flagcdn.com/w40/${getCountryCode(horse.Country)}.png`}
                      alt={horse.Country}
                      className="h-4 w-6"
                    />
                    <span>{horse.Country}</span>
                  </div>
                ) : (
                  "N/A"
                )}
              </td>
              <td className="px-2 py-1 border text-center">{horse.Runs || 0}</td>
              <td className="px-2 py-1 border text-center">{horse.Wins || 0}</td>
              <td className="px-2 py-1 border text-center">{horse.Stakes_Wins || 0}</td>
              <td className="px-2 py-1 border text-center">{horse.Group_Wins || 0}</td>
              <td className="px-2 py-1 border text-center">{horse.Group_1_Wins || 0}</td>
              <td className="px-2 py-1 border text-center">
                {horse.created_at ? formatDate(horse.created_at) : "N/A"}
              </td>
              <td className="px-2 py-1 border text-center">
                <Textarea
                  value={horse.notes || ""}
                  onChange={(e) => onSaveHorse(horse.id, e.target.value, false)}
                  className="text-xs"
                  placeholder="Add notes here"
                />
              </td>
              <td className="px-2 py-1 border text-center">
                <Button
                  color="red"
                  size="sm"
                  className="text-xs mr-2"
                  onClick={() => onDeleteHorse(horse.id)}
                >
                  Delete
                </Button>
                <Button
                  color="blue"
                  size="sm"
                  className="text-xs"
                  onClick={() => onSaveHorse(horse.id, horse.notes, true)}
                >
                  Save Notes
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export function MyHorses() {
  const [tableData, setTableData] = useState([]);
  const [error, setError] = useState(null);

  const fetchAllData = async () => {
    try {
      const response = await fetch(
        `https://horseracesbackend-production.up.railway.app/api/selected_horses`
      );
      const result = await response.json();
      if (Array.isArray(result)) {
        setTableData(result);
      } else {
        console.error("Unexpected response format:", result);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
    }
  };

  const saveHorse = async (id, notes, saveToServer = false) => {
    setTableData((prevData) =>
      prevData.map((horse) =>
        horse.id === id ? { ...horse, notes } : horse
      )
    );

    if (saveToServer) {
      try {
        const response = await fetch(
          `https://horseracesbackend-production.up.railway.app/api/selected_horses/${id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ notes }),
          }
        );

        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(`Failed to update notes: ${errorMessage}`);
        }

        alert("Notes updated successfully!");
      } catch (error) {
        console.error("Error updating notes:", error);
        alert("Failed to update notes. Please try again.");
      }
    }
  };

  const deleteHorse = async (id) => {
    try {
      const response = await fetch(
        `https://horseracesbackend-production.up.railway.app/api/selected_horses/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to delete horse: ${errorMessage}`);
      }

      setTableData((prevData) => prevData.filter((horse) => horse.id !== id));
    } catch (error) {
      console.error("Error deleting horse:", error);
      alert("Failed to delete horse. Please try again.");
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (error) {
    return <Typography color="red">{error}</Typography>;
  }

  return (
    <div className="mt-12 mb-8">
      <TableView
        tableData={tableData}
        onSaveHorse={saveHorse}
        onDeleteHorse={deleteHorse}
      />
    </div>
  );
}

export default MyHorses;
