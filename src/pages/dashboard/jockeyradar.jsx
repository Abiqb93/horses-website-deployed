import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";
import { ResponsiveRadar } from "@nivo/radar";

import _ from "lodash";

const HorseProfile = ({ setSearchQuery }) => {
  // Debounced function for search input
  const debouncedSearch = _.debounce((query) => {
    setSearchQuery(query); // Update search query
  }, 300); // Adjust delay as needed

  return (
    <div className="relative mb-0 max-w-lg">
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
          placeholder="Search Jockey..."
          className="flex-grow p-3 text-sm text-gray-700 focus:outline-none focus:ring-0 bg-transparent"
          onChange={(e) => debouncedSearch(e.target.value)}
        />
      </div>
    </div>

  );
};

const ROWS_PER_PAGE = 3;

const fieldLimits = {
  WTR: { min: 0, max: 100 },
  SWTR: { min: 0, max: 100 },
  GWTR: { min: 0, max: 100 },
  G1WTR: { min: 0, max: 100 },
  WIV: { min: 0, max: 110.77 },
  WOE: { min: -186.57, max: 1203.3 },
  WAX: { min: -173.19, max: 784.34 },
  RB2: { min: 0, max: 240000 },
};

const sanitizeData = (key, value) => {
  if (typeof value === "string" && value.includes("%")) {
    return parseFloat(value.replace("%", "")); // Remove '%' and convert to float
  }
  return value !== null && value !== undefined ? parseFloat(value) : 0;
};

const normalize = (value, field) => {
  const fieldLimit = fieldLimits[field];
  const epsilon = 0;

  if (!fieldLimit) {
    console.warn(`Field "${field}" does not have defined limits.`);
    return 0.5;
  }

  let { min, max } = fieldLimit;

  if ((field === "WOE" || field === "WAX")) {
    const adjustment = Math.abs(min);
    value += adjustment;
    min += adjustment;
    max += adjustment;
  }

  if (value === 0) {
    value = epsilon;
  }

  const transformedValue = Math.log1p(Math.abs(value)) * Math.sign(value);
  const transformedMin = Math.log1p(Math.abs(min)) * Math.sign(min);
  const transformedMax = Math.log1p(Math.abs(max)) * Math.sign(max);

  if (transformedMax === transformedMin) {
    console.error(`Invalid range for field "${field}".`);
    return 0.5;
  }

  return ((transformedValue - transformedMin) / (transformedMax - transformedMin));
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

  return (
    <div className="radar-chart-container flex items-center gap-6" style={{ width: "100%" }}>
      <div style={{ flex: 1, height: "400px" }}>
        <ResponsiveRadar
          data={chartData}
          keys={[entry1Data?.Sire || "Entry 1", ...(entry2Data ? [entry2Data?.Sire || "Entry 2"] : [])]}
          indexBy="field"
          maxValue={1}
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
              {["Jockey", "Runners", "Runs", "Winners", "Wins", "WinPercent_", "Stakes_Winners", "Stakes_Wins", "Group_Winners", "Group_Wins", "RB2"].map((el) => (
                <th key={el} className="border-b border-gray-300 py-3 px-5 text-left">
                  <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-600">
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
                  <td key={i} className={`py-3 px-5 border-b border-gray-300`}>
                    <Typography className="text-xs font-semibold text-blue-gray-600">
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
            className="px-2 py-1 mx-1 text-sm border bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: endPage - startPage + 1 }, (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(startPage + index)}
              className={`px-2 py-1 mx-1 text-sm border ${
                currentPage === startPage + index ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {startPage + index}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 mx-1 text-sm border bg-gray-200 disabled:opacity-50"
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
            <th className="border border-gray-300 py-1 px-2 text-left">{entry2 ? entry2.Sire : "Entry 2 (Select a jockey)"}</th>
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




export function JockeyRadar() {
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry1, setSelectedEntry1] = useState(null);
  const [selectedEntry2, setSelectedEntry2] = useState(null);
  const [currentSelection, setCurrentSelection] = useState("entry1");

  const fetchFilteredData = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: ROWS_PER_PAGE,
        sire: searchQuery || "",
      });
      const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/jockey_name_profile?${params.toString()}`);
      const data = await response.json();
      setTableData(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
    }
  };

  const handleSelectRow = (row) => {
    if (currentSelection === "entry1") {
      setSelectedEntry1(row);
    } else if (currentSelection === "entry2") {
      setSelectedEntry2(row);
    }
  };

  useEffect(() => {
    fetchFilteredData();
  }, [currentPage, searchQuery]);

  return (
    <div className="mt-4 mb-0 flex flex-col gap-5">

      <div className="flex items-center gap-4">
        <label htmlFor="jockey-selector" className="text-sm font-medium">
          Select Entry:
        </label>
        <select
          id="jockey-selector"
          value={currentSelection}
          onChange={(e) => setCurrentSelection(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="entry1">Jockey 1</option>
          <option value="entry2">Jockey 2</option>
        </select>
      </div>
      {/* Search Box */}
      <HorseProfile setSearchQuery={setSearchQuery} />

      <ReportTable
        tableData={tableData}
        title="Search and Click"
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        onSelectRow={handleSelectRow}
      />
      {selectedEntry1 && (
        <div className="flex justify-between">
          <D3RadarChart entry1Data={selectedEntry1} entry2Data={selectedEntry2} />
          <ComparisonTable entry1={selectedEntry1} entry2={selectedEntry2} />
        </div>
      )}
    </div>
  );
}

export default JockeyRadar;
