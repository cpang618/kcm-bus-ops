import { useEffect, useRef, createContext, useContext, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MapContext = createContext<mapboxgl.Map | null>(null);

export function useMap() {
  return useContext(MapContext);
}

export function MapView({ children }: { children?: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initializedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
    if (!token) {
      console.error("[MapView] VITE_MAPBOX_TOKEN is not set — add it to .env at the project root.");
      return;
    }

    mapboxgl.accessToken = token;
    containerRef.current.innerHTML = "";

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-122.33, 47.60], // Seattle
      zoom: 11,
      maxZoom: 18,
      minZoom: 8,
    });

    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    map.addControl(new mapboxgl.ScaleControl({ unit: "imperial" }), "bottom-left");

    map.on("load", () => {
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
      initializedRef.current = false;
    };
  }, []);

  return (
    <MapContext.Provider value={mapReady ? mapRef.current : null}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      {mapReady && children}
    </MapContext.Provider>
  );
}
