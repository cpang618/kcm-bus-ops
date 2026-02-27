import { useEffect } from "react";
import { useMap } from "./MapView.js";

const SOURCE_ID = "stops";
const LAYER_ID = "stops-circle";
const LABEL_ID = "stops-circle-label";

interface StopLayerProps {
  stops: GeoJSON.FeatureCollection | null;
  visible: boolean;
}

export function StopLayer({ stops, visible }: StopLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !stops) return;

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: "geojson", data: stops });
      map.addLayer({
        id: LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        minzoom: 14,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 2.5, 16, 4, 18, 5],
          "circle-color": "#777",
          "circle-stroke-color": "#444",
          "circle-stroke-width": 0.5,
          "circle-opacity": 0.75,
        },
      });
      map.addLayer({
        id: LABEL_ID,
        type: "symbol",
        source: SOURCE_ID,
        minzoom: 15,
        layout: {
          "text-field": ["get", "stopName"],
          "text-size": 9,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-max-width": 8,
        },
        paint: {
          "text-color": "#888",
          "text-halo-color": "#000",
          "text-halo-width": 1,
        },
      });
    } else {
      (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(stops);
    }

    return () => {
      if (map.getLayer(LABEL_ID)) map.removeLayer(LABEL_ID);
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map, stops]);

  useEffect(() => {
    if (!map) return;
    const v = visible ? "visible" : "none";
    if (map.getLayer(LAYER_ID)) map.setLayoutProperty(LAYER_ID, "visibility", v);
    if (map.getLayer(LABEL_ID)) map.setLayoutProperty(LABEL_ID, "visibility", v);
  }, [map, visible]);

  return null;
}
