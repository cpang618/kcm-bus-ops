import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Vehicle, HeadwayResult, HeadwayStatus } from "@bus-ops/shared";
import { classifyHeadway } from "@bus-ops/shared";
import { useMap } from "./MapView.js";
import { useRouteFilter } from "../../store/routeFilter.js";
import { useThresholds } from "../../store/thresholds.js";
import { STATUS_COLORS } from "./constants.js";

const SOURCE_ID = "vehicles";
const LAYER_ARROW_ID = "vehicles-arrow";
const LAYER_LABEL_ID = "vehicles-label";
const ARROW_IMAGE_ID = "bus-arrow";

function registerArrowImage(map: mapboxgl.Map): void {
  if (map.hasImage(ARROW_IMAGE_ID)) return;
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.moveTo(cx, 2);
  ctx.lineTo(cx + 10, size - 4);
  ctx.lineTo(cx + 3, size - 11);
  ctx.lineTo(cx - 3, size - 11);
  ctx.lineTo(cx - 10, size - 4);
  ctx.closePath();
  ctx.fillStyle = "rgba(255, 255, 255, 1)";
  ctx.fill();
  map.addImage(ARROW_IMAGE_ID, ctx.getImageData(0, 0, size, size), { sdf: true });
}

interface VehicleLayerProps {
  vehicles: Vehicle[];
  headways: HeadwayResult[];
}

const STATUS_LABELS: Record<HeadwayStatus, string> = {
  bunching: "Bunching",
  "on-time": "On Time",
  gapping: "Gapping",
  unknown: "Unknown",
};

function fmtSecs(secs: number | null | undefined): string {
  if (secs == null) return "\u2014";
  return `${Math.round(secs / 60)}m`;
}

function buildHoverHtml(vehicle: Vehicle, headway: HeadwayResult | undefined): string {
  const status: HeadwayStatus = (headway?.status as HeadwayStatus) ?? "unknown";
  const dirLabel = vehicle.directionId === 0 ? "Outbound" : "Inbound";

  let schedDiff = "\u2014";
  if (vehicle.expectedArrivalTime && vehicle.aimedArrivalTime) {
    const exp = Date.parse(vehicle.expectedArrivalTime);
    const aim = Date.parse(vehicle.aimedArrivalTime);
    if (!isNaN(exp) && !isNaN(aim)) {
      const diffMins = (exp - aim) / 60_000;
      const abs = Math.abs(diffMins).toFixed(1);
      if (diffMins > 0.5) schedDiff = `+${abs} min late`;
      else if (diffMins < -0.5) schedDiff = `${abs} min early`;
      else schedDiff = "On time";
    }
  }

  const headsign = vehicle.headsign ? ` \u00b7 ${vehicle.headsign}` : "";

  return `
    <div style="
      font-family: system-ui, sans-serif;
      font-size: 13px;
      color: #fff;
      background: #1a1a1a;
      padding: 12px 14px;
      border-radius: 8px;
      min-width: 210px;
      line-height: 1.4;
    ">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:16px; font-weight:700;">${vehicle.routeShortName}${headsign}</span>
        <span style="
          background:${STATUS_COLORS[status]};
          color:#fff; font-size:11px; font-weight:600;
          padding:2px 8px; border-radius:12px; margin-left:8px;
        ">${STATUS_LABELS[status]}</span>
      </div>
      <div style="color:#888; font-size:11px; margin-bottom:10px;">
        ${dirLabel} \u00b7 Bus #${vehicle.vehicleRef}
      </div>
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="color:#888; padding:2px 0;">Next stop</td>
          <td style="text-align:right; color:#ddd;">${vehicle.nextStopName || "\u2014"}</td>
        </tr>
        <tr>
          <td style="color:#888; padding:2px 0;">Headway</td>
          <td style="text-align:right; color:#ddd;">
            ${fmtSecs(headway?.actualHeadwaySecs)} / ${fmtSecs(headway?.scheduledHeadwaySecs)} sched
          </td>
        </tr>
        <tr>
          <td style="color:#888; padding:2px 0;">Schedule</td>
          <td style="text-align:right; color:#ddd;">${schedDiff}</td>
        </tr>
      </table>
    </div>
  `;
}

export function VehicleLayer({ vehicles, headways }: VehicleLayerProps) {
  const map = useMap();
  const { selectedRouteIds, selectedDirectionId } = useRouteFilter();
  const { thresholds } = useThresholds();

  const thresholdsRef = useRef(thresholds);
  useEffect(() => { thresholdsRef.current = thresholds; }, [thresholds]);

  const hoverPopupRef = useRef<mapboxgl.Popup | null>(null);

  const headwayByVehicle = useMemo(() => {
    const m = new Map<string, HeadwayResult>();
    for (const h of headways) m.set(h.vehicleRef, h);
    return m;
  }, [headways]);

  const headwayByVehicleRef = useRef(headwayByVehicle);
  useEffect(() => { headwayByVehicleRef.current = headwayByVehicle; }, [headwayByVehicle]);
  const vehiclesRef = useRef(vehicles);
  useEffect(() => { vehiclesRef.current = vehicles; }, [vehicles]);

  const featureCollection = useMemo((): GeoJSON.FeatureCollection => ({
    type: "FeatureCollection",
    features: vehicles.map((v) => {
      const headway = headwayByVehicle.get(v.vehicleRef);
      const status: HeadwayStatus = headway ? classifyHeadway(headway, thresholds) : "unknown";
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [v.lng, v.lat] },
        properties: {
          vehicleRef: v.vehicleRef,
          routeId: v.routeId,
          routeShortName: v.routeShortName,
          directionId: v.directionId,
          nextStopName: v.nextStopName,
          bearing: v.bearing,
          progressRate: v.progressRate,
          status,
          color: STATUS_COLORS[status],
        },
      };
    }),
  }), [vehicles, headwayByVehicle, thresholds]);

  useEffect(() => {
    if (!map) return;

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: "geojson", data: featureCollection });
      registerArrowImage(map);

      map.addLayer({
        id: LAYER_ARROW_ID,
        type: "symbol",
        source: SOURCE_ID,
        layout: {
          "icon-image": ARROW_IMAGE_ID,
          "icon-rotate": ["get", "bearing"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-size": ["interpolate", ["linear"], ["zoom"], 8, 0.30, 10, 0.45, 12, 0.65, 14, 0.90, 16, 1.10],
        },
        paint: {
          "icon-color": ["get", "color"],
          "icon-halo-color": "rgba(0, 0, 0, 0.75)",
          "icon-halo-width": 1.5,
          "icon-opacity": 0.95,
        },
      });

      map.addLayer({
        id: LAYER_LABEL_ID,
        type: "symbol",
        source: SOURCE_ID,
        minzoom: 13,
        layout: {
          "text-field": ["get", "routeShortName"],
          "text-size": 10,
          "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
        paint: {
          "text-color": "#fff",
          "text-halo-color": "rgba(0,0,0,0.8)",
          "text-halo-width": 1.5,
        },
      });
    } else {
      (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(featureCollection);
    }

    return () => {
      if (map.getLayer(LAYER_LABEL_ID)) map.removeLayer(LAYER_LABEL_ID);
      if (map.getLayer(LAYER_ARROW_ID)) map.removeLayer(LAYER_ARROW_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    if (!map || !map.getSource(SOURCE_ID)) return;
    (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(featureCollection);
  }, [map, featureCollection]);

  useEffect(() => {
    if (!map) return;

    const routeFilter =
      selectedRouteIds === "all"
        ? null
        : (["in", ["get", "routeId"], ["literal", Array.from(selectedRouteIds)]] as mapboxgl.FilterSpecification);

    const dirFilter =
      selectedDirectionId === "all"
        ? null
        : (["==", ["get", "directionId"], selectedDirectionId] as mapboxgl.FilterSpecification);

    const combined: mapboxgl.FilterSpecification | null =
      routeFilter && dirFilter
        ? ["all", routeFilter, dirFilter]
        : (routeFilter ?? dirFilter);

    for (const layerId of [LAYER_ARROW_ID, LAYER_LABEL_ID]) {
      if (map.getLayer(layerId)) map.setFilter(layerId, combined);
    }
  }, [map, selectedRouteIds, selectedDirectionId]);

  useEffect(() => {
    if (!map) return;
    const m = map;

    function handleMouseEnter(e: mapboxgl.MapLayerMouseEvent) {
      if (!e.features || e.features.length === 0) return;
      m.getCanvas().style.cursor = "pointer";

      const props = e.features[0]!.properties as Record<string, unknown>;
      const vehicleRef = props["vehicleRef"] as string;
      const vehicle = vehiclesRef.current.find((v) => v.vehicleRef === vehicleRef);
      if (!vehicle) return;

      const headway = headwayByVehicleRef.current.get(vehicleRef);
      const enrichedHeadway = headway
        ? { ...headway, status: classifyHeadway(headway, thresholdsRef.current) }
        : undefined;

      hoverPopupRef.current?.remove();
      hoverPopupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 14,
        maxWidth: "280px",
      })
        .setLngLat(e.lngLat)
        .setHTML(buildHoverHtml(vehicle, enrichedHeadway))
        .addTo(m);
    }

    function handleMouseLeave() {
      m.getCanvas().style.cursor = "";
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;
    }

    m.on("mouseenter", LAYER_ARROW_ID, handleMouseEnter);
    m.on("mouseleave", LAYER_ARROW_ID, handleMouseLeave);

    return () => {
      m.off("mouseenter", LAYER_ARROW_ID, handleMouseEnter);
      m.off("mouseleave", LAYER_ARROW_ID, handleMouseLeave);
      hoverPopupRef.current?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null;
}
