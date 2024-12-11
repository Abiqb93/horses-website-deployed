const countryFlagURL = (countryCode) => {
  const correctedCode = countryCode === "UK" ? "GB" : countryCode;
  return `https://flagcdn.com/w40/${correctedCode.toLowerCase()}.png`;
};

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";

const ROWS_PER_PAGE = 10;

const ReportTable = ({ tableData, title, currentPage, setCurrentPage, totalPages }) => {
  const startPage = Math.max(1, currentPage - 5);
  const endPage = Math.min(startPage + 9, totalPages);

  const Pagination = () => (
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
          className={`px-2 py-1 mx-1 text-sm border ${currentPage === startPage + index ? "bg-blue-500 text-white" : "bg-gray-200"}`}
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
  );

  return (
    <Card className="bg-white text-black">
      <CardHeader className="mb-8 p-6">
        <Typography variant="h6" className="text-black">{title}</Typography>
      </CardHeader>
      <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
        <table className="w-full min-w-[640px] table-auto">
          <thead>
            <tr>
              {[
                "Dam", "Country", "Runners", "Runs", "Winners", "Wins", "WinPercent_", "Stakes_Winners", "Stakes_Wins",
                "Group_Winners", "Group_Wins", "Group_1_Winners", "Group_1_Wins", "WTR", "SWTR",
                "GWTR", "G1WTR", "WIV", "WOE", "WAX", "Percent_RB2",
              ].map((el) => (
                <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                  <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">{el}</Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => (
              <tr key={index}>
                {[
                  item["Sire"],
                  item["Country"] && (
                    <div className="flex items-center gap-2">
                      <img
                        src={countryFlagURL(item["Country"])}
                        alt={item["Country"]}
                        className="w-5 h-5"
                      />
                      <span>{item["Country"]}</span>
                    </div>
                  ),
                  item["Runners"], item["Runs"], item["Winners"], item["Wins"],
                  item["WinPercent_"], item["Stakes_Winners"], item["Stakes_Wins"], item["Group_Winners"],
                  item["Group_Wins"], item["Group_1_Winners"], item["Group_1_Wins"], item["WTR"], item["SWTR"],
                  item["GWTR"], item["G1WTR"], item["WIV"], item["WOE"], item["WAX"], item["Percent_RB2"],
                ].map((value, i) => (
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
        <Pagination />
      </CardBody>
    </Card>
  );
};

export function DamProfiles() {
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTable, setSelectedTable] = useState("dam_profile");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const countryCodes = [
    "MU", "US", "SA", "MX", "UY", "AU", "ZA", "CL", "NZ", "JP", "FI", "AR", "AE", "TR", "UK", "DK", "AT", "CZ",
    "IN", "ES", "IRE", "BR", "IT", "FR", "SE", "CA", "KR", "DE", "PA", "HK", "PL", "PE", "SK", "BH", "BE",
    "MA", "CH", "PR", "MO", "NO", "ZW", "HU", "SG", "UAE",
  ];

  const filters = [
    { label: "Runners", id: "runners", min: 1, max: 1949, value: [1, 1949] },
    { label: "Runs", id: "runs", min: 1, max: 29976, value: [1, 29976] },
    { label: "Winners", id: "winners", min: 0, max: 1223, value: 1223},
    { label: "Wins", id: "wins", min: 0, max: 3513, value: 3513 },
    { label: "Stakes Winners", id: "stakesWinners", min: 0, max: 239, value: 239 },
    { label: "Group Winners", id: "groupWinners", min: 0, max: 166, value: 166 },
    { label: "Group 1 Winners", id: "group1Winners", min: 0, max: 61, value: 61 },
    { label: "WTR", id: "wtr", min: 0, max: 94.74, value: 95 },
    { label: "SWTR", id: "swtr", min: 0, max: 9.84, value: 10 },
    { label: "GWTR", id: "gwtr", min: 0, max: 9.80, value: 10 },
    { label: "G1WTR", id: "g1wtr", min: 0, max: 9.38, value: 10 },
    { label: "WIV", id: "wiv", min: 0, max: 110, value: 110 },
    { label: "WOE", id: "woe", min: -186.57, max: 1203.3, value: 1205 },
    { label: "WAX", id: "wax", min: -173.19, max: 784.34, value: 785 },
  ];

  const [filterValues, setFilterValues] = useState(filters.map((filter) => filter.value));

  const resetFilters = () => {
    setFilterValues(filters.map((filter) => filter.value));
    setSearchQuery("");
    setSelectedCountry("");
    setShowSuggestions(false);
    fetchFilteredData();
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append("page", currentPage);
    params.append("limit", ROWS_PER_PAGE);

    filters.forEach((filter, index) => {
      if (Array.isArray(filterValues[index])) {
        params.append(`${filter.id}Min`, filterValues[index][0]);
        params.append(`${filter.id}Max`, filterValues[index][1]);
      } else {
        params.append(filter.id, filterValues[index]);
      }
    });

    if (searchQuery) params.append("sire", searchQuery);
    if (selectedCountry) params.append("country", selectedCountry);

    return params.toString();
  };


  const fetchFilteredData = async () => {
    try {
      const queryParams = buildQueryParams();
      const response = await fetch(`http://localhost:5000/api/${selectedTable}?${queryParams}`);
      const data = await response.json();
      setTableData(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
    }
  };

  useEffect(() => {
    fetchFilteredData();
  }, [currentPage, filterValues, selectedTable, searchQuery, selectedCountry]);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-12">
      <div className="flex items-center mb-2">
        <label htmlFor="table-select" className="mr-2">Table:</label>
        <select
          id="table-select"
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="p-2 rounded-md border border-gray-300"
        >
          <option value="dam_profile">Overall</option>
          <option value="dam_profile_three">Last 03 Years</option>
          <option value="dam_profile_one">Last 01 Year</option>
        </select>
      </div>

      {/* Filters */}
      <div className="cursor-pointer text-center border-t border-gray-300 py-2" onClick={() => setShowFilters(!showFilters)}>
        <span>{showFilters ? "▲ Hide Filters" : "▼ Show Filters"}</span>
      </div>
      {showFilters && (
        <div className="p-4 border rounded-lg bg-white text-black border-black">
          <Typography variant="h5" className="mb-4 font-bold">Filters</Typography>
          <div className="grid grid-cols-2 gap-x-20 gap-y-3">
            {filters.map((filter, index) => (
              <div key={filter.id} className="flex items-center gap-4">
                <label htmlFor={filter.id} className="text-sm w-25">{filter.label}:</label>
                <input
                  type="range"
                  id={filter.id}
                  min={filter.min}
                  max={filter.max}
                  value={Array.isArray(filterValues[index]) ? filterValues[index][1] : filterValues[index]}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setFilterValues((prev) => {
                      const updated = [...prev];
                      updated[index] = Array.isArray(updated[index]) ? [filter.min, value] : value;
                      return updated;
                    });
                  }}
                  className="slider h-1"
                  style={{ flexGrow: 1 }}
                />
                <span className="text-sm">{Array.isArray(filterValues[index]) ? filterValues[index][1] : filterValues[index]}</span>
              </div>
            ))}
            <div className="flex items-center gap-4">
              <label htmlFor="country-select" className="text-sm w-25">Country:</label>
              <select
                id="country-select"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="p-2 rounded-md border border-gray-300"
              >
                <option value="">All</option>
                {countryCodes.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search Box */}
      <div className="relative mt-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Dam..."
          className="p-2 border rounded-md w-full max-w-xs"
        />
      </div>

      {/* Table Section */}
      <ReportTable
        tableData={tableData}
        title="Dam Report Table"
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />
    </div>
  );
}

export default DamProfiles;
