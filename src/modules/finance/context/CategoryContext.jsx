import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { fetchCategories as apiFetchCategories } from "@finance/api/api";

const INGRESO_META = {
  name: "ingreso",
  label: "Ingreso",
  emoji: "💰",
  color: "#22c55e",
  is_default: true,
  is_deletable: false,
};

const FALLBACK_META = {
  name: "otros",
  label: "Otros",
  emoji: "📦",
  color: "#64748b",
  is_default: true,
  is_deletable: false,
};

const CategoryContext = createContext(null);

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetchCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.name !== "ingreso"),
    [categories]
  );

  const categoryMap = useMemo(() => {
    const map = {};
    for (const c of categories) {
      map[c.name] = c;
    }
    map["ingreso"] = INGRESO_META;
    return map;
  }, [categories]);

  const getCategoryByName = useCallback(
    (name) => categoryMap[name] || FALLBACK_META,
    [categoryMap]
  );

  const value = useMemo(
    () => ({
      categories,
      expenseCategories,
      categoryMap,
      getCategoryByName,
      loading,
      error,
      refresh,
    }),
    [
      categories,
      expenseCategories,
      categoryMap,
      getCategoryByName,
      loading,
      error,
      refresh,
    ]
  );

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoryContext);
  if (!ctx)
    throw new Error("useCategories must be used within CategoryProvider");
  return ctx;
}
