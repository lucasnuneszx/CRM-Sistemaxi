from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
from urllib.parse import urlencode, urlparse, parse_qs, urlunparse
from ..models.casa_parceira import CasaParceira
from ..schemas.casa_parceira import CasaParceiraCreate, CasaParceiraUpdate, LinkRequest


class CasaParceiraService:
    """Service for managing casas parceiras and generating links"""
    
    @staticmethod
    def get_casas_by_projeto(db: Session, projeto_id: UUID) -> List[CasaParceira]:
        """Get all casas parceiras for a project"""
        return db.query(CasaParceira).filter(
            CasaParceira.projeto_id == projeto_id,
            CasaParceira.ativo == True
        ).all()
    
    @staticmethod
    def get_casa_by_id(db: Session, casa_id: UUID) -> Optional[CasaParceira]:
        """Get casa parceira by ID"""
        return db.query(CasaParceira).filter(CasaParceira.id == casa_id).first()
    
    @staticmethod
    def get_casa_by_slug(db: Session, slug: str) -> Optional[CasaParceira]:
        """Get casa parceira by slug"""
        return db.query(CasaParceira).filter(CasaParceira.slug == slug).first()
    
    @staticmethod
    def create_casa(db: Session, casa: CasaParceiraCreate) -> CasaParceira:
        """Create new casa parceira"""
        db_casa = CasaParceira(**casa.dict())
        db.add(db_casa)
        db.commit()
        db.refresh(db_casa)
        return db_casa
    
    @staticmethod
    def update_casa(db: Session, casa_id: UUID, casa_update: CasaParceiraUpdate) -> Optional[CasaParceira]:
        """Update casa parceira"""
        db_casa = db.query(CasaParceira).filter(CasaParceira.id == casa_id).first()
        if db_casa:
            update_data = casa_update.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(db_casa, field, value)
            db.commit()
            db.refresh(db_casa)
        return db_casa
    
    @staticmethod
    def delete_casa(db: Session, casa_id: UUID) -> bool:
        """Delete casa parceira"""
        db_casa = db.query(CasaParceira).filter(CasaParceira.id == casa_id).first()
        if db_casa:
            db.delete(db_casa)
            db.commit()
            return True
        return False
    
    @staticmethod
    def generate_link(casa: CasaParceira, link_request: LinkRequest) -> Dict[str, Any]:
        """Generate affiliate link with UTM parameters using pre-configured settings"""
        
        # UTM parameters base da casa
        utm_params = {
            "utm_source": casa.utm_source or casa.slug,
            "utm_medium": casa.utm_medium or "affiliate",
            "utm_campaign": casa.utm_campaign or casa.projeto.name.lower().replace(" ", "_"),
        }
        
        # Usar configurações pré-definidas dos canais
        if casa.canais_config:
            canal_config = None
            
            # Configuração do canal selecionado
            if link_request.canal == "geral" and casa.canais_config.get("geral"):
                canal_config = casa.canais_config["geral"]
            elif link_request.canal == "instagram" and casa.canais_config.get("instagram"):
                instagram_config = casa.canais_config["instagram"]
                if link_request.subcanal and instagram_config.get(link_request.subcanal):
                    canal_config = instagram_config[link_request.subcanal]
            elif link_request.canal == "telegram" and casa.canais_config.get("telegram"):
                telegram_config = casa.canais_config["telegram"]
                if link_request.subcanal and telegram_config.get(link_request.subcanal):
                    canal_config = telegram_config[link_request.subcanal]
            
            # Aplicar configuração do canal
            if canal_config:
                if canal_config.get("utm_content"):
                    utm_params["utm_content"] = canal_config["utm_content"]
                if canal_config.get("utm_term"):
                    utm_params["utm_term"] = canal_config["utm_term"]
                if canal_config.get("utm_medium"):
                    utm_params["utm_medium"] = canal_config["utm_medium"]
        
        # Override pontuais (raros)
        if link_request.override_utm_content:
            utm_params["utm_content"] = link_request.override_utm_content
        if link_request.override_utm_term:
            utm_params["utm_term"] = link_request.override_utm_term
        
        # Construir URL final
        base_url = casa.link_base
        
        # Parse da URL base
        parsed_url = urlparse(base_url)
        query_params = parse_qs(parsed_url.query)
        
        # Adicionar código de afiliado se definido
        if casa.codigo_afiliado:
            query_params['shareCode'] = [casa.codigo_afiliado]
        
        # Adicionar UTM parameters
        for key, value in utm_params.items():
            if value:
                query_params[key] = [value]
        
        # Reconstruir URL
        new_query = urlencode({k: v[0] for k, v in query_params.items()})
        final_url = urlunparse((
            parsed_url.scheme,
            parsed_url.netloc,
            parsed_url.path,
            parsed_url.params,
            new_query,
            parsed_url.fragment
        ))
        
        return {
            "link_final": final_url,
            "utm_params": utm_params
        } 