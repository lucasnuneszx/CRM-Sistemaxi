'use client';

import React, { useState } from 'react';
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lead } from '@/types/funil-vendas';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface LeadSidebarSimpleProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  selectedLeadId?: string;
}

export function LeadSidebarSimple({ leads, onLeadClick, selectedLeadId }: LeadSidebarSimpleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'name'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtrar e ordenar leads
  const filteredLeads = leads
    .filter(lead =>
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime();
      }
      return a.nome.localeCompare(b.nome);
    });

  // Paginação
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="w-80 bg-background border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-lg">Leads</h2>
        </div>

        {/* Busca */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'newest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('newest')}
            className="flex-1 text-xs"
          >
            Mais novos
          </Button>
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('name')}
            className="flex-1 text-xs"
          >
            Nome
          </Button>
        </div>
      </div>

      {/* Lista de Leads */}
      <div className="flex-1 overflow-y-auto p-2">
        {paginatedLeads.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            Nenhum lead encontrado
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => onLeadClick?.(lead)}
                className={`
                  p-3 rounded-lg border border-border bg-card hover:bg-accent cursor-pointer transition-colors
                  ${selectedLeadId === lead.id ? 'ring-2 ring-primary bg-accent' : ''}
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{lead.nome}</h3>
                    <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                  </div>
                  {lead.tags && lead.tags.length > 0 ? (
                    <Badge
                      variant="default"
                      className="text-xs ml-2 shrink-0"
                    >
                      {lead.tags[0]}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs ml-2 shrink-0"
                    >
                      Sem origem
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>ID: {lead.id.slice(0, 8)}</span>
                  <span>
                    {format(new Date(lead.dataCadastro), 'dd/MM/yyyy')}
                  </span>
                </div>
                {lead.tags && lead.tags.length > 1 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {lead.tags.slice(1).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

