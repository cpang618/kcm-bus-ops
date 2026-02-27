import type { Vehicle, GtfsStore, OnwardCall } from "@bus-ops/shared";
import type { VehiclePositionEntity, TripUpdateEntity, GtfsRtTripUpdate } from "./gtfsRtClient.js";
import { snapToShape } from "../gtfs/shapeIndex.js";

export interface TransformResult {
  vehicles: Vehicle[];
  onwardCallsByVehicle: Map<string, OnwardCall[]>;
}

/**
 * Transforms raw GTFS-RT vehicle positions + trip updates into Vehicle domain
 * objects and a map of OnwardCalls keyed by vehicleRef.
 *
 * The key operation is joining vehicle positions with trip updates by trip_id
 * to reconstruct the equivalent of SIRI OnwardCalls.
 */
export function transformVehicles(
  vpEntities: VehiclePositionEntity[],
  tuEntities: TripUpdateEntity[],
  gtfsStore: GtfsStore,
): TransformResult {
  const vehicles: Vehicle[] = [];
  const onwardCallsByVehicle = new Map<string, OnwardCall[]>();

  // Build trip_id → TripUpdate lookup
  const tripUpdateMap = new Map<string, GtfsRtTripUpdate>();
  for (const entity of tuEntities) {
    tripUpdateMap.set(entity.trip_update.trip.trip_id, entity.trip_update);
  }

  for (const entity of vpEntities) {
    const vp = entity.vehicle;

    // Skip vehicles without valid position
    if (!vp.position?.latitude || !vp.position?.longitude) continue;

    const routeId = vp.trip.route_id;
    const directionId = (vp.trip.direction_id ?? 0) as 0 | 1;
    const lat = vp.position.latitude;
    const lng = vp.position.longitude;
    const vehicleRef = vp.vehicle.id;
    const tripId = vp.trip.trip_id;

    const route = gtfsStore.routes.get(routeId);
    const trip = gtfsStore.trips.get(tripId);
    const shapePoints = gtfsStore.shapes.get(gtfsStore.routeToShapeId.get(`${routeId}:${directionId}`) ?? "");

    let distanceAlongRoute = 0;
    let bearing = 0;
    if (shapePoints && shapePoints.length > 0) {
      const snap = snapToShape(lat, lng, shapePoints);
      distanceAlongRoute = snap.distanceAlongRoute;
      bearing = snap.bearing;
    }

    // Look up trip update for this vehicle's trip
    const tripUpdate = tripUpdateMap.get(tripId);
    const currentSeq = vp.current_stop_sequence ?? 0;

    // Build OnwardCalls from trip update stop_time_updates
    let nextStopId = vp.stop_id ?? "";
    let nextStopName = "";
    let expectedArrivalTime: string | null = null;
    let aimedArrivalTime: string | null = null;

    const calls: OnwardCall[] = [];

    if (tripUpdate?.stop_time_update) {
      for (const stu of tripUpdate.stop_time_update) {
        // Only include upcoming stops (current or ahead)
        if (stu.stop_sequence < currentSeq) continue;

        const stopId = stu.stop_id;
        const stop = gtfsStore.stops.get(stopId);
        const stopName = stop?.stopName ?? "";

        const arrivalTime = stu.arrival?.time
          ? new Date(stu.arrival.time * 1000).toISOString()
          : null;
        const departureTime = stu.departure?.time
          ? new Date(stu.departure.time * 1000).toISOString()
          : null;

        const aimedTime = stu.arrival?.time && stu.arrival?.delay !== undefined
          ? new Date((stu.arrival.time - stu.arrival.delay) * 1000).toISOString()
          : null;

        calls.push({
          StopPointRef: stopId,
          StopPointName: stopName,
          ExpectedArrivalTime: arrivalTime,
          ExpectedDepartureTime: departureTime,
          AimedArrivalTime: aimedTime,
        });

        // First upcoming stop = next stop
        if (stu.stop_sequence === currentSeq) {
          nextStopId = stopId;
          nextStopName = stopName;
          expectedArrivalTime = arrivalTime;
          aimedArrivalTime = aimedTime;
        }
      }
    }

    if (!nextStopName && nextStopId) nextStopName = gtfsStore.stops.get(nextStopId)?.stopName ?? "";

    vehicles.push({
      vehicleRef,
      routeId,
      routeShortName: route?.routeShortName ?? routeId,
      headsign: trip?.tripHeadsign ?? "",
      directionId,
      lat,
      lng,
      nextStopId,
      nextStopName,
      expectedArrivalTime,
      aimedArrivalTime,
      distanceAlongRoute,
      bearing,
      progressRate: vp.current_status === "STOPPED_AT" ? "layover" : "normalProgress",
    });

    if (calls.length > 0) {
      onwardCallsByVehicle.set(vehicleRef, calls);
    }
  }

  return { vehicles, onwardCallsByVehicle };
}
