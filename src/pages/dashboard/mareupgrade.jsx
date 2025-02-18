import React, { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import Tree from "react-d3-tree";
import _ from "lodash";

const ROWS_PER_PAGE = 3;

const SearchBox = ({ setSearchQuery, setCurrentPage }) => {
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset pagination on search
  };

  return (
    <div className="relative mb-4 max-w-lg">
      <Typography variant="small" className="text-sm font-bold text-blue-gray-600">
        Search by Sire Name
      </Typography>
      <div className="flex items-center rounded-full shadow-md border border-gray-300 bg-white overflow-hidden focus-within:ring focus-within:ring-blue-300">
        <input
          type="text"
          placeholder="Search by Sire Name..."
          className="flex-grow p-3 text-sm text-gray-700 focus:outline-none focus:ring-0 bg-transparent"
          onChange={handleSearchChange}
        />
      </div>
    </div>
  );
};

const ReportTable = ({ tableData, currentPage, setCurrentPage, totalPages, onSireClick }) => {
  const columns = [
    "Sire Name", "Dam Name", "Unique Horse Count", "Sire Performance Ratings", "Dam Average Performance",
    "Average Dam Rating (Other Sires)", "Unique Horse Names", "Dam Racing Timeform Rating", "First Runner"
  ];

  return (
    <Card className="bg-white text-black">
      <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
        <table className="w-full min-w-[900px] table-auto">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                  <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                    {col}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => (
              <tr key={index}>
                <td 
                  className="py-3 px-5 cursor-pointer"
                  onClick={() => onSireClick(item.sireName)}
                >
                  <Typography className="text-xs font-semibold text-blue-gray-600">
                    {item.sireName}
                  </Typography>
                </td>
                {[item.damName, item.Unique_Horse_Count, item.Sire_Performance_Ratings,
                  item.Dam_Average_Performance, item["Average_Dam_Rating_(Other_Sires)"], item.Unique_Horse_Names,
                  item.Dam_Racing_Timeform_Rating, item.First_Runner].map((value, i) => (
                  <td key={i} className={`py-3 px-5 ${index === tableData.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                    <Typography className="text-xs font-semibold text-blue-gray-600">
                      {value !== null && value !== undefined ? value : "-"}
                    </Typography>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-center items-center mt-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 mx-1 text-sm border bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-1 mx-1 text-sm border bg-gray-200">{currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-2 py-1 mx-1 text-sm border bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </CardBody>
    </Card>
  );
};

const SireTreeGraph = ({ sireData }) => {
  if (!sireData.length) return null;

  const treeData = {
    name: sireData[0]?.sireName,
    children: Object.entries(_.groupBy(sireData, "damName")).map(([damName, horses]) => ({
      name: damName,
      children: [
        {
          name: "Horses",
          children: horses.map(horse => ({
            name: horse.Unique_Horse_Names || "No Name",
          }))
        },
        {
          name: "Timeform Ratings",
          children: horses.map(horse => ({
            name: `Rating: ${horse.Dam_Racing_Timeform_Rating || "N/A"}`,
          }))
        }
      ],
    })),
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <Typography variant="h6" className="text-lg font-semibold text-blue-gray-700 mb-4">
        Sire Hierarchy Tree
      </Typography>
      <div style={{ width: "100%", height: "450px" }}>
        <Tree data={treeData} orientation="vertical" translate={{ x: 300, y: 50 }} />
      </div>
    </div>
  );
};

export function MareUpLift() {
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sireSearchQuery, setSireSearchQuery] = useState("");
  const [selectedSireData, setSelectedSireData] = useState([]);

  useEffect(() => {
    fetchFilteredData();
  }, [currentPage, sireSearchQuery]);

  const fetchFilteredData = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: ROWS_PER_PAGE,
      });

      if (sireSearchQuery.trim()) {
        queryParams.append("sireName", sireSearchQuery);
      }

      const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/mareupdates?${queryParams.toString()}`);
      const data = await response.json();
      
      setTableData(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSireClick = async (sireName) => {
    try {
      const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/mareupdates?sireName=${sireName}`);
      const data = await response.json();
      
      setSelectedSireData(data.data);
    } catch (error) {
      console.error("Error fetching sire data:", error);
    }
  };

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <SearchBox setSearchQuery={setSireSearchQuery} setCurrentPage={setCurrentPage} />
      <ReportTable 
        tableData={tableData} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        totalPages={totalPages} 
        onSireClick={handleSireClick}
      />
      <SireTreeGraph sireData={selectedSireData} />
    </div>
  );
}

export default MareUpLift;
