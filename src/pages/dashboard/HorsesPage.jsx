import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DynamicTable from "./DynamicTable";

export function HorseProfilePage() {
  const { horseName } = useParams();
  const [horseData, setHorseData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHorseData = async () => {
    try {
      const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/APIData_Table2/horse?horseName=${horseName}`);
      const json = await response.json();
      setHorseData(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("Error fetching horse data:", err);
      setHorseData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (horseName) fetchHorseData();
  }, [horseName]);

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      {loading ? (
        <p>Loading horse data...</p>
      ) : (
        <DynamicTable data={horseData} refreshHorseData={fetchHorseData} />
      )}
    </div>
  );
}

// ✅ Provide a default export too
export default HorseProfilePage;
