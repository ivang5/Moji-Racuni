import { useEffect } from "react";

const useRoutePageParam = ({
  page,
  setPageNum,
  navigate,
  isBlocked = false,
  defaultPage = 1,
  notFoundPath = "/not-found",
}) => {
  useEffect(() => {
    if (isBlocked) {
      navigate(notFoundPath);
      return;
    }

    const parsedPage = parseInt(page, 10);

    if (parsedPage) {
      Math.sign(parsedPage) !== -1
        ? setPageNum(parsedPage)
        : navigate(notFoundPath);
      return;
    }

    page === undefined ? setPageNum(defaultPage) : navigate(notFoundPath);
  }, [defaultPage, isBlocked, navigate, notFoundPath, page, setPageNum]);
};

export default useRoutePageParam;
