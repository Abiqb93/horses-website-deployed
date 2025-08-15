// pages/dashboard/SireSearchTable.jsx
import React, { useState, useEffect } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import _ from "lodash";

const ROWS_PER_PAGE = 3; // ✅ show 3 entries per page

const countryFlagURL = (countryCode) => {
  const correctedCode =
    countryCode === "UK" ? "GB" :
    countryCode === "IRE" ? "IE" :
    countryCode;
  return `https://flagcdn.com/w40/${correctedCode?.toLowerCase()}.png`;
};

const SearchInput = ({ setSearchQuery }) => {
  const debouncedSearch = _.debounce((q) => setSearchQuery(q), 300);
  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  return (
    <div className="relative mb-2 max-w-lg">
      <div className="flex items-center rounded-full shadow-md border border-gray-300 bg-white overflow-hidden focus-within:ring focus-within:ring-blue-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-5.197-5.197M16.804 10.804a6 6 0 11-12 0 6 6 0 0112 0z"/>
        </svg>
        <input
          type="text"
          placeholder="Search Sire..."
          className="flex-grow p-3 text-sm text-gray-700 focus:outline-none focus:ring-0 bg-transparent"
          onChange={(e) => debouncedSearch(e.target.value)}
        />
      </div>
    </div>
  );
};

const ReportTable = ({
  tableData,
  currentPage,
  setCurrentPage,
  totalPages,
  sortBy,
  setSortBy,
  order,
  setOrder,
  onSireTrack,
}) => {
  const startPage = Math.max(1, currentPage - 5);
  const endPage = Math.min(startPage + 9, totalPages);

  const handleSort = (column) => {
    if (sortBy === column) setOrder(order === "asc" ? "desc" : "asc");
    else { setSortBy(column); setOrder("asc"); }
  };

  const Pagination = () => (
    <div className="flex justify-center items-center mt-3">
      <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-2 py-1 mx-1 text-sm border bg-gray-200 disabled:opacity-50">Previous</button>
      {Array.from({ length: endPage - startPage + 1 }, (_, index) => (
        <button
          key={index}
          onClick={() => setCurrentPage(startPage + index)}
          className={`px-2 py-1 mx-1 text-sm border ${currentPage === startPage + index ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          {startPage + index}
        </button>
      ))}
      <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-2 py-1 mx-1 text-sm border bg-gray-200 disabled:opacity-50">Next</button>
    </div>
  );

  const headers = [
    "Sire","Country","Runners","Runs","Winners","Wins","WinPercent_","Stakes_Winners","Stakes_Wins",
    "Group_Winners","Group_Wins","Group_1_Winners","Group_1_Wins","WTR","SWTR","GWTR","G1WTR","WIV","WOE","WAX","Percent_RB2"
  ];

  return (
    <Card className="bg-white text-black">
      <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
        <table className="w-full min-w-[640px] table-auto">
          <thead>
            <tr>
              {headers.map((el) => (
                <th
                  key={el}
                  className="border-b border-blue-gray-50 py-3 px-5 text-left cursor-pointer hover:text-blue-500 transition duration-200"
                  onClick={() => handleSort(el)}
                >
                  <Typography variant="small" className="text-[11px] font-bold uppercase flex items-center gap-1">
                    {el}
                    <span className="text-gray-400">{sortBy === el ? (order === "asc" ? "🔼" : "🔽") : "↕"}</span>
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => (
              <tr key={index}>
                {[
                  <div className="flex items-center gap-2" key="sire-cell">
                    {onSireTrack && (
                      <button
                        className="text-green-600 text-sm hover:text-green-800"
                        onClick={() => onSireTrack(item["Sire"])}
                        title="Track this sire"
                      >
                        +
                      </button>
                    )}
                    <span>{item["Sire"]}</span>
                  </div>,
                  item["Country"] && (
                    <div className="flex items-center gap-2" key="country-cell">
                      <img src={countryFlagURL(item["Country"])} alt={item["Country"]} className="w-5 h-5" />
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

export default function SireSearchTable() {
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ✅ removed: selectedTable, country/race filters, showFilters
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Runners");
  const [order, setOrder] = useState("desc");

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append("page", currentPage);
    params.append("limit", ROWS_PER_PAGE);
    if (searchQuery) params.append("sire", searchQuery);
    if (sortBy) params.append("sortBy", sortBy);
    if (order) params.append("order", order);
    return params.toString();
  };

  const fetchFilteredData = async () => {
    try {
      const query = buildQueryParams();
      // ✅ always use the "sire_profile" table (no period filters)
      const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/sire_profile?${query}`);
      const json = await res.json();
      setTableData(json.data || []);
      setTotalPages(json.totalPages || 1);
    } catch (e) {
      console.error("Error fetching sire table:", e);
    }
  };

  useEffect(() => {
    fetchFilteredData();
  }, [currentPage, searchQuery, sortBy, order]);

  const handleSireTrack = async (sireName) => {
    const userId = (() => {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser).userId : "Guest";
    })();

    try {
      const res = await fetch(`https://horseracesbackend-production.up.railway.app/api/APIData_Table2/sire?sireName=${encodeURIComponent(sireName)}`);
      const data = await res.json();
      const horseList = [...new Set((data.data || []).map(e => e.horseName?.trim()).filter(Boolean))];

      if (horseList.length === 0) {
        alert(`No horses found for sire "${sireName}".`);
        return;
      }

      const post = await fetch("https://horseracesbackend-production.up.railway.app/api/sire_tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sireName, correspondingHorses: horseList, user_id: userId }),
      });

      const resp = await post.json();
      if (post.ok) alert(`✅ Tracked ${horseList.length} horses for "${sireName}".`);
      else alert(`❌ Failed to track "${sireName}": ${resp.error || "Unknown error"}`);
    } catch (err) {
      console.error("Error tracking sire:", err);
      alert("❌ Something went wrong while tracking.");
    }
  };

  return (
    <div className="mt-4 mb-8 flex flex-col gap-3">
      {/* ✅ Only a simple search box remains */}
      <SearchInput setSearchQuery={(q) => { setSearchQuery(q); setCurrentPage(1); }} />

      <ReportTable
        tableData={tableData}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        sortBy={sortBy}
        setSortBy={setSortBy}
        order={order}
        setOrder={setOrder}
        onSireTrack={handleSireTrack}
      />
    </div>
  );
}
