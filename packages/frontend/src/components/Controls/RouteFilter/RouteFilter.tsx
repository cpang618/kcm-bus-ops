import { useMemo, useState, useCallback } from "react";
import type { RouteCategory } from "@bus-ops/shared";
import { ROUTE_CATEGORIES } from "@bus-ops/shared";
import { useRouteFilter } from "../../../store/routeFilter.js";
import { useMap } from "../../Map/MapView.js";
import { CategorySection, type RouteInfo } from "./CategorySection.js";
import styles from "./RouteFilter.module.css";

interface RouteFilterProps {
  routeFeatures: GeoJSON.Feature[];
}

export function RouteFilter({ routeFeatures }: RouteFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const map = useMap();

  const {
    selectedRouteIds, selectAll, clearAll,
    selectedDirectionId, setDirectionId,
    showStops, toggleStops,
  } = useRouteFilter();

  const handleRouteClick = useCallback(
    (routeId: string) => {
      if (!map) return;
      const targetDir = selectedDirectionId === 0 ? 0 : 1;
      const feature = routeFeatures.find(
        (f) => f.properties?.routeId === routeId && f.properties?.directionId === targetDir,
      );
      if (!feature || feature.geometry.type !== "LineString") return;
      const [lng, lat] = (feature.geometry as GeoJSON.LineString).coordinates[0];
      map.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
    },
    [map, routeFeatures, selectedDirectionId],
  );

  const { categoryMap, allRouteIds } = useMemo(() => {
    const catMap = new Map<RouteCategory, RouteInfo[]>();
    for (const cat of ROUTE_CATEGORIES) catMap.set(cat, []);
    const allIds: string[] = [];
    const seen = new Set<string>();
    for (const feature of routeFeatures) {
      const props = feature.properties as { routeId: string; routeShortName: string; routeCategory: string };
      if (seen.has(props.routeId)) continue;
      seen.add(props.routeId);
      const cat = (ROUTE_CATEGORIES.includes(props.routeCategory as RouteCategory)
        ? props.routeCategory : "Local") as RouteCategory;
      catMap.get(cat)!.push({ routeId: props.routeId, routeShortName: props.routeShortName });
      allIds.push(props.routeId);
    }
    for (const [, routes] of catMap) {
      routes.sort((a, b) => a.routeShortName.localeCompare(b.routeShortName, undefined, { numeric: true }));
    }
    return { categoryMap: catMap, allRouteIds: allIds };
  }, [routeFeatures]);

  const allSelected = selectedRouteIds === "all";

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Route Filter</span>
        <div className={styles.headerActions}>
          <button className={`${styles.actionBtn} ${allSelected ? styles.active : ""}`} onClick={selectAll}>All</button>
          <button className={styles.actionBtn} onClick={clearAll}>Clear</button>
          <button className={styles.collapseBtn} onClick={() => setIsOpen((o) => !o)} title={isOpen ? "Collapse filter" : "Expand filter"}>
            {isOpen ? "\u25b2" : "\u25bc"}
          </button>
        </div>
      </div>

      <div className={`${styles.body} ${isOpen ? styles.bodyOpen : ""}`}>
        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <span className={styles.controlLabel}>Direction</span>
            <div className={styles.pillGroup}>
              <button className={`${styles.pill} ${selectedDirectionId === "all" ? styles.pillActive : ""}`} onClick={() => setDirectionId("all")}>All</button>
              <button className={`${styles.pill} ${selectedDirectionId === 0 ? styles.pillActive : ""}`} onClick={() => setDirectionId(0)} title="Outbound (direction 0)">Outbound</button>
              <button className={`${styles.pill} ${selectedDirectionId === 1 ? styles.pillActive : ""}`} onClick={() => setDirectionId(1)} title="Inbound (direction 1)">Inbound</button>
            </div>
          </div>
          <div className={styles.controlRow}>
            <span className={styles.controlLabel}>Bus Stops</span>
            <button className={`${styles.toggleBtn} ${showStops ? styles.toggleOn : styles.toggleOff}`} onClick={toggleStops} title={showStops ? "Hide bus stops" : "Show bus stops"}>
              <span className={styles.toggleDot} />
              <span className={styles.toggleText}>{showStops ? "On" : "Off"}</span>
            </button>
          </div>
        </div>

        <div className={styles.list}>
          {ROUTE_CATEGORIES.map((cat) => {
            const routes = categoryMap.get(cat) ?? [];
            if (routes.length === 0) return null;
            return (
              <CategorySection key={cat} category={cat} routes={routes} allRouteIds={allRouteIds} onRouteClick={handleRouteClick} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
