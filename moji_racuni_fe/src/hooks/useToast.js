import { useEffect, useRef, useState } from "react";

const useToast = (defaultDuration = 7000) => {
  const [toast, setToast] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);

  const clearExistingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const showToast = (nextToast, duration = defaultDuration) => {
    setToast(nextToast);
    setIsOpen(true);
    clearExistingTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      timeoutRef.current = null;
    }, duration);
  };

  const closeToast = () => {
    clearExistingTimeout();
    setIsOpen(false);
  };

  useEffect(() => {
    return () => {
      clearExistingTimeout();
    };
  }, []);

  return {
    toast,
    toastOpen: isOpen,
    showToast,
    closeToast,
  };
};

export default useToast;
