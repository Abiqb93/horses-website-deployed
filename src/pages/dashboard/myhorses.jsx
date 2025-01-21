import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Typography, Button, Textarea } from "@material-tailwind/react";

const TileView = ({ tableData, onSaveHorse, onDeleteHorse }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {tableData.map((horse) => (
        <Card key={horse.id} className="bg-white shadow-md">
          <CardHeader className="p-4 bg-blue-gray-100">
            <Typography variant="h6" className="text-black text-sm">
              {horse.Sire || "Unknown Sire"}
            </Typography>
            <Typography variant="subtitle2" className="text-blue-gray-400 text-xs">
              {horse.Country || "Unknown Country"}
            </Typography>
          </CardHeader>
          <CardBody>
            <div className="mb-2">
              {Object.entries(horse).map(([key, value]) => (
                key !== "Sire" &&
                key !== "Country" &&
                key !== "notes" && (
                  <Typography
                    key={key}
                    variant="small"
                    className="text-blue-gray-600 text-xs"
                  >
                    {key}: {value !== null && value !== undefined ? value : "-"}
                  </Typography>
                )
              ))}
            </div>
            <div className="mt-4">
              <Textarea
                label="Notes"
                value={horse.notes || ""}
                onChange={(e) => onSaveHorse(horse.id, e.target.value, false)} // Update locally
                className="w-full text-xs"
              />
            </div>
          </CardBody>
          <div className="p-2 flex justify-between">
            <Button
              color="red"
              size="sm"
              className="text-xs"
              onClick={() => onDeleteHorse(horse.id)} // Call delete function
            >
              Delete
            </Button>
            <Button
              color="blue"
              size="sm"
              className="text-xs"
              onClick={() => onSaveHorse(horse.id, horse.notes, true)} // Save to server
            >
              Save Notes
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export function MyHorses() {
  const [tableData, setTableData] = useState([]);
  const [error, setError] = useState(null);

  // Fetch all data from the server
  const fetchAllData = async () => {
    try {
      const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/selected_horses`);
      const result = await response.json();
      if (Array.isArray(result)) {
        setTableData(result); // Update state with fetched data
      } else {
        console.error("Unexpected response format:", result);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
    }
  };

  // Update notes for a specific horse
  const saveHorse = async (id, notes, saveToServer = false) => {
    // Update notes locally
    setTableData((prevData) =>
      prevData.map((horse) =>
        horse.id === id ? { ...horse, notes } : horse
      )
    );

    if (saveToServer) {
      try {
        console.log(`Updating notes for horse ID: ${id}`);
        const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/selected_horses/${id}`, {
          method: "PUT", // Use PUT for updates
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes }), // Send only the notes field
        });

        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(`Failed to update notes: ${errorMessage}`);
        }

        const result = await response.json();
        console.log("Notes updated successfully:", result);
        alert("Notes updated successfully!");
      } catch (error) {
        console.error("Error updating notes:", error);
        alert("Failed to update notes. Please try again.");
      }
    }
  };

  // Remove a horse from the database and state
  const deleteHorse = async (id) => {
    try {
      const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/selected_horses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Failed to delete horse: ${errorMessage}`);
      }

      console.log(`Horse with ID ${id} deleted successfully`);
      setTableData((prevData) => prevData.filter((horse) => horse.id !== id)); // Remove from state
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
      <TileView tableData={tableData} onSaveHorse={saveHorse} onDeleteHorse={deleteHorse} />
    </div>
  );
}

export default MyHorses;
