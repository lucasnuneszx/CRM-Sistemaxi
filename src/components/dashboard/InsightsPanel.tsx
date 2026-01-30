import React from 'react';
import styled from 'styled-components';

// Types
interface Insight {
  id: number;
  type: 'warning' | 'success' | 'info';
  title: string;
  description: string;
  time: string;
  isRead: boolean;
}

// Mock data
const mockInsights: Insight[] = [
  {
    id: 1,
    type: 'warning',
    title: 'Campanha com ROAS abaixo do ideal',
    description: 'A campanha "Summer Collection" está com ROAS de 2.8, abaixo da meta de 3.0',
    time: '38 min atrás',
    isRead: false
  },
  {
    id: 2,
    type: 'success',
    title: 'Novo influenciador disponível',
    description: 'Influenciador com 780K seguidores no Instagram disponível para parceria',
    time: '2h atrás',
    isRead: false
  },
  {
    id: 3,
    type: 'info',
    title: 'Análise de desempenho semanal',
    description: 'O relatório semanal de desempenho está disponível para visualização',
    time: '1d atrás',
    isRead: true
  },
  {
    id: 4,
    type: 'warning',
    title: 'Queda no engagement do Telegram',
    description: 'Taxa de abertura dos canais de Telegram caiu 12% na última semana',
    time: '2d atrás',
    isRead: true
  },
  {
    id: 5,
    type: 'success',
    title: 'Meta de leads atingida',
    description: 'A campanha "Black Friday Promo" atingiu 120% da meta de leads',
    time: '3d atrás',
    isRead: true
  }
];

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
`;

const InsightsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 8px;
  max-height: 460px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.bg.tertiary};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.bg.accent};
    border-radius: 3px;
  }
`;

const InsightCard = styled.div<{ type: 'warning' | 'success' | 'info'; isRead: boolean }>`
  background: ${props => props.theme.bg.secondary};
  border-left: 4px solid ${props => {
    if (props.type === 'warning') return '#FBBF24';
    if (props.type === 'success') return '#34D399';
    return '#5D8BF4';
  }};
  border-radius: 8px;
  padding: 12px 16px;
  position: relative;
  opacity: ${props => props.isRead ? 0.7 : 1};
  
  &::before {
    content: '';
    position: absolute;
    top: 16px;
    left: -8px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${props => {
      if (props.type === 'warning') return '#FBBF24';
      if (props.type === 'success') return '#34D399';
      return '#5D8BF4';
    }};
  }
`;

const InsightTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: ${props => props.theme.text.primary};
`;

const InsightDescription = styled.p`
  font-size: 0.85rem;
  margin: 0 0 8px 0;
  color: ${props => props.theme.text.secondary};
  line-height: 1.4;
`;

const InsightFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InsightTime = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme.text.secondary};
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${props => props.theme.text.accent};
  cursor: pointer;
  padding: 0;
  
  &:hover {
    text-decoration: underline;
  }
`;

const InsightHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const InsightHeading = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.text.primary};
`;

const FilterButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text.accent};
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

// Component
const InsightsPanel: React.FC = () => {
  return (
    <Container>
      <InsightHeader>
        <InsightHeading>Insights & Alertas</InsightHeading>
        <FilterButton>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M6 12h12m-9 6h6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Filtrar
        </FilterButton>
      </InsightHeader>
      
      <InsightsList>
        {mockInsights.map(insight => (
          <InsightCard key={insight.id} type={insight.type} isRead={insight.isRead}>
            <InsightTitle>{insight.title}</InsightTitle>
            <InsightDescription>{insight.description}</InsightDescription>
            <InsightFooter>
              <InsightTime>{insight.time}</InsightTime>
              <ActionButton>Ver detalhes</ActionButton>
            </InsightFooter>
          </InsightCard>
        ))}
      </InsightsList>
    </Container>
  );
};

export default InsightsPanel; 