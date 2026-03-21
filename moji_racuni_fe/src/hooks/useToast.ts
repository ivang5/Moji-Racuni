import { useEffect, useRef, useState } from "react";

type ToastLink = {
  to: string;
  text: string;
};

type ToastData = {
  title: string;
  text: string;
  link?: ToastLink;
};

const useToast = (defaultDuration = 7000) => {
  const [toast, setToast] = useState<ToastData>({
    title: "",
    text: "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExistingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const showToast = (nextToast: ToastData, duration = defaultDuration) => {
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
