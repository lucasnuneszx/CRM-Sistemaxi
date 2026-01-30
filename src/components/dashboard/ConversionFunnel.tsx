import React from 'react';
import styled from 'styled-components';

// Types
interface FunnelDataItem {
  name: string;
  value: number;
}

interface ConversionFunnelProps {
  data: FunnelDataItem[];
}

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 320px;
  padding: 20px 0;
`;

const FunnelContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
  gap: 4px;
  position: relative;
`;

const FunnelStage = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
`;

const StageBar = styled.div<{ width: string; color: string }>`
  height: 40px;
  width: ${props => props.width};
  background: ${props => props.color || props.theme.gradient.primary};
  border-radius: 6px;
  transition: width 0.5s ease;
  display: flex;
  align-items: center;
  padding: 0 20px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  }
`;

const StageName = styled.div`
  color: white;
  font-weight: 500;
  font-size: 0.85rem;
  z-index: 1;
`;

const StageValue = styled.div`
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  margin-left: auto;
  z-index: 1;
`;

const Connector = styled.div`
  height: 15px;
  width: 2px;
  background: ${props => props.theme.bg.tertiary};
  margin: 0 auto;
  position: relative;
  
  &::before, &::after {
    content: '';
    position: absolute;
    width: 10px;
    height: 2px;
    background: ${props => props.theme.bg.tertiary};
  }
  
  &::before {
    top: 0;
    left: -4px;
    transform: rotate(45deg);
  }
  
  &::after {
    top: 0;
    right: -4px;
    transform: rotate(-45deg);
  }
`;

const ConversionRate = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
`;

const RateValue = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.text.accent};
  font-weight: 600;
`;

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

// Component
const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ data }) => {
  // Calculate conversion rates between stages
  const rates = data.slice(0, -1).map((item, index) => {
    const nextItem = data[index + 1];
    const rate = (nextItem.value / item.value) * 100;
    return rate.toFixed(1) + '%';
  });
  
  // Determine the max value for scaling
  const maxValue = data[0].value;
  
  // Generate gradient colors for each stage
  const colors = [
    'linear-gradient(90deg, #5D8BF4 0%, #3D59A1 100%)',
    'linear-gradient(90deg, #4F72C5 0%, #345192 100%)',
    'linear-gradient(90deg, #425EA6 0%, #2A4480 100%)',
    'linear-gradient(90deg, #364E8A 0%, #1F3A73 100%)'
  ];
  
  return (
    <Container>
      <FunnelContainer>
        {data.map((item, index) => (
          <React.Fragment key={index}>
            <FunnelStage>
              <StageBar 
                width={`${(item.value / maxValue) * 100}%`} 
                color={colors[index % colors.length]}
              >
                <StageName>{item.name}</StageName>
                <StageValue>{formatNumber(item.value)}</StageValue>
              </StageBar>
              
              {index < data.length - 1 && (
                <ConversionRate>
                  <RateValue>{rates[index]}</RateValue>
                </ConversionRate>
              )}
            </FunnelStage>
            
            {index < data.length - 1 && <Connector />}
          </React.Fragment>
        ))}
      </FunnelContainer>
    </Container>
  );
};

export default ConversionFunnel; 