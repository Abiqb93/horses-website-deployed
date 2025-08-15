// pages/dashboard/ServerSearchTable.jsx
import React, { useEffect, useState } from "react";

/**
 * Reusable server-driven table component with inline tracking (no top search, no country filter).
 *
 * Props:
 * - baseUrl: string (required) e.g. "https://horseracesbackend-production.up.railway.app/api"
 * - tableResolver: (ctx) => string  (required) returns table name, e.g. "horse_names"
 *   ctx = { period, extra, sortBy, order }
 * - columns: Array<{ key: string, label?: string }>
 *   NOTE: Do NOT provide a custom "render" for the horse column; this component will handle it.
 * - horseColumnKey?: string          default: "Sire"  (the field holding horse name)
 * - onHorseClick?: (name, row) => void
 * - rowsPerPage?: number             default: 10
 * - defaultSortBy?: string           default: "Sire"
 * - defaultOrder?: "asc"|"desc"      default: "asc"
 * - period?: string|any
 * - extra?: object
 * - enableTracking?: boolean         default: true
 * - trackingCategories?: string[]    default list provided below
 * - onTrackedChange?: (name, trackedType|null) => void // callback after track/untrack
 */
export default function ServerSearchTable({
  baseUrl,
  tableResolver,
  columns,
  horseColumnKey = "Sire",
  onHorseClick,
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

  // tracking state
  const [trackedMap, setTrackedMap] = useState({}); // { "horse lower": { type, since } }
  const [trackChoice, setTrackChoice] = useState({}); // per-row selected category
  const [busyHorse, setBusyHorse] = useState(""); // horse currently being tracked/untracked

  // helpers
  const userId = (() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser).userId : "Guest";
    } catch {
      return "Guest";
    }
  })();

  const getHorseKey = (name) => (name || "").toLowerCase().trim();

  // reset to page 1 when sort/period change
  useEffect(() => { setPage(1); }, [sortBy, order, period]);

  const tableName = tableResolver({ period, extra, sortBy, order }) || "horse_names";

  const buildQuery = () => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(rowsPerPage));
    if (sortBy) p.set("sortBy", sortBy);
    if (order) p.set("order", order);
    return p.toString();
  };

  async function fetchRows() {
    setLoading(true);
    setError("");
    try {
      const qs = buildQuery();
      const res = await fetch(`${baseUrl}/${tableName}?${qs}`);
      const text = await res.text();
      const json = JSON.parse(text);
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

  // load table rows
  useEffect(() => { fetchRows(); }, [tableName, page, sortBy, order]);

  // fetch all tracked horses for this user (once per mount/userId)
  useEffect(() => {
    if (!enableTracking) return;
    (async () => {
      try {
        const res = await fetch(`${baseUrl}/horseTracking?user=${encodeURIComponent(userId)}`);
        const text = await res.text();
        const json = JSON.parse(text);
        const map = {};
        (json.data || []).forEach((t) => {
          const key = getHorseKey(t.horseName);
          map[key] = { type: t.TrackingType || "Unspecified", since: t.trackingDate || null };
        });
        setTrackedMap(map);
      } catch (err) {
        console.error("Failed to fetch tracked list:", err);
        setTrackedMap({});
      }
    })();
  }, [baseUrl, userId, enableTracking]);

  // actions
  const trackHorse = async (horseName) => {
    const selected = trackChoice[getHorseKey(horseName)] || trackingCategories[0];
    setBusyHorse(horseName);
    try {
      const payload = {
        horseName,
        note: "",
        trackingDate: new Date().toISOString(),
        TrackingType: selected,
        User: userId,
      };
      const res = await fetch(`${baseUrl}/horseTracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to track");
      setTrackedMap((prev) => ({
        ...prev,
        [getHorseKey(horseName)]: { type: selected, since: new Date().toISOString() },
      }));
      if (onTrackedChange) onTrackedChange(horseName, selected);
    } catch (e) {
      console.error(e);
      alert("Error tracking horse.");
    } finally {
      setBusyHorse("");
    }
  };

  const untrackHorse = async (horseName) => {
    if (!window.confirm(`Stop tracking ${horseName}?`)) return;
    setBusyHorse(horseName);
    try {
      const res = await fetch(
        `${baseUrl}/horseTracking/${encodeURIComponent(horseName)}?user=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to untrack");
      setTrackedMap((prev) => {
        const copy = { ...prev };
        delete copy[getHorseKey(horseName)];
        return copy;
      });
      if (onTrackedChange) onTrackedChange(horseName, null);
    } catch (e) {
      console.error(e);
      alert("Failed to stop tracking.");
    } finally {
      setBusyHorse("");
    }
  };

  const headerCell = (col) => {
    const isActive = sortBy === col.key;
    return (
      <th
        key={col.key}
        className="px-2 py-2 text-left cursor-pointer select-none"
        onClick={() => {
          if (isActive) setOrder(order === "asc" ? "desc" : "asc");
          else { setSortBy(col.key); setOrder("asc"); }
        }}
      >
        <span className="text-[11px] font-semibold">
          {col.label || col.key}
          <span className="ml-1">{isActive ? (order === "asc" ? "🔼" : "🔽") : "↕"}</span>
        </span>
      </th>
    );
  };

  const renderHorseCell = (row) => {
    const name = row[horseColumnKey];
    const key = getHorseKey(name);
    const trackedInfo = trackedMap[key];

    return (
      <div className="flex items-center gap-2">
        <span
          className="text-blue-700 underline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onHorseClick && onHorseClick(name, row);
          }}
        >
          {name}
        </span>

        {enableTracking && (
          <>
            {trackedInfo ? (
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-[2px] rounded-full">
                Tracked · {trackedInfo.type}
              </span>
            ) : (
              <div className="flex items-center gap-1">
                <select
                  className="text-[10px] border rounded px-1 py-[2px] bg-white"
                  value={trackChoice[key] || trackingCategories[0]}
                  onChange={(e) =>
                    setTrackChoice((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                >
                  {trackingCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  className="text-[10px] px-2 py-[2px] rounded bg-blue-600 text-white disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    trackHorse(name);
                  }}
                  disabled={busyHorse === name}
                >
                  {busyHorse === name ? "Saving…" : "Track"}
                </button>
              </div>
            )}

            {trackedInfo && (
              <button
                className="text-[10px] text-red-600 underline ml-1"
                onClick={(e) => {
                  e.stopPropagation();
                  untrackHorse(name);
                }}
                disabled={busyHorse === name}
                title="Stop tracking"
              >
                ✖
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-3 bg-white text-black space-y-3">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full text-[12px] table-auto">
          <thead className="bg-gray-100">
            <tr>
              {columns.map(headerCell)}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns.length} className="p-3 text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={columns.length} className="p-3 text-red-600">
                  {error}
                </td>
              </tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-3 text-gray-500">
                  No results
                </td>
              </tr>
            )}
            {!loading && !error && rows.map((row, idx) => (
              <tr key={idx} className="border-t hover:bg-gray-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-2 py-2">
                    {c.key === horseColumnKey
                      ? renderHorseCell(row)
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
        <button
          className="px-2 py-1 border rounded text-sm disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Prev
        </button>
        <span className="text-sm">Page {page} / {totalPages}</span>
        <button
          className="px-2 py-1 border rounded text-sm disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
