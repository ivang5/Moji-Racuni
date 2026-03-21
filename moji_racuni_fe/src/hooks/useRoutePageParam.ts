import { useEffect } from "react";

type RoutePageParamOptions = {
  page?: string;
  setPageNum: (page: number) => void;
  navigate: (to: string) => void;
  isBlocked?: boolean;
  defaultPage?: number;
  notFoundPath?: string;
};

const useRoutePageParam = ({
  page,
  setPageNum,
  navigate,
  isBlocked = false,
  defaultPage = 1,
  notFoundPath = "/not-found",
}: RoutePageParamOptions) => {
  useEffect(() => {
    if (isBlocked) {
      navigate(notFoundPath);
      return;
    }

    if (page === undefined) {
      setPageNum(defaultPage);
      return;
    }

    const parsedPage = parseInt(page, 10);

    if (parsedPage) {
      Math.sign(parsedPage) !== -1
        ? setPageNum(parsedPage)
        : navigate(notFoundPath);
      return;
    }

    navigate(notFoundPath);
  }, [defaultPage, isBlocked, navigate, notFoundPath, page, setPageNum]);
};

export default useRoutePageParam;
