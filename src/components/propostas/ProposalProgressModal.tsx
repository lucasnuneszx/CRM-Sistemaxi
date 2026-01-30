'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Proposta } from '@/types/proposta';

interface ProposalProgressModalProps {
  proposta: Proposta | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (propostaId: string, progresso: number) => void;
}

export function ProposalProgressModal({
  proposta,
  isOpen,
  onClose,
  onSave,
}: ProposalProgressModalProps) {
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    if (proposta) {
      setProgresso(proposta.progresso);
    }
  }, [proposta]);

  const handleSave = () => {
    if (proposta) {
      onSave(proposta.id, progresso);
      onClose();
    }
  };

  const handleQuickSet = (value: number) => {
    setProgresso(value);
  };

  if (!proposta) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Atualizar Progresso da Negociação</DialogTitle>
          <DialogDescription>
            Ajuste o progresso da proposta &quot;{proposta.titulo}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Progresso</Label>
              <span className="text-2xl font-bold text-primary">{progresso}%</span>
            </div>
            <Slider
              value={[progresso]}
              onValueChange={(value) => setProgresso(value[0])}
              max={100}
              min={0}
              step={1}
              className="w-full"
            />
          </div>

          {/* Botões rápidos */}
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSet(25)}
              className={progresso === 25 ? 'bg-primary text-primary-foreground' : ''}
            >
              25%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSet(50)}
              className={progresso === 50 ? 'bg-primary text-primary-foreground' : ''}
            >
              50%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSet(75)}
              className={progresso === 75 ? 'bg-primary text-primary-foreground' : ''}
            >
              75%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickSet(100)}
              className={progresso === 100 ? 'bg-primary text-primary-foreground' : ''}
            >
              100%
            </Button>
          </div>

          {/* Preview da barra */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Preview</span>
            </div>
            <div className="relative h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Progresso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

