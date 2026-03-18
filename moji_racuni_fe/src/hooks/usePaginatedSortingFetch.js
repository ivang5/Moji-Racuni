import { useCallback, useEffect, useRef } from "react";

const usePaginatedSortingFetch = ({
  api,
  sortBy,
  sortType,
  searchObj,
  pageNum,
  getOrderBy,
  fetchSortedPage,
  setLoading,
  setPageCount,
  setItems,
}) => {
  const apiRef = useRef(api);
  const filtersRef = useRef({ sortBy, sortType, searchObj, pageNum });

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  useEffect(() => {
    filtersRef.current = { sortBy, sortType, searchObj, pageNum };
  }, [sortBy, sortType, searchObj, pageNum]);

  const applySortingFilters = useCallback(async () => {
    const {
      sortBy: currentSortBy,
      sortType: currentSortType,
      searchObj: currentSearchObj,
      pageNum: currentPageNum,
    } = filtersRef.current;

    const orderBy = getOrderBy(currentSortBy);
    const ascendingOrder = currentSortType === "Opadajuće" ? "desc" : "asc";

    setLoading(true);
    const result = await fetchSortedPage({
      api: apiRef.current,
      searchObj: currentSearchObj,
      orderBy,
      ascendingOrder,
      pageNum: currentPageNum,
    });
    setLoading(false);

    if (result) {
      setPageCount(result.pageCount);
      setItems(result.items);
    }
  }, [fetchSortedPage, getOrderBy, setItems, setLoading, setPageCount]);

  return applySortingFilters;
};

export default usePaginatedSortingFetch;
