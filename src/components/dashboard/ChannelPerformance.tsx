import React from 'react';
import styled from 'styled-components';

// Types
interface ChannelDataItem {
  name: string;
  value: number;
  color: string;
}

interface ChannelPerformanceProps {
  data: ChannelDataItem[];
}

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 320px;
`;

const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  position: relative;
`;

const BarsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 100%;
  padding: 0 10px;
  margin-top: 20px;
`;

const BarGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 80px;
`;

const Bar = styled.div<{ height: string; color: string }>`
  width: 45px;
  height: ${props => props.height};
  background: ${props => props.color};
  border-radius: 8px 8px 0 0;
  transition: height 0.5s ease;
  position: relative;
  
  &:hover {
    opacity: 0.9;
    
    &::after {
      content: attr(data-value);
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      background: ${props => props.theme.bg.primary};
      color: ${props => props.theme.text.primary};
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      white-space: nowrap;
    }
  }
`;

const BarLabel = styled.div`
  margin-top: 8px;
  font-size: 0.8rem;
  color: ${props => props.theme.text.secondary};
  text-align: center;
`;

const HorizontalLines = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 30px;
  z-index: -1;
`;

const HorizontalLine = styled.div`
  width: 100%;
  height: 1px;
  background: ${props => props.theme.bg.tertiary};
`;

const LineLabel = styled.div`
  position: absolute;
  left: 0;
  font-size: 0.7rem;
  color: ${props => props.theme.text.secondary};
  transform: translateY(-50%);
`;

// Component
const ChannelPerformance: React.FC<ChannelPerformanceProps> = ({ data }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <Container>
      <ChartContainer>
        <HorizontalLines>
          {[0, 25, 50, 75, 100].map(value => (
            <HorizontalLine key={value}>
              <LineLabel>{value}%</LineLabel>
            </HorizontalLine>
          ))}
        </HorizontalLines>
        
        <BarsContainer>
          {data.map((item, index) => (
            <BarGroup key={index}>
              <Bar 
                height={`${(item.value / maxValue) * 100}%`} 
                color={item.color}
                data-value={`${item.value}%`}
              />
              <BarLabel>{item.name}</BarLabel>
            </BarGroup>
          ))}
        </BarsContainer>
      </ChartContainer>
    </Container>
  );
};

export default ChannelPerformance; 