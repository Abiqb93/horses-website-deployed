const countryFlagURL = (countryCode) => {
  const correctedCode = countryCode === "UK" ? "GB" : countryCode;
  return `https://flagcdn.com/w40/${correctedCode.toLowerCase()}.png`;
};

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";

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
          placeholder="Search Trainer..."
          className="flex-grow p-3 text-sm text-gray-700 focus:outline-none focus:ring-0 bg-transparent"
          onChange={(e) => debouncedSearch(e.target.value)}
        />
      </div>
    </div>

  );
};

const ROWS_PER_PAGE = 10;

const ReportTable = ({ tableData, title, currentPage, setCurrentPage, totalPages, sortBy, setSortBy, order, setOrder }) => {
  const startPage = Math.max(1, currentPage - 5);
  const endPage = Math.min(startPage + 9, totalPages);

  const handleSort = (column) => {
    if (sortBy === column) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setOrder("asc");
    }
  };

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
      <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
        <table className="w-full min-w-[640px] table-auto">
          <thead>
            <tr>
              {[
                "Trainer", "Country", "Runners", "Runs", "Winners", "Wins", "WinPercent_", "Stakes_Winners", "Stakes_Wins",
                "Group_Winners", "Group_Wins", "Group_1_Winners", "Group_1_Wins", "WTR", "SWTR",
                "GWTR", "G1WTR", "WIV", "WOE", "WAX", "Percent_RB2",
              ].map((el) => (
                <th
                  key={el}
                  className="border-b border-blue-gray-50 py-3 px-5 text-left cursor-pointer hover:text-blue-500 transition duration-200"
                  onClick={() => {
                    const actualColumn =
                      el === "Trainer" ? "Sire" :
                      el;
                
                    if (sortBy === actualColumn) {
                      setOrder(order === "asc" ? "desc" : "asc");
                    } else {
                      setSortBy(actualColumn);
                      setOrder("asc");
                    }
                  }}
                >
                    <Typography variant="small" className="text-[11px] font-bold uppercase flex items-center gap-1">
                    {el}
                    {/* ✅ Show sorting icon always, but highlight when active */}
                    <span className="text-gray-400">
                      {sortBy === el ? (order === "asc" ? "🔼" : "🔽") : "↕"}
                    </span>
                  </Typography>
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

import { FaArrowUp, FaArrowDown } from "react-icons/fa";

export function TrainerProfiles() {
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTable, setSelectedTable] = useState("trainer_name_profile");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRaceType, setSelectedRaceType] = useState("");

  // ✅ NEW: Sorting state
  const [sortBy, setSortBy] = useState(""); // Column to sort
  const [order, setOrder] = useState("asc"); // Sorting order (asc/desc)

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
    if (searchQuery) params.append("sire", searchQuery);
    if (selectedCountry) params.append("country", selectedCountry);
    if (selectedRaceType) params.append("RaceTypeDetail", selectedRaceType);
    
    // ✅ NEW: Append Sorting Parameters
    if (sortBy) params.append("sortBy", sortBy);
    if (order) params.append("order", order);

    return params.toString();
  };
  // const buildQueryParams = () => {
  //   const params = new URLSearchParams();
  //   params.append("page", currentPage);
  //   params.append("limit", ROWS_PER_PAGE);

  //   filters.forEach((filter, index) => {
  //     if (Array.isArray(filterValues[index])) {
  //       params.append(`${filter.id}Min`, filterValues[index][0]);
  //       params.append(`${filter.id}Max`, filterValues[index][1]);
  //     } else {
  //       params.append(filter.id, filterValues[index]);
  //     }
  //   });

  //   if (searchQuery) params.append("sire", searchQuery);
  //   if (selectedCountry) params.append("country", selectedCountry);

  //   // ✅ NEW: Append Sorting Parameters
  //   if (sortBy) params.append("sortBy", sortBy);
  //   if (order) params.append("order", order);

  //   return params.toString();
  // };

  const fetchFilteredData = async () => {
    try {
      const queryParams = buildQueryParams();
      // const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/${selectedTable}?${queryParams}`);
      const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/${selectedTable}?${queryParams}`);
      
      const data = await response.json();
      setTableData(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
    }
  };

  // useEffect(() => {
  //   fetchFilteredData();
  // }, [currentPage, filterValues, selectedTable, searchQuery, selectedCountry, sortBy, order]);
  useEffect(() => {
    fetchFilteredData();
    }, [currentPage, selectedTable, selectedRaceType, searchQuery, selectedCountry, sortBy, order]);

  return (
    <div className="mt-12 mb-8 flex flex-col gap-3">
      <div className="flex items-center mb-0">
        <label htmlFor="table-select" className="mr-2 text-[12px]">Time Period:</label>
        <select
          id="table-select"
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="p-2 text-xs rounded-md border border-gray-300"
        >
          <option value="trainer_name_profile">Overall</option>
          <option value="trainer_name_profile_three">Last 03 Years</option>
          <option value="trainer_name_profile_one">Last 01 Year</option>
        </select>
      </div>



      {/* Filters (UNCHANGED) */}
      <div className="cursor-pointer text-center border-t border-gray-300 py-2 text-xs" onClick={() => setShowFilters(!showFilters)}>
        <span>{showFilters ? "▲ Hide Filters" : "▼ Show Filters"}</span>
      </div>
      {showFilters && (
        <div className="p-4 border rounded-lg bg-white text-black border-black">
          {/* <Typography variant="h5" className="mb-4 font-bold">Filters</Typography> */}
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
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>

              <label htmlFor="raceType-select" className="text-sm w-25 ml-6">Race Type:</label>
              <select
                id="raceType-select"
                value={selectedRaceType}
                onChange={(e) => setSelectedRaceType(e.target.value)}
                className="p-2 rounded-md border border-gray-300"
              >
                <option value="">All</option>
                {["FLT","HRD", "STC", "HCH", "NHF"].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search Box */}
      <HorseProfile setSearchQuery={setSearchQuery} />

            {/* Sorting Section - Aligned Right */}
      {/* ✅ Sorting Section - Moved Below Search Box, Above Table */}
      {false && (
        <div className="flex justify-end items-center gap-2 mb-2">
          <label htmlFor="sortBy" className="text-xs font-semibold">Sort By:</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-1 text-xs border border-gray-300 rounded-md"
          >
            <option value="">Select Column</option>
            {[
              { value: "Sire", label: "Trainer" },
              { value: "Country", label: "Country" },
              { value: "Runners", label: "Runners" },
              { value: "Runs", label: "Runs" },
              { value: "Winners", label: "Winners" },
              { value: "Wins", label: "Wins" },
              { value: "WinPercent_", label: "Win %" },
              { value: "Stakes_Winners", label: "Stakes Winners" },
              { value: "Stakes_Wins", label: "Stakes Wins" },
              { value: "Group_Winners", label: "Group Winners" },
              { value: "Group_Wins", label: "Group Wins" },
              { value: "Group_1_Winners", label: "Group 1 Winners" },
              { value: "Group_1_Wins", label: "Group 1 Wins" },
              { value: "WTR", label: "WTR" },
              { value: "SWTR", label: "SWTR" },
              { value: "GWTR", label: "GWTR" },
              { value: "G1WTR", label: "G1WTR" },
              { value: "WIV", label: "WIV" },
              { value: "WOE", label: "WOE" },
              { value: "WAX", label: "WAX" },
              { value: "Percent_RB2", label: "%RB2" }
            ].map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Sorting Order Buttons */}
          <button
            className={`p-1 text-xs rounded ${order === "asc" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setOrder("asc")}
          >
            <FaArrowUp size={12} />
          </button>

          <button
            className={`p-1 text-xs rounded ${order === "desc" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            onClick={() => setOrder("desc")}
          >
            <FaArrowDown size={12} />
          </button>
        </div>
      )}



      {/* Table Section */}
      <ReportTable
        tableData={tableData}
        title="Trainer Report Table"
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        sortBy={sortBy}        // ✅ Added
        setSortBy={setSortBy}  // ✅ Added
        order={order}          // ✅ Added
        setOrder={setOrder}    // ✅ Added
      />
    </div>

  );
}

export default TrainerProfiles;
