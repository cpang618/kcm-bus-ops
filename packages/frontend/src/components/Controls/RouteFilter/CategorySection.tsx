import type { RouteCategory } from "@bus-ops/shared";
import { useRouteFilter } from "../../../store/routeFilter.js";
import styles from "./CategorySection.module.css";

export interface RouteInfo {
  routeId: string;
  routeShortName: string;
}

interface CategorySectionProps {
  category: RouteCategory;
  routes: RouteInfo[];
  allRouteIds: string[];
  onRouteClick?: (routeId: string) => void;
}

export function CategorySection({ category, routes, allRouteIds, onRouteClick }: CategorySectionProps) {
  const { expandedCategories, isRouteSelected, toggleRoute, toggleCategory, toggleCategoryExpanded } =
    useRouteFilter();

  const isExpanded = expandedCategories.has(category);
  const categoryRouteIds = routes.map((r) => r.routeId);

  const allCategorySelected = categoryRouteIds.every((id) => isRouteSelected(id));
  const someCategorySelected = categoryRouteIds.some((id) => isRouteSelected(id));

  function handleCategoryCheckbox() {
    toggleCategory(category, categoryRouteIds, allRouteIds);
  }

  return (
    <div className={styles.section}>
      <div className={styles.categoryHeader}>
        <label className={styles.categoryCheckboxLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={allCategorySelected}
            ref={(el) => {
              if (el) el.indeterminate = !allCategorySelected && someCategorySelected;
            }}
            onChange={handleCategoryCheckbox}
          />
          <span className={styles.categoryName}>{category}</span>
          <span className={styles.routeCount}>({routes.length})</span>
        </label>
        <button
          className={styles.expandBtn}
          onClick={() => toggleCategoryExpanded(category)}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? "\u25be" : "\u25b8"}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.routeGrid}>
          {routes.map((route) => (
            <label key={route.routeId} className={styles.routeLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={isRouteSelected(route.routeId)}
                onChange={() => toggleRoute(route.routeId, allRouteIds)}
              />
              <span
                className={`${styles.routeName} ${onRouteClick ? styles.routeNameClickable : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRouteClick?.(route.routeId);
                }}
              >
                {route.routeShortName}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
