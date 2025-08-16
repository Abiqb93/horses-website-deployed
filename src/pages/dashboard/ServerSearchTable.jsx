// pages/dashboard/ServerSearchTable.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import _ from "lodash";

// same helper used in other pages
const countryFlagURL = (code) => {
  const map = {
    GBR: "GB", IRE: "IE", FRA: "FR", GER: "DE", USA: "US", SAF: "ZA", AUS: "AU",
    JAP: "JP", CAN: "CA", ITY: "IT", ARG: "AR", UAE: "AE", HGK: "HK", SWE: "SE",
    SAU: "SA", ZIM: "ZW", TUR: "TR", QAT: "QA", BRA: "BR", SWI: "CH", NOR: "NO",
    SIN: "SG", URG: "UY", BEL: "BE", NZD: "NZ", DEN: "DK", JER: "JE", BAH: "BH",
    CHI: "CL", RUS: "RU", CZE: "CZ", KAZ: "KZ", SPA: "ES", MAL: "MY", MAC: "MO",
    VEN: "VE", PER: "PE", SLO: "SI", POL: "PL", AST: "KZ", HUN: "HU", MEX: "MX",
    HOL: "NL", OMN: "OM", MOR: "MA", KOR: "KR", GUR: "GU", PAN: "PA", ALL: "UN"
  };
  const iso = map[code] || code?.slice(0, 2).toLowerCase();
  return `https://flagcdn.com/w40/${iso.toLowerCase()}.png`;
};

export default function ServerSearchTable({
  baseUrl,
  tableResolver,
  columns,
  horseColumnKey = "Sire",
  rowsPerPage = 10,
  defaultSortBy = "Sire",
  defaultOrder = "asc",
  period,
  extra,
  enableTracking = true,
  trackingCategories = ["Prospect", "Purchase", "Future Bet", "Stallion", "Mare", "Relative"],
  onTrackedChange,
}) {
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [order, setOrder] = useState(defaultOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // search
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useMemo(() => _.debounce((q) => setSearchQuery(q), 300), []);

  // tracking state
  const [trackedMap, setTrackedMap] = useState({});
  const [trackChoice, setTrackChoice] = useState({});
  const [busyHorse, setBusyHorse] = useState("");

  const userId = (() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser).userId : "Guest";
    } catch {
      return "Guest";
    }
  })();

  const getHorseKey = (n) => (n || "").toLowerCase().trim();

  useEffect(() => { setPage(1); }, [sortBy, order, period]);

  const tableName = tableResolver({ period, extra, sortBy, order }) || "horse_names";

  const buildQuery = () => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(rowsPerPage));
    sortBy && p.set("sortBy", sortBy);
    order && p.set("order", order);
    searchQuery && p.set("sire", searchQuery);
    return p.toString();
  };

  async function fetchRows() {
    setLoading(true);
    setError("");
    try {
      const qs = buildQuery();
      const res = await fetch(`${baseUrl}/${tableName}?${qs}`);
      const json = await res.json();
      setRows(Array.isArray(json.data) ? json.data : []);
      setTotalPages(json.totalPages ?? 1);
    } catch (e) {
      console.error(e);
      setRows([]);
      setTotalPages(1);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchRows(); }, [tableName, page, sortBy, order, searchQuery]);

  useEffect(() => {
    if (!enableTracking) return;
    (async () => {
      const res = await fetch(`${baseUrl}/horseTracking?user=${encodeURIComponent(userId)}`);
      const json = await res.json();
      const m = {};
      (json.data || []).forEach((t) => {
        const k = getHorseKey(t.horseName);
        m[k] = { type: t.TrackingType, since: t.trackingDate };
      });
      setTrackedMap(m);
    })();
  }, [baseUrl, userId, enableTracking]);

  const trackHorse = async (horse) => {
    const selected = trackChoice[getHorseKey(horse)] || trackingCategories[0];
    setBusyHorse(horse);
    try {
      const payload = {
        horseName: horse,
        note: "",
        trackingDate: new Date().toISOString(),
        TrackingType: selected,
        User: userId,
      };
      const res = await fetch(`${baseUrl}/horseTracking`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setTrackedMap((p) => ({ ...p, [getHorseKey(horse)]: { type: selected, since: new Date().toISOString() } }));
      onTrackedChange?.(horse, selected);
    } catch {
      alert("Error tracking.");
    } finally {
      setBusyHorse("");
    }
  };

  const untrackHorse = async (horse) => {
    if (!window.confirm(`Stop tracking ${horse}?`)) return;
    setBusyHorse(horse);
    try {
      const res = await fetch(
        `${baseUrl}/horseTracking/${encodeURIComponent(horse)}?user=${encodeURIComponent(userId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTrackedMap((p) => { const cp = { ...p }; delete cp[getHorseKey(horse)]; return cp; });
      onTrackedChange?.(horse, null);
    } catch {
      alert("Error untracking.");
    } finally {
      setBusyHorse("");
    }
  };

  const renderHorseCell = (row) => {
    const name = row[horseColumnKey];
    const key = getHorseKey(name);
    const tracked = trackedMap[key];
    return (
      <div className="flex items-center gap-2">
        {/* CLICKABLE HORSE NAME */}
        <Link
          to={`/dashboard/horse/${encodeURIComponent(name)}`}
          className="text-blue-700 underline"
        >
          {name}
        </Link>

        {enableTracking && (
          <>
            {tracked ? (
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-[2px] rounded-full">Tracked · {tracked.type}</span>
            ) : (
              <div className="flex items-center gap-1">
                <select
                  className="text-[10px] border rounded px-1 py-[2px]"
                  value={trackChoice[key] || trackingCategories[0]}
                  onChange={(e) => setTrackChoice((p) => ({ ...p, [key]: e.target.value }))}
                >
                  {trackingCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <button
                  disabled={busyHorse === name}
                  onClick={(e) => { e.stopPropagation(); trackHorse(name); }}
                  className="text-[10px] px-2 py-[2px] rounded bg-blue-600 text-white disabled:opacity-50"
                >
                  {busyHorse === name ? "Saving…" : "Track"}
                </button>
              </div>
            )}
            {tracked && (
              <button disabled={busyHorse === name}
                onClick={(e) => { e.stopPropagation(); untrackHorse(name); }}
                className="text-[10px] text-red-600 underline ml-1">✖</button>
            )}
          </>
        )}
      </div>
    );
  };

  const headerCell = (c) => {
    const active = sortBy === c.key;
    return (
      <th key={c.key}
        className="px-2 py-2 text-left cursor-pointer"
        onClick={() => { active ? setOrder(order === "asc" ? "desc" : "asc") : (setSortBy(c.key), setOrder("asc")); }}>
        <span className="text-[11px] font-semibold">
          {c.label || c.key}{" "}
          <span>{active ? (order === "asc" ? "🔼" : "🔽") : "↕"}</span>
        </span>
      </th>
    );
  };

  return (
    <div className="border rounded-lg p-3 bg-white text-black space-y-3">

      {/* Search Bar */}
      <div className="max-w-xs">
        <input
          type="text"
          placeholder="Search Horse..."
          className="w-full p-2 text-xs border rounded"
          onChange={(e) => debouncedSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full text-[12px] table-auto">
          <thead className="bg-gray-100">
            <tr>{columns.map(headerCell)}</tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={columns.length} className="p-3 text-gray-500">Loading…</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={columns.length} className="p-3 text-red-600">{error}</td></tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr><td colSpan={columns.length} className="p-3 text-gray-500">No results</td></tr>
            )}
            {!loading && !error && rows.map((row, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-2 py-2">
                    {c.key === horseColumnKey
                      ? renderHorseCell(row)
                      : c.key === "Country"
                        ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={countryFlagURL(row[c.key])}
                              alt={row[c.key]}
                              className="w-4 h-4"
                            />
                            <span>{row[c.key]}</span>
                          </div>
                        )
                        : (row[c.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-2">
        <button disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-2 py-1 border rounded text-sm disabled:opacity-50">Prev</button>
        <span className="text-sm">Page {page} / {totalPages}</span>
        <button disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="px-2 py-1 border rounded text-sm disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
