import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  createElement,
} from "react";
import type { RouteCategory } from "@bus-ops/shared";

interface RouteFilterContextValue {
  selectedRouteIds: Set<string> | "all";
  expandedCategories: Set<RouteCategory>;
  isRouteSelected: (routeId: string) => boolean;
  toggleRoute: (routeId: string, allRouteIds: string[]) => void;
  toggleCategory: (category: RouteCategory, categoryRouteIds: string[], allRouteIds: string[]) => void;
  selectAll: () => void;
  clearAll: () => void;
  toggleCategoryExpanded: (category: RouteCategory) => void;
  selectedDirectionId: 0 | 1 | "all";
  setDirectionId: (dir: 0 | 1 | "all") => void;
  showStops: boolean;
  toggleStops: () => void;
}

const RouteFilterContext = createContext<RouteFilterContextValue | null>(null);

export function RouteFilterProvider({ children }: { children: ReactNode }) {
  const [selectedRouteIds, setSelectedRouteIds] = useState<Set<string> | "all">("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<RouteCategory>>(new Set());
  const [selectedDirectionId, setSelectedDirectionIdState] = useState<0 | 1 | "all">("all");
  const [showStops, setShowStops] = useState(true);

  const isRouteSelected = useCallback(
    (routeId: string) => selectedRouteIds === "all" || selectedRouteIds.has(routeId),
    [selectedRouteIds],
  );

  const toggleRoute = useCallback(
    (routeId: string, allRouteIds: string[]) => {
      setSelectedRouteIds((prev) => {
        const current = prev === "all" ? new Set(allRouteIds) : new Set(prev);
        if (current.has(routeId)) current.delete(routeId);
        else current.add(routeId);
        if (current.size === allRouteIds.length) return "all";
        return current;
      });
    },
    [],
  );

  const toggleCategory = useCallback(
    (_category: RouteCategory, categoryRouteIds: string[], allRouteIds: string[]) => {
      setSelectedRouteIds((prev) => {
        if (prev === "all") {
          const current = new Set(allRouteIds);
          for (const id of categoryRouteIds) current.delete(id);
          return current;
        }
        const current = new Set(prev);
        const allSelected = categoryRouteIds.every((id) => current.has(id));
        if (allSelected) {
          for (const id of categoryRouteIds) current.delete(id);
        } else {
          for (const id of categoryRouteIds) current.add(id);
        }
        if (current.size >= allRouteIds.length) return "all";
        return current;
      });
    },
    [],
  );

  const selectAll = useCallback(() => setSelectedRouteIds("all"), []);

  const clearAll = useCallback(() => setSelectedRouteIds(new Set()), []);

  const toggleCategoryExpanded = useCallback((category: RouteCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const setDirectionId = useCallback((dir: 0 | 1 | "all") => setSelectedDirectionIdState(dir), []);

  const toggleStops = useCallback(() => setShowStops((prev) => !prev), []);

  return createElement(
    RouteFilterContext.Provider,
    {
      value: {
        selectedRouteIds,
        expandedCategories,
        isRouteSelected,
        toggleRoute,
        toggleCategory,
        selectAll,
        clearAll,
        toggleCategoryExpanded,
        selectedDirectionId,
        setDirectionId,
        showStops,
        toggleStops,
      },
    },
    children,
  );
}

export function useRouteFilter(): RouteFilterContextValue {
  const ctx = useContext(RouteFilterContext);
  if (!ctx) throw new Error("useRouteFilter must be used within RouteFilterProvider");
  return ctx;
}
