import React, { useState } from 'react';
import styled from 'styled-components';

// Types
interface ContentItem {
  id: number;
  title: string;
  platform: 'instagram' | 'tiktok' | 'facebook' | 'telegram';
  type: 'post' | 'story' | 'reel' | 'message';
  date: Date;
  status: 'scheduled' | 'published' | 'draft';
  author: string;
}

// Mock data - next 14 days
const generateMockData = (): ContentItem[] => {
  const platforms = ['instagram', 'tiktok', 'facebook', 'telegram'] as const;
  const types = ['post', 'story', 'reel', 'message'] as const;
  const statuses = ['scheduled', 'published', 'draft'] as const;
  const authors = ['Ana Silva', 'Pedro Santos', 'Carla Mendes', 'João Costa'];
  
  const today = new Date();
  const contentItems: ContentItem[] = [];
  
  for (let i = 0; i < 20; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + Math.floor(Math.random() * 14)); // Next 14 days
    
    contentItems.push({
      id: i + 1,
      title: ['Nova Coleção', 'Promoção Especial', 'Dica do Dia', 'Lançamento', 'Evento Exclusivo'][Math.floor(Math.random() * 5)],
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      type: types[Math.floor(Math.random() * types.length)],
      date,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      author: authors[Math.floor(Math.random() * authors.length)]
    });
  }
  
  return contentItems.sort((a, b) => a.date.getTime() - b.date.getTime());
};

const mockContentItems = generateMockData();

// Helper functions
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const getDayName = (date: Date): string => {
  return date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3);
};

const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const MonthSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Month = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.text.primary};
  min-width: 120px;
  text-align: center;
`;

const IconButton = styled.button`
  background: ${props => props.theme.bg.tertiary};
  color: ${props => props.theme.text.primary};
  border: none;
  border-radius: 8px;
  width: 32px;
  height: 32px;
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
    width: 14px;
    height: 14px;
  }
`;

const ViewSelector = styled.div`
  display: flex;
  background: ${props => props.theme.bg.tertiary};
  border-radius: 8px;
  overflow: hidden;
`;

const ViewOption = styled.button<{ active: boolean }>`
  padding: 6px 12px;
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

const AddButton = styled.button`
  background: ${props => props.theme.gradient.primary};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 16px;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const CalendarDays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  margin-bottom: 16px;
`;

const DayHeader = styled.div`
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${props => props.theme.text.secondary};
  text-transform: uppercase;
  padding-bottom: 8px;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
`;

const CalendarCell = styled.div<{ isCurrentMonth: boolean; isToday: boolean; hasContent: boolean }>`
  background: ${props => props.isToday ? props.theme.bg.accent : props.theme.bg.tertiary};
  color: ${props => props.isToday ? 'white' : props.isCurrentMonth ? props.theme.text.primary : props.theme.text.secondary};
  border-radius: 8px;
  min-height: 100px;
  padding: 8px;
  opacity: ${props => props.isCurrentMonth ? 1 : 0.5};
  position: relative;
  
  ${props => props.hasContent && !props.isToday && `
    &::after {
      content: '';
      position: absolute;
      top: 8px;
      right: 8px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${props.theme.gradient.primary};
    }
  `}
`;

const DateNumber = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 8px;
`;

const ContentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ContentItem = styled.div<{ platform: 'instagram' | 'tiktok' | 'facebook' | 'telegram'; status: 'scheduled' | 'published' | 'draft' }>`
  font-size: 0.75rem;
  padding: 4px 6px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
  
  ${props => props.platform === 'instagram' && `
    background: linear-gradient(45deg, #f09433 0%, #bc1888 100%);
  `}
  
  ${props => props.platform === 'tiktok' && `
    background: #000;
  `}
  
  ${props => props.platform === 'facebook' && `
    background: #4267B2;
  `}
  
  ${props => props.platform === 'telegram' && `
    background: #0088cc;
  `}
  
  ${props => props.status === 'draft' && `
    opacity: 0.6;
  `}
  
  ${props => props.status === 'published' && `
    position: relative;
    
    &::after {
      content: '✓';
      position: absolute;
      right: 6px;
      top: 4px;
    }
  `}
`;

const ListContainer = styled.div`
  overflow-y: auto;
  max-height: 300px;
  
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

const ContentTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const TableHead = styled.thead`
  background: ${props => props.theme.bg.tertiary};
`;

const TableHeaderCell = styled.th`
  text-align: left;
  padding: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => props.theme.text.secondary};
  
  &:first-child {
    border-top-left-radius: 8px;
  }
  
  &:last-child {
    border-top-right-radius: 8px;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr<{ isToday: boolean }>`
  &:nth-child(odd) {
    background: ${props => props.theme.bg.tertiary};
  }
  
  ${props => props.isToday && `
    background: rgba(93, 139, 244, 0.1) !important;
    font-weight: 600;
  `}
`;

const TableCell = styled.td`
  padding: 12px;
  font-size: 0.85rem;
  color: ${props => props.theme.text.primary};
`;

const StatusBadge = styled.span<{ status: 'scheduled' | 'published' | 'draft' }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => props.status === 'scheduled' && `
    background: rgba(93, 139, 244, 0.2);
    color: #5D8BF4;
  `}
  
  ${props => props.status === 'published' && `
    background: rgba(52, 211, 153, 0.2);
    color: #34D399;
  `}
  
  ${props => props.status === 'draft' && `
    background: rgba(148, 163, 184, 0.2);
    color: #94A3B8;
  `}
`;

const PlatformIcon = styled.span<{ platform: 'instagram' | 'tiktok' | 'facebook' | 'telegram' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 8px;
  
  ${props => props.platform === 'instagram' && `
    background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
  `}
  
  ${props => props.platform === 'tiktok' && `
    background: #000;
  `}
  
  ${props => props.platform === 'facebook' && `
    background: #4267B2;
  `}
  
  ${props => props.platform === 'telegram' && `
    background: #0088cc;
  `}
  
  svg {
    width: 14px;
    height: 14px;
    fill: white;
  }
`;

// Component
const ContentCalendar: React.FC = () => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const today = getToday();
  
  return (
    <Container>
      <CalendarHeader>
        <MonthSelector>
          <IconButton>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconButton>
          <Month>Maio 2023</Month>
          <IconButton>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconButton>
        </MonthSelector>
        
        <HeaderActions>
          <ViewSelector>
            <ViewOption 
              active={viewMode === 'calendar'} 
              onClick={() => setViewMode('calendar')}
            >
              Calendário
            </ViewOption>
            <ViewOption 
              active={viewMode === 'list'} 
              onClick={() => setViewMode('list')}
            >
              Lista
            </ViewOption>
          </ViewSelector>
          
          <AddButton>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Novo Conteúdo
          </AddButton>
        </HeaderActions>
      </CalendarHeader>
      
      {viewMode === 'list' ? (
        <ListContainer>
          <ContentTable>
            <TableHead>
              <tr>
                <TableHeaderCell>Data</TableHeaderCell>
                <TableHeaderCell>Título</TableHeaderCell>
                <TableHeaderCell>Plataforma</TableHeaderCell>
                <TableHeaderCell>Tipo</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Responsável</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {mockContentItems.map(item => (
                <TableRow key={item.id} isToday={isSameDay(item.date, today)}>
                  <TableCell>
                    {formatDate(item.date)} ({getDayName(item.date)})
                  </TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>
                    <PlatformIcon platform={item.platform}>
                      {item.platform === 'instagram' && (
                        <svg viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                        </svg>
                      )}
                      {item.platform === 'facebook' && (
                        <svg viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      )}
                      {item.platform === 'tiktok' && (
                        <svg viewBox="0 0 24 24">
                          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.11 1.48.53 2.97 1.59 4.04 1.03 1.08 2.42 1.64 3.83 1.91v3.81c-1.31-.05-2.63-.4-3.8-1.07-1.14-.63-1.48-.67-1.48-.67v7.05c.01 1.54-.15 3.06-.76 4.48-1.69 4-6.15 5.18-9.59 3.95C2.79 22.13 1 18.46 1.68 15.25c.62-2.95 3.18-5.29 6.22-5.7.09 2.83.44 3.2.44 3.2v.01c-2.24.45-2.65 2.52-2.53 3.72.2 1.92 2.23 3.17 4.1 2.57 1.66-.51 2.61-2.04 2.44-3.77-.04-1.4-.01-3.67-.01-5.9V2.63c-.43-.58-.5-1.31-.42-2.61h.61z"/>
                        </svg>
                      )}
                      {item.platform === 'telegram' && (
                        <svg viewBox="0 0 24 24">
                          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
                        </svg>
                      )}
                    </PlatformIcon>
                    {item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}
                  </TableCell>
                  <TableCell>
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status}>
                      {item.status === 'scheduled' ? 'Agendado' : 
                       item.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{item.author}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ContentTable>
        </ListContainer>
      ) : (
        <>
          <CalendarDays>
            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
              <DayHeader key={day}>{day}</DayHeader>
            ))}
          </CalendarDays>
          
          <CalendarGrid>
            {/* Simplified calendar grid cells */}
            {Array.from({ length: 35 }).map((_, index) => {
              const isToday = index === 10; // Just for example
              const isCurrentMonth = index > 2 && index < 33; // Just for example
              const hasContent = [5, 10, 15, 20, 25].includes(index); // Just for example
              const day = index - 2;
              
              return (
                <CalendarCell 
                  key={index} 
                  isToday={isToday} 
                  isCurrentMonth={isCurrentMonth} 
                  hasContent={hasContent}
                >
                  {isCurrentMonth && <DateNumber>{day}</DateNumber>}
                  
                  {isCurrentMonth && hasContent && (
                    <ContentList>
                      <ContentItem platform="instagram" status="scheduled">
                        Nova Coleção
                      </ContentItem>
                      {isToday && (
                        <ContentItem platform="tiktok" status="draft">
                          Dica do Dia
                        </ContentItem>
                      )}
                    </ContentList>
                  )}
                </CalendarCell>
              );
            })}
          </CalendarGrid>
        </>
      )}
    </Container>
  );
};

export default ContentCalendar; 