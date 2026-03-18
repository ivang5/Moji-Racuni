import { useEffect, useRef } from "react";

const useModalDismiss = (onDismiss) => {
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const handleModalClick = (e) => {
      if (
        e.target.className === "modal" ||
        e.target.className === "modal__content"
      ) {
        dismissRef.current?.();
      }
    };

    const handleModalKeydown = (e) => {
      if (e.key === "Escape") {
        dismissRef.current?.();
      }
    };

    window.addEventListener("click", handleModalClick);
    window.addEventListener("keydown", handleModalKeydown);

    return () => {
      window.removeEventListener("click", handleModalClick);
      window.removeEventListener("keydown", handleModalKeydown);
    };
  }, []);
};

export default useModalDismiss;
