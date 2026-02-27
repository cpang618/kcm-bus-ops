import { useEffect, useMemo } from "react";
import type { StopHeadwayResult, HeadwayStatus } from "@bus-ops/shared";
import { classifyHeadway } from "@bus-ops/shared";
import { useMap } from "./MapView.js";
import { useRouteFilter } from "../../store/routeFilter.js";
import { useThresholds } from "../../store/thresholds.js";
import { STATUS_COLORS } from "./constants.js";

const SOURCE_ID = "stop-headways";
const LAYER_CIRCLE_ID = "stop-headways-circle";

const STATUS_RANK: Record<HeadwayStatus, number> = {
  bunching: 4,
  gapping: 3,
  "on-time": 2,
  unknown: 1,
};

interface StopHeadwayLayerProps {
  stopHeadways: StopHeadwayResult[];
}

export function StopHeadwayLayer({ stopHeadways }: StopHeadwayLayerProps) {
  const map = useMap();
  const { selectedRouteIds } = useRouteFilter();
  const { thresholds } = useThresholds();

  const featureCollection = useMemo((): GeoJSON.FeatureCollection => {
    const byStop = new Map<string, { worstStatus: HeadwayStatus; worstRank: number; result: StopHeadwayResult }>();

    for (const sh of stopHeadways) {
      if (selectedRouteIds !== "all" && !selectedRouteIds.has(sh.routeId)) continue;
      const status = classifyHeadway(sh, thresholds);
      const rank = STATUS_RANK[status];
      const existing = byStop.get(sh.stopId);
      if (!existing || rank > existing.worstRank) {
        byStop.set(sh.stopId, { worstStatus: status, worstRank: rank, result: sh });
      }
    }

    return {
      type: "FeatureCollection",
      features: Array.from(byStop.values()).map(({ worstStatus, result }) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [result.lng, result.lat] },
        properties: {
          stopId: result.stopId,
          stopName: result.stopName,
          status: worstStatus,
          color: STATUS_COLORS[worstStatus],
        },
      })),
    };
  }, [stopHeadways, selectedRouteIds, thresholds]);

  useEffect(() => {
    if (!map) return;
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: "geojson", data: featureCollection });
      map.addLayer({
        id: LAYER_CIRCLE_ID,
        type: "circle",
        source: SOURCE_ID,
        minzoom: 14,
        paint: {
          "circle-radius": 7,
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1.5,
          "circle-opacity": 0.95,
        },
      });
    } else {
      (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(featureCollection);
    }

    return () => {
      if (map.getLayer(LAYER_CIRCLE_ID)) map.removeLayer(LAYER_CIRCLE_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    if (!map || !map.getSource(SOURCE_ID)) return;
    (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(featureCollection);
  }, [map, featureCollection]);

  return null;
}
