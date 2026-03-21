import { useEffect, useRef } from "react";

const useModalDismiss = (onDismiss: () => void) => {
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const handleModalClick = (e: MouseEvent) => {
      if (
        (e.target as Element | null)?.className === "modal" ||
        (e.target as Element | null)?.className === "modal__content"
      ) {
        dismissRef.current?.();
      }
    };

    const handleModalKeydown = (e: KeyboardEvent) => {
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
