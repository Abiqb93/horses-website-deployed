const countryFlagURL = (countryCode) => {
  const correctedCode = countryCode === "UK" ? "GB" : countryCode;
  return `https://flagcdn.com/w40/${correctedCode.toLowerCase()}.png`;
};

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Typography } from "@material-tailwind/react";

const ROWS_PER_PAGE = 10;

const ReportTable = ({ tableData, title, currentPage, setCurrentPage, totalPages, addHorseToList }) => {
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
              {["Add", "Horse", "Country", "Runners", "Runs", "Winners", "Wins", "WinPercent_", "Stakes_Winners", "Stakes_Wins", "Group_Winners", "Group_Wins", "Group_1_Winners", "Group_1_Wins", "WTR", "SWTR", "GWTR", "G1WTR", "WIV", "WOE", "WAX", "Percent_RB2"]
                .map((el) => (
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
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                    onClick={() => addHorseToList(item)}
                  >
                    +
                  </button>,
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
                  item["Runners"],
                  item["Runs"],
                  item["Winners"],
                  item["Wins"],
                  item["WinPercent_"],
                  item["Stakes_Winners"],
                  item["Stakes_Wins"],
                  item["Group_Winners"],
                  item["Group_Wins"],
                  item["Group_1_Winners"],
                  item["Group_1_Wins"],
                  item["WTR"],
                  item["SWTR"],
                  item["GWTR"],
                  item["G1WTR"],
                  item["WIV"],
                  item["WOE"],
                  item["WAX"],
                  item["Percent_RB2"],
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

export function HorseProfiles() {
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTable, setSelectedTable] = useState("horse_names");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedHorses, setSelectedHorses] = useState([]);

  const countryCodes = [
    "MU", "US", "SA", "MX", "UY", "AU", "ZA", "CL", "NZ", "JP", "FI", "AR", "AE", "TR", "UK", "DK", "AT", "CZ",
    "IN", "ES", "IRE", "BR", "IT", "FR", "SE", "CA", "KR", "DE", "PA", "HK", "PL", "PE", "SK", "BH", "BE",
    "MA", "CH", "PR", "MO", "NO", "ZW", "HU", "SG", "UAE",
  ];

  const addHorseToList = async (horse) => {
    const userId = "Tom"; // Hardcoded user_id for now
  
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
    
  


  const updateHorseNote = (index, note) => {
    const updatedHorses = [...selectedHorses];
    updatedHorses[index].note = note;
    setSelectedHorses(updatedHorses);
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append("page", currentPage);
    params.append("limit", ROWS_PER_PAGE);
    if (searchQuery) params.append("sire", searchQuery);
    if (selectedCountry) params.append("country", selectedCountry);
    return params.toString();
  };

  const fetchFilteredData = async () => {
    try {
      const queryParams = buildQueryParams();
      const response = await fetch(`https://horseracesbackend-production.up.railway.app/api/${selectedTable}?${queryParams}`);
      // const response = await fetch(`http://localhost:8080/api/${selectedTable}?${queryParams}`);
      const data = await response.json();
      setTableData(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
    }
  };

  useEffect(() => {
    fetchFilteredData();
  }, [currentPage, searchQuery, selectedCountry]);

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
          <option value="horse_names">Overall</option>
        </select>
      </div>

      {/* Search Box */}
      <div className="relative mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Horse..."
          className="p-2 border rounded-md w-full max-w-xs"
        />
      </div>

      {/* Country Filter */}
      <div className="relative mb-4">
        <label htmlFor="country-filter" className="mr-2">Country:</label>
        <select
          id="country-filter"
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

      <ReportTable
        tableData={tableData}
        title="Horse Report Table"
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        addHorseToList={addHorseToList}
      />

      <div className="mt-8 bg-white p-4 rounded shadow">
        <Typography variant="h5" className="mb-4 font-bold text-sm">Selected Horses</Typography>
        <ul>
          {selectedHorses.map((horse, index) => (
            <li key={index} className="mb-4">
              <div className="flex items-start gap-4">
                <div>
                  <Typography variant="subtitle2" className="font-medium text-sm">
                    {horse.Sire}
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-400 text-xs">
                    {horse.Country}
                  </Typography>
                </div>
                {/* <textarea
                  value={horse.note}
                  onChange={(e) => updateHorseNote(index, e.target.value)}
                  placeholder="Add a note..."
                  className="border rounded-md p-2 w-full h-16"
                /> */}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default HorseProfiles;
