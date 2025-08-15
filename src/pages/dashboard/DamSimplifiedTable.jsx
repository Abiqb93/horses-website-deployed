// components/DamSimplifiedTable.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import _ from "lodash";

const countryFlagURL = (countryCode = "") => {
  const corrected = countryCode === "UK" ? "GB" : countryCode;
  return corrected ? `https://flagcdn.com/w40/${corrected.toLowerCase()}.png` : "";
};

export default function DamSimplifiedTable({
  baseUrl = "https://horseracesbackend-production.up.railway.app/api",
  rowsPerPage = 3,                 // show 3 per page by default
  defaultSortBy = "Runners",
  defaultOrder = "desc",
  onDamClick,                      // optional: (damName, row) => void
  showTrackButton = true,          // toggle "+" button
}) {
  // table state
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [order, setOrder] = useState(defaultOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // search state (debounced)
  const [search, setSearch] = useState("");
  const debouncedSetSearch = useMemo(
    () => _.debounce((q) => setSearch(q.trim()), 300),
    []
  );
  useEffect(() => () => debouncedSetSearch.cancel(), [debouncedSetSearch]);
  useEffect(() => { setPage(1); }, [search, sortBy, order]); // reset to page 1 when these change

  // NOTE: backend uses field "Sire" to carry Dam name in dam_profile
  const damKey = "Sire";

  const buildQuery = () => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(rowsPerPage));
    if (search) p.set("sire", search);       // server expects ?sire=
    if (sortBy) p.set("sortBy", sortBy);
    if (order) p.set("order", order);
    return p.toString();
  };

  async function fetchRows() {
    setLoading(true);
    setError("");
    try {
      const qs = buildQuery();
      const res = await fetch(`${baseUrl}/dam_profile?${qs}`);
      const text = await res.text();
      const json = JSON.parse(text);
      setRows(Array.isArray(json.data) ? json.data : []);
      setTotalPages(json.totalPages ?? 1);
    } catch (e) {
      console.error(e);
      setRows([]);
      setTotalPages(1);
      setError("Failed to load dams.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { fetchRows(); }, [page, search, sortBy, order]);

  const trackDam = async (damName) => {
    const storedUser = localStorage.getItem("user");
    const userId = storedUser ? JSON.parse(storedUser).userId : "Guest";
    try {
      // fetch horses by dam
      const res = await fetch(
        `${baseUrl}/APIData_Table2/dam?damName=${encodeURIComponent(damName)}`
      );
      const data = await res.json();
      const horseList = [...new Set((data.data || [])
        .map(e => e.horseName?.trim())
        .filter(Boolean))];

      if (!horseList.length) {
        alert(`No horses found for dam "${damName}".`);
        return;
      }

      // save tracking
      const postRes = await fetch(`${baseUrl}/dam_tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          damName,
          correspondingHorses: horseList,
          user_id: userId,
        }),
      });
      const postData = await postRes.json();
      if (postRes.ok) {
        alert(`✅ Tracked ${horseList.length} horses for "${damName}".`);
      } else {
        alert(`❌ Failed to track "${damName}": ${postData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error tracking dam:", err);
      alert("❌ Something went wrong while tracking.");
    }
  };

  const headers = [
    { key: damKey, label: "Dam" },
    { key: "Country", label: "Country" },
    { key: "Runners", label: "Runners" },
    { key: "Runs", label: "Runs" },
    { key: "Winners", label: "Winners" },
    { key: "Wins", label: "Wins" },
    { key: "WinPercent_", label: "WinPercent_" },
    { key: "Stakes_Winners", label: "Stakes_Winners" },
    { key: "Stakes_Wins", label: "Stakes_Wins" },
    { key: "Group_Winners", label: "Group_Winners" },
    { key: "Group_Wins", label: "Group_Wins" },
    { key: "Group_1_Winners", label: "Group_1_Winners" },
    { key: "Group_1_Wins", label: "Group_1_Wins" },
    { key: "WTR", label: "WTR" },
    { key: "SWTR", label: "SWTR" },
    { key: "GWTR", label: "GWTR" },
    { key: "G1WTR", label: "G1WTR" },
    { key: "WIV", label: "WIV" },
    { key: "WOE", label: "WOE" },
    { key: "WAX", label: "WAX" },
    { key: "Percent_RB2", label: "Percent_RB2" },
  ];

  const handleHeaderClick = (key) => {
    if (sortBy === key) setOrder(order === "asc" ? "desc" : "asc");
    else { setSortBy(key); setOrder("asc"); }
  };

  const startPage = Math.max(1, page - 5);
  const endPage = Math.min(startPage + 9, totalPages);

  return (
    <div className="bg-white rounded-lg">
      {/* Search bar — same rounded style */}
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
            placeholder="Search Dam..."
            className="flex-grow p-3 text-sm text-gray-700 focus:outline-none focus:ring-0 bg-transparent"
            onChange={(e) => debouncedSetSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="bg-white text-black mt-2">
        <CardBody className="overflow-x-auto px-0 pt-0 pb-2">
          <table className="w-full min-w-[640px] table-auto">
            <thead>
              <tr>
                {headers.map(h => (
                  <th
                    key={h.key}
                    className="border-b border-blue-gray-50 py-3 px-5 text-left cursor-pointer hover:text-blue-500"
                    onClick={() => handleHeaderClick(h.key)}
                  >
                    <Typography variant="small" className="text-[11px] font-bold uppercase flex items-center gap-1">
                      {h.label}
                      <span className="text-gray-400">
                        {sortBy === h.key ? (order === "asc" ? "🔼" : "🔽") : "↕"}
                      </span>
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={headers.length} className="p-3 text-gray-500">Loading…</td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={headers.length} className="p-3 text-red-600">{error}</td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={headers.length} className="p-3 text-gray-500">No results</td>
                </tr>
              )}
              {!loading && !error && rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {headers.map((h, i) => {
                    const value = row[h.key];

                    if (h.key === damKey) {
                      const damName = value;
                      return (
                        <td key={i} className={`py-3 px-5 ${idx === rows.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                          <div className="flex items-center gap-2">
                            {showTrackButton && (
                              <button
                                className="text-green-600 text-[12px] hover:text-green-800"
                                onClick={(e) => { e.stopPropagation(); trackDam(damName); }}
                                title="Track this dam"
                              >
                                +
                              </button>
                            )}
                            <span
                              className="text-blue-700 underline cursor-pointer text-[12px] font-medium"
                              onClick={(e) => { e.stopPropagation(); onDamClick && onDamClick(damName, row); }}
                            >
                              {damName}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    if (h.key === "Country") {
                      return (
                        <td key={i} className={`py-3 px-5 ${idx === rows.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                          {row.Country ? (
                            <div className="flex items-center gap-2">
                              <img src={countryFlagURL(row.Country)} alt={row.Country} className="w-5 h-5" />
                              <span className="text-[12px] font-medium text-blue-gray-600">{row.Country}</span>
                            </div>
                          ) : <span className="text-[12px] font-medium text-blue-gray-600">-</span>}
                        </td>
                      );
                    }

                    return (
                      <td key={i} className={`py-3 px-5 ${idx === rows.length - 1 ? "" : "border-b border-blue-gray-50"}`}>
                        <Typography className="text-[12px] font-medium text-blue-gray-600">
                          {value !== null && value !== undefined ? value : "-"}
                        </Typography>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center items-center mt-3">
            <button
              className="px-2 py-1 mx-1 text-[12px] border bg-gray-200 disabled:opacity-50"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            {Array.from({ length: endPage - startPage + 1 }, (_, index) => (
              <button
                key={index}
                onClick={() => setPage(startPage + index)}
                className={`px-2 py-1 mx-1 text-[12px] border ${page === startPage + index ? "bg-blue-500 text-white" : "bg-gray-200"}`}
              >
                {startPage + index}
              </button>
            ))}
            <button
              className="px-2 py-1 mx-1 text-[12px] border bg-gray-200 disabled:opacity-50"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
