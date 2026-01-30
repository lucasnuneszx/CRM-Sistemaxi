import React from 'react';
import styled from 'styled-components';

// Types
interface HeaderProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

// Styled Components
const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  background: ${props => props.theme.bg.secondary};
  border-bottom: 1px solid ${props => props.theme.bg.tertiary};
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.text.primary};
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: ${props => props.theme.text.secondary};
  margin: 4px 0 0 0;
`;

const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const TimeRangeSelector = styled.div`
  display: flex;
  background: ${props => props.theme.bg.tertiary};
  border-radius: 8px;
  overflow: hidden;
`;

const TimeOption = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  background: ${props => props.active ? props.theme.bg.accent : 'transparent'};
  color: ${props => props.active ? '#fff' : props.theme.text.secondary};
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.active ? props.theme.bg.accent : props.theme.bg.tertiary};
    color: ${props => props.active ? '#fff' : props.theme.text.primary};
  }
`;

const RefreshButton = styled.button`
  background: ${props => props.theme.bg.tertiary};
  color: ${props => props.theme.text.primary};
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme.bg.accent};
    color: white;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

// Component
const Header: React.FC<HeaderProps> = ({ timeRange, onTimeRangeChange }) => {
  return (
    <HeaderContainer>
      <TitleGroup>
        <Title>Marketing Dashboard</Title>
        <Subtitle>Monitore seus canais e campanhas de marketing em tempo real</Subtitle>
      </TitleGroup>
      
      <Actions>
        <TimeRangeSelector>
          <TimeOption 
            active={timeRange === '7d'} 
            onClick={() => onTimeRangeChange('7d')}
          >
            7 dias
          </TimeOption>
          <TimeOption 
            active={timeRange === '30d'} 
            onClick={() => onTimeRangeChange('30d')}
          >
            30 dias
          </TimeOption>
          <TimeOption 
            active={timeRange === '90d'} 
            onClick={() => onTimeRangeChange('90d')}
          >
            90 dias
          </TimeOption>
        </TimeRangeSelector>
        
        <RefreshButton>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </RefreshButton>
      </Actions>
    </HeaderContainer>
  );
};

export default Header; 