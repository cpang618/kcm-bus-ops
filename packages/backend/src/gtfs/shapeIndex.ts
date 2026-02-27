import type { ShapePoint } from "@bus-ops/shared";
import { haversineMeters, bearingDegrees } from "@bus-ops/shared";

export interface SnapResult {
  distanceAlongRoute: number;
  bearing: number;
}

export function snapToShape(
  vehicleLat: number,
  vehicleLng: number,
  shapePoints: ShapePoint[],
): SnapResult {
  if (shapePoints.length === 0) return { distanceAlongRoute: 0, bearing: 0 };
  if (shapePoints.length === 1) return { distanceAlongRoute: shapePoints[0]!.cumulativeDistanceMeters, bearing: 0 };

  let bestDist = Infinity;
  let bestCumulative = 0;
  let bestA = shapePoints[0]!;
  let bestB = shapePoints[1]!;

  for (let i = 0; i < shapePoints.length - 1; i++) {
    const A = shapePoints[i]!;
    const B = shapePoints[i + 1]!;

    const ax = A.lng, ay = A.lat;
    const bx = B.lng, by = B.lat;
    const px = vehicleLng, py = vehicleLat;

    const abx = bx - ax, aby = by - ay;
    const abLen2 = abx * abx + aby * aby;

    let t = 0;
    if (abLen2 > 0) {
      t = ((px - ax) * abx + (py - ay) * aby) / abLen2;
      t = Math.max(0, Math.min(1, t));
    }

    const cx = ax + t * abx;
    const cy = ay + t * aby;
    const dist = haversineMeters(vehicleLat, vehicleLng, cy, cx);

    if (dist < bestDist) {
      bestDist = dist;
      bestCumulative = A.cumulativeDistanceMeters + t * (B.cumulativeDistanceMeters - A.cumulativeDistanceMeters);
      bestA = A;
      bestB = B;
    }
  }

  return {
    distanceAlongRoute: bestCumulative,
    bearing: bearingDegrees(bestA.lat, bestA.lng, bestB.lat, bestB.lng),
  };
}

export function buildRouteToShapeMap(
  trips: Array<{ routeId: string; directionId: 0 | 1; shapeId: string }>,
): Map<string, string> {
  const counts = new Map<string, Map<string, number>>();

  for (const trip of trips) {
    if (!trip.shapeId) continue;
    const key = `${trip.routeId}:${trip.directionId}`;
    let shapeCounts = counts.get(key);
    if (!shapeCounts) counts.set(key, shapeCounts = new Map());
    shapeCounts.set(trip.shapeId, (shapeCounts.get(trip.shapeId) ?? 0) + 1);
  }

  const result = new Map<string, string>();
  for (const [key, shapeCounts] of counts) {
    let bestShape = "";
    let bestCount = 0;
    for (const [shapeId, count] of shapeCounts) {
      if (count > bestCount) {
        bestCount = count;
        bestShape = shapeId;
      }
    }
    if (bestShape) result.set(key, bestShape);
  }

  return result;
}
