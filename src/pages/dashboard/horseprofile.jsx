const countryFlagURL = (countryCode) => {
  const countryMap = {
    GBR: "GB",
    IRE: "IE",
    FRA: "FR",
    GER: "DE",
    USA: "US",
    SAF: "ZA",
    AUS: "AU",
    JAP: "JP",
    CAN: "CA",
    ITY: "IT",
    ARG: "AR",
    UAE: "AE",
    HGK: "HK",
    SWE: "SE",
    SAU: "SA",
    ZIM: "ZW",
    TUR: "TR",
    QAT: "QA",
    BRA: "BR",
    SWI: "CH",
    NOR: "NO",
    SIN: "SG",
    URG: "UY",
    BEL: "BE",
    NZD: "NZ",
    DEN: "DK",
    JER: "JE",
    BAH: "BH",
    CHI: "CL",
    RUS: "RU",
    CZE: "CZ",
    KAZ: "KZ",
    SPA: "ES",
    MAL: "MY",
    MAC: "MO",
    VEN: "VE",
    PER: "PE",
    SLO: "SI",
    POL: "PL",
    AST: "KZ",
    HUN: "HU",
    MEX: "MX",
    HOL: "NL",
    OMN: "OM",
    MOR: "MA",
    KOR: "KR",
    GUR: "GU",  // Guam?
    PAN: "PA",
    ALL: "UN"   // or skip flag entirely for aggregated row
  };

  const isoCode = countryMap[countryCode] || countryCode?.slice(0, 2).toLowerCase(); // fallback or guess
  return `https://flagcdn.com/w40/${isoCode.toLowerCase()}.png`;
};

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";
import DynamicTable from "./DynamicTable";
import _ from "lodash";

const ROWS_PER_PAGE = 10;

const HorseProfile = ({ setSearchQuery }) => {
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
          placeholder="Search Horse..."
          className="flex-grow p-3 text-sm text-gray-700 focus:outline-none focus:ring-0 bg-transparent"
          onChange={(e) => debouncedSearch(e.target.value)}
        />
      </div>
    </div>

  );
};


const ReportTable = ({
  tableData = [],
  title,
  currentPage,
  setCurrentPage,
  totalPages,
  addHorseToList,
  sortBy,
  setSortBy,
  order,
  setOrder,
  setSelectedHorse,
  setSelectedHorsePage
}) => {


  const columnsToDisplay = [
    "Horse", "Country", "Runs", "Wins", "WinPercent_",
    "Stakes_Wins", "Group_Wins", "Group_1_Wins", "WTR", "SWTR",
    "GWTR", "G1WTR", "WIV", "WOE", "WAX", "Percent_RB2"
  ];

  const startPage = Math.max(1, currentPage - 5);
  const endPage = Math.min(startPage + 9, totalPages);

  const Pagination = () => (
    <div className="flex justify-center items-center mt-0">
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
      {/* <CardHeader className="mb-8 p-6">
        <Typography variant="h6" className="text-black">{title}</Typography>
      </CardHeader> */}
      <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
        <table className="w-full min-w-[640px] table-auto">
          <thead>
            <tr>
              {columnsToDisplay.map((el) => (
                  <th
                    key={el}
                    className="border-b border-blue-gray-50 py-3 px-5 text-left cursor-pointer hover:text-blue-500 transition duration-200"
                    onClick={() => {
                      const actualColumn =
                        el === "Horse" ? "Sire" :
                        el === "Win %" ? "WinPercent_" :
                        el === "%RB2" ? "Percent_RB2" :
                        el;

                      if (sortBy === actualColumn) {
                        setOrder(order === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy(actualColumn);
                        setOrder("asc");
                      }
                    }}
                  >
                    <Typography variant="small" className="text-[11px] font-bold uppercase flex items-center gap-1 text-blue-gray-400">
                      {el}
                      <span className="text-gray-400">
                        {sortBy === (
                          el === "Horse" ? "Sire" :
                          el === "Win %" ? "WinPercent_" :
                          el === "%RB2" ? "Percent_RB2" :
                          el
                        )
                          ? (order === "asc" ? "🔼" : "🔽")
                          : "↕"}
                      </span>
                    </Typography>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {Array.isArray(tableData) && tableData.map((item, index) => (
              <tr key={index}>
                {columnsToDisplay.map((key, i) => {
                  let value;

                  if (key === "Add") {
                    value = (
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded"
                        onClick={() => addHorseToList(item)}
                      >
                        +
                      </button>
                    );
                  } else if (key === "Horse") {
                    value = (
                      <span
                        className="text-blue-600 underline cursor-pointer"
                        onClick={() => {
                          setSelectedHorse(item["Sire"]);
                          setSelectedHorsePage(1);
                        }}
                      >
                        {item["Sire"]}
                      </span>
                    );
                  } else if (key === "Country") {
                    value = item["Country"] && (
                      <div className="flex items-center gap-2">
                        <img
                          src={countryFlagURL(item["Country"])}
                          alt={item["Country"]}
                          className="w-5 h-5"
                        />
                        <span>{item["Country"]}</span>
                      </div>
                    );
                  } else {
                    value = item[key];
                  }

                  return (
                    <td key={i} className={`py-3 px-5 ${index === tableData.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                      <Typography className="text-xs font-semibold text-blue-gray-600">
                        {value !== null && value !== undefined ? value : "-"}
                      </Typography>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

        </table>
        <Pagination />
      </CardBody>
    </Card>
  );
};

export function HorseProfiles() {
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTable, setSelectedTable] = useState("horse_names");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedHorses, setSelectedHorses] = useState([]);
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [selectedHorseData, setSelectedHorseData] = useState([]);
  const [loadingHorseData, setLoadingHorseData] = useState(false);
  const [selectedHorsePage, setSelectedHorsePage] = useState(1);
  const [selectedHorseTotalPages, setSelectedHorseTotalPages] = useState(1);


  const countryCodes = [
    "MU", "US", "SA", "MX", "UY", "AU", "ZA", "CL", "NZ", "JP", "FI", "AR", "AE", "TR", "UK", "DK", "AT", "CZ",
    "IN", "ES", "IRE", "BR", "IT", "FR", "SE", "CA", "KR", "DE", "PA", "HK", "PL", "PE", "SK", "BH", "BE",
    "MA", "CH", "PR", "MO", "NO", "ZW", "HU", "SG", "UAE",
  ];

  const addHorseToList = async (horse) => {
    // const userId = "Tom"; // Hardcoded user_id for now
    const userId = localStorage.getItem("userId") || "Guest"; 
  
    if (!selectedHorses.some((selected) => selected.Sire === horse.Sire)) {
      try {
        // Convert all fields in the horse object to strings
        const formattedHorse = {
          ...horse,
          user_id: String(userId),
          Sire: String(horse.Sire),
          Country: String(horse.Country),
          Runners: horse.Runners !== null && horse.Runners !== undefined ? String(horse.Runners) : null,
          Runs: horse.Runs !== null && horse.Runs !== undefined ? String(horse.Runs) : null,
          Winners: horse.Winners !== null && horse.Winners !== undefined ? String(horse.Winners) : null,
          Wins: horse.Wins !== null && horse.Wins !== undefined ? String(horse.Wins) : null,
          WinPercent_: horse.WinPercent_ !== null && horse.WinPercent_ !== undefined ? String(horse.WinPercent_) : null,
          Stakes_Winners: horse.Stakes_Winners !== null && horse.Stakes_Winners !== undefined ? String(horse.Stakes_Winners) : null,
          Stakes_Wins: horse.Stakes_Wins !== null && horse.Stakes_Wins !== undefined ? String(horse.Stakes_Wins) : null,
          Group_Winners: horse.Group_Winners !== null && horse.Group_Winners !== undefined ? String(horse.Group_Winners) : null,
          Group_Wins: horse.Group_Wins !== null && horse.Group_Wins !== undefined ? String(horse.Group_Wins) : null,
          Group_1_Winners: horse.Group_1_Winners !== null && horse.Group_1_Winners !== undefined ? String(horse.Group_1_Winners) : null,
          Group_1_Wins: horse.Group_1_Wins !== null && horse.Group_1_Wins !== undefined ? String(horse.Group_1_Wins) : null,
          WTR: horse.WTR !== null && horse.WTR !== undefined ? String(horse.WTR) : null,
          SWTR: horse.SWTR !== null && horse.SWTR !== undefined ? String(horse.SWTR) : null,
          GWTR: horse.GWTR !== null && horse.GWTR !== undefined ? String(horse.GWTR) : null,
          G1WTR: horse.G1WTR !== null && horse.G1WTR !== undefined ? String(horse.G1WTR) : null,
          WIV: horse.WIV !== null && horse.WIV !== undefined ? String(horse.WIV) : null,
          WOE: horse.WOE !== null && horse.WOE !== undefined ? String(horse.WOE) : null,
          WAX: horse.WAX !== null && horse.WAX !== undefined ? String(horse.WAX) : null,
          Percent_RB2: horse.Percent_RB2 !== null && horse.Percent_RB2 !== undefined ? String(horse.Percent_RB2) : null,
        };
  
        // Log the formatted data being sent to the server
        console.log("Formatted data being sent to the server:", formattedHorse);
  
        const response = await fetch("https://horseracesbackend-production.up.railway.app/api/selected_horses", {
        // const response = await fetch("https://horseracesbackend-production.up.railway.app/api/selected_horses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formattedHorse), // Send the formatted horse object
        });
  
        if (!response.ok) {
          const errorMessage = await response.text(); // Capture the server error response
          throw new Error(`Failed to save horse to the database: ${errorMessage}`);
        }
  
        const savedHorse = await response.json(); // Parse the response, if needed
        setSelectedHorses([...selectedHorses, { ...horse, note: "" }]); // Add the horse to the state
  
        console.log("Horse added successfully:", savedHorse);
      } catch (error) {
        console.error("Error adding horse:", error);
      }
    } else {
      console.log(`Horse with Sire '${horse.Sire}' is already in the list.`);
    }
  };
    
  
  const refreshHorseData = () => {
    if (selectedHorse) fetchHorseEntries(selectedHorse);
  };



  const updateHorseNote = (index, note) => {
    const updatedHorses = [...selectedHorses];
    updatedHorses[index].note = note;
    setSelectedHorses(updatedHorses);
  };

  const [sortBy, setSortBy] = useState(""); // Column to sort
  const [order, setOrder] = useState("asc"); // Sorting order (asc/desc)
  
  
  
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append("page", currentPage);
    params.append("limit", ROWS_PER_PAGE);
    
    if (searchQuery) params.append("sire", searchQuery);
    if (selectedCountry) params.append("country", selectedCountry);
  
    // ✅ Append sorting parameters
    if (sortBy) params.append("sortBy", sortBy);
    if (order) params.append("order", order);
  
    return params.toString();
  };

  const fetchFilteredData = async () => {
    try {
      const queryParams = buildQueryParams();
      const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/${selectedTable}?${queryParams}`);
      // const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/${selectedTable}?${queryParams}`);
      const data = await response.json();
      setTableData(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
    }
  };

  const fetchHorseEntries = async (horseName) => {
  setLoadingHorseData(true);
  try {
    const params = new URLSearchParams({
      horseName,
      page: selectedHorsePage,
      limit: ROWS_PER_PAGE
    });

    const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/APIData_Table2/horse?${params}`);
    // const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/APIData_Table2/horse?${params}`);
    
    const data = await response.json();
    setSelectedHorseData(data.data);
    setSelectedHorseTotalPages(data.totalPages || 1);
  } catch (error) {
    console.error("Error fetching race records for horse:", error);
    setSelectedHorseData([]); // fallback to empty on error
  } finally {
    setLoadingHorseData(false);
  }
};



  useEffect(() => {
    fetchFilteredData();
  }, [currentPage, searchQuery, selectedCountry, sortBy, order]);

  useEffect(() => {
    if (selectedHorse) fetchHorseEntries(selectedHorse);
  }, [selectedHorse, selectedHorsePage, sortBy, order]);

  return (
    <div className="mt-0 mb-0 flex flex-col gap-3">
      <div className="flex items-center mb-2">
        <label htmlFor="table-select" className="mr-2 text-[12px]">Time Period:</label>
        <select
          id="table-select"
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          className="p-2 text-xs rounded-md border border-gray-300"
        >
          <option value="horse_names">Overall</option>
        </select>
      </div>

      {/* Search Box */}
      <HorseProfile setSearchQuery={setSearchQuery} />

      {/* Country Filter */}
      <div className="relative mb-4">
        <label htmlFor="country-filter" className="mr-2 text-[12px]">Country:</label>
        <select
          id="country-filter"
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="p-2 text-xs rounded-md border border-gray-300"
        >
          <option value="">All</option>
          {countryCodes.map((code) => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
      </div>


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
            { value: "Sire", label: "Horse" },
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
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Sorting Order Buttons */}
        <button
          className={`p-1 text-xs rounded ${order === "asc" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setOrder("asc")}
        >
          ↑
        </button>

        <button
          className={`p-1 text-xs rounded ${order === "desc" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          onClick={() => setOrder("desc")}
        >
          ↓
        </button>
      </div>
      )}

      <ReportTable
        tableData={tableData}
        title="Horse Report Table"
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        addHorseToList={addHorseToList}
        sortBy={sortBy}
        setSortBy={setSortBy}
        order={order}
        setOrder={setOrder}
        setSelectedHorse={setSelectedHorse}
        setSelectedHorsePage={setSelectedHorsePage}
      />
      {selectedHorse && (
        <div className="mt-6">
          <Typography variant="h6" className="mb-2 text-sm font-semibold">
            Showing results for: <span className="text-blue-600">{selectedHorse}</span>
          </Typography>
          <DynamicTable data={selectedHorseData} refreshHorseData={refreshHorseData} />
        </div>
      )}
    </div>
  );
}

export default HorseProfiles;
