import { useEffect, useState } from "react";
import { getPageNumberList } from "../utils/utils";

const usePaginatedListState = ({
  initialPage = 1,
  initialSortBy,
  initialSortType,
  initialSearchObj,
}) => {
  const [pageNum, setPageNum] = useState(initialPage);
  const [pageNumbers, setPageNumbers] = useState([]);
  const [pageCount, setPageCount] = useState(10000);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortType, setSortType] = useState(initialSortType);
  const [searchObj, setSearchObj] = useState(initialSearchObj);

  useEffect(() => {
    setPageNumbers(getPageNumberList(pageCount, pageNum));
  }, [pageCount, pageNum]);

  return {
    pageNum,
    setPageNum,
    pageNumbers,
    pageCount,
    setPageCount,
    searchOpen,
    setSearchOpen,
    sortBy,
    setSortBy,
    sortType,
    setSortType,
    searchObj,
    setSearchObj,
  };
};

export default usePaginatedListState;
