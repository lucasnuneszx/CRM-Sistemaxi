import React from 'react';
import styled from 'styled-components';

// Types
interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

interface KpiCardsProps {
  kpis: KpiCardProps[];
}

// Styled Components
const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background: ${props => props.theme.bg.tertiary};
  border-radius: 12px;
  padding: 20px;
  transition: transform 0.2s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
  }
`;

const CardTitle = styled.h3`
  font-size: 0.9rem;
  color: ${props => props.theme.text.secondary};
  margin-bottom: 16px;
  font-weight: 500;
`;

const CardValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 8px;
`;

const CardChange = styled.div<{ trend: 'up' | 'down' | 'neutral' }>`
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  
  color: ${props => {
    if (props.trend === 'up') return '#34D399';
    if (props.trend === 'down') return '#F87171';
    return props.theme.text.secondary;
  }};
  
  &::before {
    content: '';
    display: inline-block;
    width: 0;
    height: 0;
    margin-right: 6px;
    
    ${props => props.trend === 'up' && `
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid #34D399;
    `}
    
    ${props => props.trend === 'down' && `
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid #F87171;
    `}
  }
`;

// Component
const KpiCards: React.FC<KpiCardsProps> = ({ kpis }) => {
  return (
    <CardsContainer>
      {kpis.map((kpi, index) => (
        <Card key={index}>
          <CardTitle>{kpi.title}</CardTitle>
          <CardValue>{kpi.value}</CardValue>
          <CardChange trend={kpi.trend}>{kpi.change}</CardChange>
        </Card>
      ))}
    </CardsContainer>
  );
};

export default KpiCards; 