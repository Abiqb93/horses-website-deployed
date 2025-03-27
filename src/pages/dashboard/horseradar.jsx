import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";
import { ResponsiveRadar } from "@nivo/radar";

import _ from "lodash";

const HorseProfile = ({ setSearchQuery, placeholder  }) => {
  // Debounced function for search input
  const debouncedSearch = _.debounce((query) => {
    setSearchQuery(query); // Update search query
  }, 300); // Adjust delay as needed

  return (
    <div className="relative mb-4 max-w-lg">
      <div className="flex items-center rounded-full shadow-md border border-gray-300 bg-white overflow-hidden focus-within:ring focus-within:ring-blue-300">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-gray-500 ml-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-5.197-5.197M16.804 10.804a6 6 0 11-12 0 6 6 0 0112 0z"
          />
        </svg>
        <input
          type="text"
          placeholder={placeholder}
          className="flex-grow py-1 px-2 text-xs text-gray-700 focus:outline-none focus:ring-0 bg-transparent h-8"
          onChange={(e) => debouncedSearch(e.target.value)}
        />

      </div>
    </div>

  );
};

const ROWS_PER_PAGE = 3;

const fieldLimits = {
  WTR: { min: 0, max: 100 },
  SWTR: { min: 0, max: 16.67 },
  GWTR: { min: 0, max: 7.89 },
  G1WTR: { min: 0, max: 2.27 },
  WIV: { min: 0, max: 9 },
  WOE: { min: -17.91, max: 173.06 },
  WAX: { min: -5.26, max: 163.72 },
  RB2: { min: 0, max: 100 },
};

const sanitizeData = (key, value) => {
  if (typeof value === "string" && value.includes("%")) {
    return parseFloat(value.replace("%", "")); // Remove '%' and convert to float
  }
  return value !== null && value !== undefined ? parseFloat(value) : 0;
};

const normalize = (value, field) => {
  const fieldLimit = fieldLimits[field];
  const epsilon = 1e-6;

  if (!fieldLimit) {
    console.warn(`Field "${field}" does not have defined limits.`);
    return 0.5;
  }

  let { min, max } = fieldLimit;

  if (field === "WOE" || field === "WAX") {
    const adjustment = Math.abs(min);
    value += adjustment;
    min += adjustment;
    max += adjustment;
  }

  // Ensure value is not negative
  value = Math.max(value, 0);

  // Apply log transformation
  const transformedValue = Math.log1p(value);
  const transformedMin = Math.log1p(Math.max(min, 0));
  const transformedMax = Math.log1p(Math.max(max, epsilon));

  if (transformedMax === transformedMin) {
    console.error(`Invalid range for field "${field}".`);
    return 0.5;
  }

  const normalizedValue = (transformedValue - transformedMin) / (transformedMax - transformedMin);

  // Ensure final normalization stays within [0, 1]
  return Math.min(Math.max(normalizedValue, 0), 1);
};


const D3RadarChart = ({ entry1Data, entry2Data }) => {
  const fields = Object.keys(fieldLimits);
  const chartData = fields.map((field) => ({
    field,
    [entry1Data?.Sire || "Entry 1"]: normalize(
      sanitizeData(field, field === "RB2" ? entry1Data?.Percent_RB2 : entry1Data?.[field] || 0),
      field
    ),
    ...(entry2Data
      ? {
          [entry2Data?.Sire || "Entry 2"]: normalize(
            sanitizeData(field, field === "RB2" ? entry2Data?.Percent_RB2 : entry2Data?.[field] || 0),
            field
          ),
        }
      : {}),
  }));

  // Find the maximum value dynamically across all keys
  const maxChartValue = Math.max(
    ...chartData.flatMap((d) => Object.values(d).filter((v) => typeof v === "number"))
  );

  return (
    <div className="radar-chart-container flex items-center gap-6" style={{ width: "100%" }}>
      <div style={{ flex: 1, height: "400px" }}>
        <ResponsiveRadar
          data={chartData}
          keys={[entry1Data?.Sire || "Entry 1", ...(entry2Data ? [entry2Data?.Sire || "Entry 2"] : [])]}
          indexBy="field"
          maxValue={maxChartValue}  // Dynamically adjust max value
          margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
          colors={{ scheme: "category10" }}
          borderWidth={2}
          dotSize={10}
          legends={
            entry2Data
              ? [
                  {
                    anchor: "top-left",
                    direction: "column",
                    translateX: -50,
                    itemWidth: 80,
                    itemHeight: 20,
                    itemTextColor: "#999",
                    symbolSize: 12,
                    symbolShape: "circle",
                  },
                ]
              : []
          }
        />
      </div>
    </div>
  );
};

const ReportTable = ({ tableData, title, currentPage, setCurrentPage, totalPages, onSelectRow }) => {
  const startPage = Math.max(1, currentPage - 5);
  const endPage = Math.min(startPage + 9, totalPages);

  return (
    <Card className="bg-white text-black">
      {/* <CardHeader className="mb-8 p-6">
        <Typography variant="h6" className="text-black">{title}</Typography>
      </CardHeader> */}
      <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
        <table className="w-full min-w-[640px] table-auto">
          <thead>
            <tr>
              {["Horse", "Runners", "Runs", "Winners", "Wins", "WinPercent_", "Stakes_Winners", "Stakes_Wins", "Group_Winners", "Group_Wins", "RB2"].map((el) => (
                <th key={el} className="border-b border-gray-300 py-3 px-2 text-left">
                  <Typography variant="small" className="text-[10px] font-bold uppercase text-blue-gray-600">
                    {el}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => (
              <tr key={index} onClick={() => onSelectRow(item)} className="cursor-pointer hover:bg-gray-100">
                {["Sire", "Runners", "Runs", "Winners", "Wins", "WinPercent_", "Stakes_Winners", "Stakes_Wins", "Group_Winners", "Group_Wins", "Percent_RB2"].map((key, i) => (
                  <td key={i} className={`py-2 px-3 border-b border-gray-300`}>
                    <Typography className="text-[10px] font-semibold text-blue-gray-600">
                      {item[key] !== null && item[key] !== undefined ? item[key] : "-"}
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
            className="px-1 py-0.5 mx-1 text-xs border bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: endPage - startPage + 1 }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(startPage + index)}
              className={`px-1 py-0.5 mx-1 text-xs border ${
                currentPage === startPage + index ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {startPage + index}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-1 py-0.5 mx-1 text-xs border bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </CardBody>
    </Card>
  );
};

const ComparisonTable = ({ entry1, entry2 }) => (
  <Card className="bg-white text-black w-[600px] h-[400px] p-4 shadow-md flex justify-center"> {/* Wider & Taller */}
    <CardBody className="w-full h-full flex flex-col justify-center p-2"> {/* Ensures table stretches fully */}
      <table className="w-full h-full table-auto text-xs border-collapse border border-gray-200"> {/* Adjusted width & height */}
        <thead>
          <tr>
            <th className="border border-gray-300 py-1 px-2 text-left">Field</th>
            <th className="border border-gray-300 py-1 px-2 text-left">{entry1?.Sire || "Entry 1"}</th>
            <th className="border border-gray-300 py-1 px-2 text-left">{entry2 ? entry2.Sire : "Entry 2 (Select a sire)"}</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(fieldLimits).map((field, index) => (
            <tr key={field} className={index % 2 === 0 ? "bg-gray-100" : ""}>
              <td className="border border-gray-300 py-1 px-2">{field}</td>
              <td className="border border-gray-300 py-1 px-2">
                {sanitizeData(field, field === "RB2" ? entry1?.Percent_RB2 : entry1?.[field])}
              </td>
              <td className="border border-gray-300 py-1 px-2">
                {entry2 ? sanitizeData(field, field === "RB2" ? entry2?.Percent_RB2 : entry2?.[field]) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CardBody>
  </Card>
);




export function HorseRadar() {
  // const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry1, setSelectedEntry1] = useState(null);
  const [selectedEntry2, setSelectedEntry2] = useState(null);
  const [currentSelection, setCurrentSelection] = useState("entry1");
  const [searchQuery1, setSearchQuery1] = useState("");
  const [searchQuery2, setSearchQuery2] = useState("");
  const [tableData1, setTableData1] = useState([]);
  const [tableData2, setTableData2] = useState([]);

  const fetchFilteredData = async (searchQuery, setTableData) => {
      try {
        const params = new URLSearchParams({
          sire: searchQuery || "",
          limit: 3, // Ensure only 3 rows per table
        });
        
        const response = await fetch(
          `https://horseracesbackend-production.up.railway.app/api/horse_names?${params.toString()}`
        );
        const data = await response.json();
        
        console.log("API Response:", data); // Add this to inspect the response
        setTableData(data.data || []); // Ensure it does not break if `data.data` is undefined
      } catch (error) {
        console.error("Error fetching filtered data:", error);
      }
    };
  

  // const handleSelectRow = (row) => {
  //   if (currentSelection === "entry1") {
  //     setSelectedEntry1(row);
  //   } else if (currentSelection === "entry2") {
  //     setSelectedEntry2(row);
  //   }
  // };

  const handleSelectRow1 = (row) => {
    setSelectedEntry1(row);
  };
  
  const handleSelectRow2 = (row) => {
    setSelectedEntry2(row);
  };
  

  // useEffect(() => {
  //   fetchFilteredData();
  // }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchFilteredData(searchQuery1, setTableData1);
  }, [searchQuery1]);
  
  useEffect(() => {
    fetchFilteredData(searchQuery2, setTableData2);
  }, [searchQuery2]);

  return (
    <div className="mt-4 mb-0 flex flex-col gap-5">

      {/* <div className="flex items-center gap-4">
        <label htmlFor="sire-selector" className="text-sm font-medium">
          Select Entry:
        </label>
        <select
          id="sire-selector"
          value={currentSelection}
          onChange={(e) => setCurrentSelection(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="entry1">Sire 1</option>
          <option value="entry2">Sire 2</option>
        </select>
      </div> */}
      {/* Search Box */}
      {/* <HorseProfile setSearchQuery={setSearchQuery} /> */}
      {/* <HorseProfile setSearchQuery={setSearchQuery1} placeholder="Search Horse 1..." />
      <HorseProfile setSearchQuery={setSearchQuery2} placeholder="Search Horse 2..." />
      <ReportTable tableData={tableData1} title="Horse 1 Table" onSelectRow={handleSelectRow1} />
      <ReportTable tableData={tableData2} title="Horse 2 Table" onSelectRow={handleSelectRow2} /> */}

      <div className="flex justify-between gap-4">
        <div className="w-1/2">
          <HorseProfile setSearchQuery={setSearchQuery1} placeholder="Search Horse 1..." className="mb-4"  />
          <ReportTable tableData={tableData1} title="Horse 1 Table" onSelectRow={setSelectedEntry1} />
        </div>

        <div className="w-1/2">
          <HorseProfile setSearchQuery={setSearchQuery2} placeholder="Search Horse 2..." className="mb-4"  />
          <ReportTable tableData={tableData2} title="Horse 2 Table" onSelectRow={setSelectedEntry2} />
        </div>
      </div>


      {selectedEntry1 && (
        <div className="flex justify-between">
          <D3RadarChart entry1Data={selectedEntry1} entry2Data={selectedEntry2} />
          <ComparisonTable entry1={selectedEntry1} entry2={selectedEntry2} />
        </div>
      )}
    </div>
  );
}

export default HorseRadar;
