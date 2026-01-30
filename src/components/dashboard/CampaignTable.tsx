import React from 'react';
import styled from 'styled-components';

// Types
interface Campaign {
  id: number;
  name: string;
  status: 'active' | 'paused' | 'scheduled';
  budget: number;
  spent: number;
  leads: number;
  conversions: number;
  roi: number;
}

interface CampaignTableProps {
  campaigns: Campaign[];
}

// Styled Components
const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: 8px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const TableHead = styled.thead`
  background: ${props => props.theme.bg.tertiary};
  position: sticky;
  top: 0;
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => props.theme.text.secondary};
  border-bottom: 1px solid ${props => props.theme.bg.tertiary};
  white-space: nowrap;
  
  &:first-child {
    border-top-left-radius: 8px;
    padding-left: 20px;
  }
  
  &:last-child {
    border-top-right-radius: 8px;
    padding-right: 20px;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.theme.bg.tertiary};
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme.bg.tertiary};
  }
`;

const TableCell = styled.td`
  padding: 16px;
  font-size: 0.9rem;
  white-space: nowrap;
  
  &:first-child {
    padding-left: 20px;
  }
  
  &:last-child {
    padding-right: 20px;
  }
`;

const NameCell = styled(TableCell)`
  color: ${props => props.theme.text.primary};
  font-weight: 500;
`;

const StatusBadge = styled.span<{ status: 'active' | 'paused' | 'scheduled' }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  
  ${props => props.status === 'active' && `
    background-color: rgba(52, 211, 153, 0.2);
    color: #34D399;
  `}
  
  ${props => props.status === 'paused' && `
    background-color: rgba(251, 191, 36, 0.2);
    color: #FBBF24;
  `}
  
  ${props => props.status === 'scheduled' && `
    background-color: rgba(93, 139, 244, 0.2);
    color: #5D8BF4;
  `}
  
  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 6px;
    
    ${props => props.status === 'active' && `
      background-color: #34D399;
    `}
    
    ${props => props.status === 'paused' && `
      background-color: #FBBF24;
    `}
    
    ${props => props.status === 'scheduled' && `
      background-color: #5D8BF4;
    `}
  }
`;

const ProgressContainer = styled.div`
  width: 100%;
  height: 6px;
  background-color: ${props => props.theme.bg.tertiary};
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
`;

const ProgressBar = styled.div<{ width: string }>`
  height: 100%;
  width: ${props => props.width};
  background: ${props => props.theme.gradient.primary};
  border-radius: 3px;
`;

const Currency = styled.span`
  color: ${props => props.theme.text.primary};
  font-weight: 500;
`;

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0
  }).format(value);
};

// Component
const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns }) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Nome da Campanha</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Orçamento</TableHeaderCell>
            <TableHeaderCell>Valor Gasto</TableHeaderCell>
            <TableHeaderCell>Leads</TableHeaderCell>
            <TableHeaderCell>Conversões</TableHeaderCell>
            <TableHeaderCell>ROI</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {campaigns.map(campaign => (
            <TableRow key={campaign.id}>
              <NameCell>{campaign.name}</NameCell>
              <TableCell>
                <StatusBadge status={campaign.status}>
                  {campaign.status === 'active' ? 'Ativa' : 
                   campaign.status === 'paused' ? 'Pausada' : 'Agendada'}
                </StatusBadge>
              </TableCell>
              <TableCell>
                <Currency>{formatCurrency(campaign.budget)}</Currency>
              </TableCell>
              <TableCell>
                <Currency>{formatCurrency(campaign.spent)}</Currency>
                <ProgressContainer>
                  <ProgressBar width={`${(campaign.spent / campaign.budget) * 100}%`} />
                </ProgressContainer>
              </TableCell>
              <TableCell>{campaign.leads.toLocaleString()}</TableCell>
              <TableCell>{campaign.conversions.toLocaleString()}</TableCell>
              <TableCell>
                <strong style={{ color: campaign.roi >= 2 ? '#34D399' : campaign.roi >= 1 ? '#FBBF24' : '#F87171' }}>
                  {campaign.roi.toFixed(1)}x
                </strong>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CampaignTable; 