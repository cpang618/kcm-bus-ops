import { useEffect } from "react";
import { useMap } from "./MapView.js";
import { useRouteFilter } from "../../store/routeFilter.js";

const SOURCE_ID = "routes";
const LAYER_ID = "routes-line";

interface RouteLayerProps {
  routes: GeoJSON.FeatureCollection | null;
}

export function RouteLayer({ routes }: RouteLayerProps) {
  const map = useMap();
  const { selectedRouteIds } = useRouteFilter();

  useEffect(() => {
    if (!map || !routes) return;

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: "geojson", data: routes });
      map.addLayer({
        id: LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["get", "routeColor"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.8, 12, 1.5, 16, 3],
          "line-opacity": 0.7,
        },
      });
    } else {
      (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(routes);
    }

    return () => {
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map, routes]);

  useEffect(() => {
    if (!map || !map.getLayer(LAYER_ID)) return;
    if (selectedRouteIds === "all") {
      map.setFilter(LAYER_ID, null);
    } else {
      map.setFilter(LAYER_ID, ["in", ["get", "routeId"], ["literal", Array.from(selectedRouteIds)]]);
    }
  }, [map, selectedRouteIds]);

  return null;
}
