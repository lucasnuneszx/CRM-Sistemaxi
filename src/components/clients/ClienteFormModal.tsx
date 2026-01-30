"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ClienteForm from "./ClienteForm";
import { useEffect } from "react";

export default function ClienteFormModal({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (data: any) => void }) {
  // Foca no primeiro campo ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const el = document.querySelector("form input, form select") as HTMLElement;
        if (el) el.focus();
      }, 100);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold">Novo Cliente</DialogTitle>
        </DialogHeader>
        <ClienteForm onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}
