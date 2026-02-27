// ─── Vehicle Domain Type ──────────────────────────────────────────────────────

export interface Vehicle {
  vehicleRef: string;
  routeId: string;
  routeShortName: string;
  headsign: string;
  directionId: 0 | 1;
  lat: number;
  lng: number;
  nextStopId: string;
  nextStopName: string;
  expectedArrivalTime: string | null;
  aimedArrivalTime: string | null;
  distanceAlongRoute: number;
  bearing: number;
  progressRate: string;
}

// ─── Headway Types ────────────────────────────────────────────────────────────

export type HeadwayStatus = "bunching" | "on-time" | "gapping" | "unknown";

export type HeadwayMethod = "eta" | "distance";

export interface HeadwayResult {
  vehicleRef: string;
  routeId: string;
  directionId: 0 | 1;
  leadVehicleRef: string | null;
  actualHeadwaySecs: number | null;
  scheduledHeadwaySecs: number | null;
  headwayRatioPct: number | null;
  status: HeadwayStatus;
  headwayMethod: HeadwayMethod | null;
  excluded: boolean;
}

export interface MethodBreakdown {
  etaCount: number;
  distanceCount: number;
  etaPct: number;
  distancePct: number;
}

// ─── Threshold Types ──────────────────────────────────────────────────────────

export type ThresholdMode = "pct" | "abs";

export interface ThresholdParams {
  mode: ThresholdMode;
  bunchingPct: number;
  gappingPct: number;
  bunchingMins: number;
  gappingMins: number;
}

export const DEFAULT_THRESHOLDS: ThresholdParams = {
  mode: "pct",
  bunchingPct: 20,
  gappingPct: 150,
  bunchingMins: 3,
  gappingMins: 12,
};

// ─── Metrics Types ────────────────────────────────────────────────────────────

export interface HeadwayBreakdown {
  total: number;
  bunchingCount: number;
  onTimeCount: number;
  gappingCount: number;
  unknownCount: number;
  bunchingPct: number;
  onTimePct: number;
  gappingPct: number;
}

export interface CityMetrics extends HeadwayBreakdown {}

export interface RouteMetrics extends HeadwayBreakdown {
  routeId: string;
  directionId: 0 | 1;
  routeShortName: string;
  routeCategory: string;
  vehicleCount: number;
}

export interface MetricsResponse {
  fetchedAt: string;
  thresholds: ThresholdParams;
  cityMetrics: CityMetrics;
  routeMetrics: RouteMetrics[];
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface VehiclesResponse {
  vehicles: Vehicle[];
  headways: HeadwayResult[];
  fetchedAt: string;
}

export interface HealthResponse {
  status: "ok";
  gtfsLoaded: boolean;
  lastVehicleFetch: string | null;
  vehicleCount: number;
  routeCount: number;
  stopCount: number;
}

// ─── GTFS Internal Types ──────────────────────────────────────────────────────

export interface GtfsRoute {
  routeId: string;
  routeShortName: string;
  routeLongName: string;
  routeColor: string;
  routeTextColor: string;
  routeCategory: string;
}

export interface ShapePoint {
  lat: number;
  lng: number;
  sequence: number;
  cumulativeDistanceMeters: number;
}

export interface GtfsStop {
  stopId: string;
  stopName: string;
  lat: number;
  lng: number;
}

export interface GtfsTrip {
  tripId: string;
  routeId: string;
  directionId: 0 | 1;
  shapeId: string;
  serviceId: string;
  tripHeadsign: string;
}

export interface StopTime {
  tripId: string;
  stopId: string;
  stopSequence: number;
  arrivalTimeSecs: number;
  departureTimeSecs: number;
}

export interface FrequencyWindow {
  tripId: string;
  startTimeSecs: number;
  endTimeSecs: number;
  headwaySecs: number;
  exactTimes: boolean;
}

export interface GtfsCalendar {
  serviceId: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  startDate: string;
  endDate: string;
}

export interface GtfsCalendarDate {
  serviceId: string;
  date: string;
  exceptionType: 1 | 2;
}

export interface GtfsStore {
  routes: Map<string, GtfsRoute>;
  shapes: Map<string, ShapePoint[]>;
  routeToShapeId: Map<string, string>;
  stops: Map<string, GtfsStop>;
  trips: Map<string, GtfsTrip>;
  routeTrips: Map<string, GtfsTrip[]>;
  frequencies: Map<string, FrequencyWindow[]>;
  routeScheduleDepartures: Map<string, number[]>;
  stopDepartures: Map<string, number[]>;
  stopDistances: Map<string, number>;
  firstStopsByRoute: Map<string, Set<string>>;
  calendars: GtfsCalendar[];
  calendarDates: GtfsCalendarDate[];
}

// ─── Stop Headway Types ───────────────────────────────────────────────────────

export interface StopHeadwayResult {
  stopId: string;
  stopName: string;
  lat: number;
  lng: number;
  routeId: string;
  directionId: 0 | 1;
  leadVehicleRef: string;
  followVehicleRef: string;
  actualHeadwaySecs: number;
  scheduledHeadwaySecs: number | null;
  headwayRatioPct: number | null;
  status: HeadwayStatus;
}

export interface StopHeadwaysResponse {
  stopHeadways: StopHeadwayResult[];
  fetchedAt: string;
}

// ─── Route Filter Types ───────────────────────────────────────────────────────

export const ROUTE_CATEGORIES = ["RapidRide", "Local", "Express", "Community", "Streetcar", "Ferry"] as const;
export type RouteCategory = typeof ROUTE_CATEGORIES[number];

export interface RouteFilterState {
  selectedRouteIds: Set<string> | "all";
  expandedCategories: Set<RouteCategory>;
}

// ─── OnwardCall (shared between GTFS-RT transformer and headway engine) ──────

export interface OnwardCall {
  StopPointRef: string;
  StopPointName: string;
  ExpectedArrivalTime: string | null;
  ExpectedDepartureTime: string | null;
  AimedArrivalTime: string | null;
}
