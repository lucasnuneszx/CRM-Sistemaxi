"use client";

import { toast as sonnerToast } from "sonner";
import { useState, useCallback } from "react";

export function useToast() {
  const success = useCallback((message: string) => {
    sonnerToast.success(message);
  }, []);

  const error = useCallback((message: string) => {
    sonnerToast.error(message);
  }, []);

  const info = useCallback((message: string) => {
    sonnerToast.info(message);
  }, []);

  const warning = useCallback((message: string) => {
    sonnerToast.warning(message);
  }, []);

  return { success, error, info, warning };
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const confirm = useCallback(
    (
      title: string,
      description: string,
      onConfirm: () => void
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfirmState({
          open: true,
          title,
          description,
          onConfirm: () => {
            onConfirm();
            setConfirmState((prev) => ({ ...prev, open: false }));
            resolve(true);
          },
        });
      });
    },
    []
  );

  const close = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, open: false }));
  }, []);

  return {
    confirm,
    confirmState,
    close,
  };
}

