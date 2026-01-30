import React from 'react';
import styled from 'styled-components';

// Types
interface Influencer {
  id: number;
  name: string;
  username: string;
  platform: 'instagram' | 'tiktok' | 'telegram';
  avatar: string;
  content: {
    type: 'image' | 'video';
    thumbnail: string;
    stats: {
      likes: number;
      comments: number;
      shares: number;
      views?: number;
    };
    engagement: number;
    cpl: number;
  };
}

// Mock data
const mockInfluencers: Influencer[] = [
  {
    id: 1,
    name: 'Ana Silva',
    username: '@anasilvaofficial',
    platform: 'instagram',
    avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    content: {
      type: 'image',
      thumbnail: 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8',
      stats: {
        likes: 15430,
        comments: 345,
        shares: 87
      },
      engagement: 4.7,
      cpl: 2.35
    }
  },
  {
    id: 2,
    name: 'Carlos Mendes',
    username: '@carlosmendes',
    platform: 'tiktok',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    content: {
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7',
      stats: {
        likes: 78900,
        comments: 1245,
        shares: 6700,
        views: 345000
      },
      engagement: 6.8,
      cpl: 1.85
    }
  },
  {
    id: 3,
    name: 'Juliana Costa',
    username: '@julicosta',
    platform: 'instagram',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    content: {
      type: 'image',
      thumbnail: 'https://images.unsplash.com/photo-1542596594-649edbc13630',
      stats: {
        likes: 9230,
        comments: 187,
        shares: 43
      },
      engagement: 3.2,
      cpl: 3.10
    }
  },
  {
    id: 4,
    name: 'Pedro Almeida',
    username: '@pedroalmeida',
    platform: 'telegram',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    content: {
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
      stats: {
        likes: 5430,
        comments: 876,
        shares: 234,
        views: 98700
      },
      engagement: 5.4,
      cpl: 2.75
    }
  }
];

// Styled Components
const GalleryContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 16px;
`;

const InfluencerCard = styled.div`
  background: ${props => props.theme.bg.tertiary};
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const ContentThumbnail = styled.div<{ url: string }>`
  width: 100%;
  height: 180px;
  background-image: url(${props => props.url});
  background-size: cover;
  background-position: center;
  position: relative;
`;

const PlatformBadge = styled.div<{ platform: 'instagram' | 'tiktok' | 'telegram' }>`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${props => props.platform === 'instagram' && `
    background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
  `}
  
  ${props => props.platform === 'tiktok' && `
    background: #000;
  `}
  
  ${props => props.platform === 'telegram' && `
    background: #0088cc;
  `}
`;

const ContentType = styled.div<{ type: 'image' | 'video' }>`
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 0.7rem;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

const InfluencerInfo = styled.div`
  padding: 16px;
`;

const InfluencerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const Avatar = styled.div<{ url: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-image: url(${props => props.url});
  background-size: cover;
  background-position: center;
  border: 2px solid ${props => props.theme.bg.accent};
`;

const InfluencerName = styled.div`
  display: flex;
  flex-direction: column;
`;

const Name = styled.div`
  font-weight: 600;
  color: ${props => props.theme.text.primary};
`;

const Username = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.text.secondary};
`;

const Stats = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatValue = styled.div`
  font-weight: 600;
  color: ${props => props.theme.text.primary};
`;

const StatLabel = styled.div`
  font-size: 0.7rem;
  color: ${props => props.theme.text.secondary};
`;

const Metrics = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid ${props => props.theme.bg.secondary};
`;

const Metric = styled.div`
  display: flex;
  flex-direction: column;
`;

const MetricValue = styled.div<{ green?: boolean }>`
  font-weight: 600;
  color: ${props => props.green ? '#34D399' : props.theme.text.primary};
`;

const MetricLabel = styled.div`
  font-size: 0.7rem;
  color: ${props => props.theme.text.secondary};
`;

// Helpers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Component
const InfluencerGallery: React.FC = () => {
  return (
    <GalleryContainer>
      {mockInfluencers.map(influencer => (
        <InfluencerCard key={influencer.id}>
          <ContentThumbnail url={influencer.content.thumbnail}>
            <PlatformBadge platform={influencer.platform}>
              {influencer.platform === 'instagram' && 
                <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              }
              {influencer.platform === 'tiktok' && 
                <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.11 1.48.53 2.97 1.59 4.04 1.03 1.08 2.42 1.64 3.83 1.91v3.81c-1.31-.05-2.63-.4-3.8-1.07-1.14-.63-1.48-.67-1.48-.67v7.05c.01 1.54-.15 3.06-.76 4.48-1.69 4-6.15 5.18-9.59 3.95C2.79 22.13 1 18.46 1.68 15.25c.62-2.95 3.18-5.29 6.22-5.7.09 2.83.44 3.2.44 3.2v.01c-2.24.45-2.65 2.52-2.53 3.72.2 1.92 2.23 3.17 4.1 2.57 1.66-.51 2.61-2.04 2.44-3.77-.04-1.4-.01-3.67-.01-5.9V2.63c-.43-.58-.5-1.31-.42-2.61h.61z"/>
                </svg>
              }
              {influencer.platform === 'telegram' && 
                <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                  <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
                </svg>
              }
            </PlatformBadge>
            <ContentType type={influencer.content.type}>
              {influencer.content.type === 'image' ? 
                <>
                  <svg viewBox="0 0 24 24" fill="white">
                    <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zm-4.28 10.2a.75.75 0 01-1.06 0l-2.16-2.17-4.34 4.34a.75.75 0 11-1.06-1.06l4.34-4.34-1.59-1.59a.75.75 0 010-1.06l2.37-2.38a.75.75 0 011.06 0l6.38 6.38a.75.75 0 010 1.06l-3.94 3.94a.75.75 0 01-1.06 0l-1.06-1.06.75-.75a.75.75 0 000-1.06l-.53-.53.76-.76z"/>
                  </svg>
                  Imagem
                </> : 
                <>
                  <svg viewBox="0 0 24 24" fill="white">
                    <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 000-1.69L9.54 5.98A.998.998 0 008 6.82z"/>
                  </svg>
                  Vídeo
                </>
              }
            </ContentType>
          </ContentThumbnail>
          
          <InfluencerInfo>
            <InfluencerHeader>
              <Avatar url={influencer.avatar} />
              <InfluencerName>
                <Name>{influencer.name}</Name>
                <Username>{influencer.username}</Username>
              </InfluencerName>
            </InfluencerHeader>
            
            <Stats>
              <StatItem>
                <StatValue>{formatNumber(influencer.content.stats.likes)}</StatValue>
                <StatLabel>Likes</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{formatNumber(influencer.content.stats.comments)}</StatValue>
                <StatLabel>Comentários</StatLabel>
              </StatItem>
              <StatItem>
                <StatValue>{formatNumber(influencer.content.stats.shares)}</StatValue>
                <StatLabel>Compartilhamentos</StatLabel>
              </StatItem>
              {influencer.content.stats.views && (
                <StatItem>
                  <StatValue>{formatNumber(influencer.content.stats.views)}</StatValue>
                  <StatLabel>Visualizações</StatLabel>
                </StatItem>
              )}
            </Stats>
            
            <Metrics>
              <Metric>
                <MetricValue green>{influencer.content.engagement}%</MetricValue>
                <MetricLabel>Engagement</MetricLabel>
              </Metric>
              <Metric>
                <MetricValue>R$ {influencer.content.cpl.toFixed(2)}</MetricValue>
                <MetricLabel>Custo por Lead</MetricLabel>
              </Metric>
            </Metrics>
          </InfluencerInfo>
        </InfluencerCard>
      ))}
    </GalleryContainer>
  );
};

export default InfluencerGallery; 