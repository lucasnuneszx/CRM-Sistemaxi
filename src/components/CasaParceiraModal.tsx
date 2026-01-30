'use client';

import { useState, useEffect } from 'react';
import { CasaParceira } from '@/types/casaParceira';

interface CasaParceiraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<CasaParceira>) => void;
  casa?: CasaParceira;
  mode: 'create' | 'edit';
}

interface CanalConfig {
  utm_content?: string;
  utm_term?: string;
  utm_medium?: string;
}

interface CanaisConfig {
  geral?: CanalConfig;
  instagram?: {
    close_friends?: CanalConfig;
    normal?: CanalConfig;
  };
  telegram?: {
    free?: CanalConfig;
    vip?: CanalConfig;
  };
}

export default function CasaParceiraModal({ isOpen, onClose, onSubmit, casa, mode }: CasaParceiraModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    logo_url: '',
    link_base: '',
    codigo_afiliado: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    ativo: true
  });

  const [canaisConfig, setCanaisConfig] = useState<CanaisConfig>({
    geral: { utm_content: '', utm_term: '' },
    instagram: {
      close_friends: { utm_content: '', utm_term: '' },
      normal: { utm_content: '', utm_term: '' }
    },
    telegram: {
      free: { utm_content: '', utm_term: '' },
      vip: { utm_content: '', utm_term: '' }
    }
  });

  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  useEffect(() => {
    if (casa && mode === 'edit') {
      setFormData({
        nome: casa.nome || '',
        slug: casa.slug || '',
        logo_url: casa.logo_url || '',
        link_base: casa.link_base || '',
        codigo_afiliado: casa.codigo_afiliado || '',
        utm_source: casa.utm_source || '',
        utm_medium: casa.utm_medium || '',
        utm_campaign: casa.utm_campaign || '',
        ativo: casa.ativo ?? true
      });

      if (casa.canais_config) {
        setCanaisConfig({
          geral: casa.canais_config.geral || { utm_content: '', utm_term: '' },
          instagram: {
            close_friends: casa.canais_config.instagram?.close_friends || { utm_content: '', utm_term: '' },
            normal: casa.canais_config.instagram?.normal || { utm_content: '', utm_term: '' }
          },
          telegram: {
            free: casa.canais_config.telegram?.free || { utm_content: '', utm_term: '' },
            vip: casa.canais_config.telegram?.vip || { utm_content: '', utm_term: '' }
          }
        });
      }
    } else {
      // Reset form for create mode
      setFormData({
        nome: '',
        slug: '',
        logo_url: '',
        link_base: '',
        codigo_afiliado: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        ativo: true
      });
      setCanaisConfig({
        geral: { utm_content: '', utm_term: '' },
        instagram: {
          close_friends: { utm_content: '', utm_term: '' },
          normal: { utm_content: '', utm_term: '' }
        },
        telegram: {
          free: { utm_content: '', utm_term: '' },
          vip: { utm_content: '', utm_term: '' }
        }
      });
    }
  }, [casa, mode]);

  const generateSlug = (nome: string) => {
    return nome.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'nome') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        slug: generateSlug(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const updateCanalConfig = (canal: keyof CanaisConfig, subcanal: string | null, field: keyof CanalConfig, value: string) => {
    setCanaisConfig(prev => {
      const newConfig = { ...prev };
      
      if (subcanal) {
        if (!newConfig[canal]) {
          newConfig[canal] = {} as any;
        }
        if (!(newConfig[canal] as any)[subcanal]) {
          (newConfig[canal] as any)[subcanal] = {};
        }
        (newConfig[canal] as any)[subcanal][field] = value;
      } else {
        if (!newConfig[canal]) {
          newConfig[canal] = {};
        }
        (newConfig[canal] as any)[field] = value;
      }
      
      return newConfig;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      canais_config: canaisConfig
    };
    
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">
          {mode === 'create' ? 'Nova Casa Parceira' : 'Editar Casa Parceira'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Configurações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white mb-2">Nome *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 text-white rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-white mb-2">Slug *</label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 text-white rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-white mb-2">Logo URL</label>
              <input
                type="url"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 text-white rounded"
              />
            </div>
            
            <div>
              <label className="block text-white mb-2">Link Base *</label>
              <input
                type="url"
                name="link_base"
                value={formData.link_base}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 text-white rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-white mb-2">Código Afiliado</label>
              <input
                type="text"
                name="codigo_afiliado"
                value={formData.codigo_afiliado}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 text-white rounded"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="ativo"
                checked={formData.ativo}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-white">Ativo</label>
            </div>
          </div>

          {/* UTM Parameters Base */}
          <div className="border-t border-gray-600 pt-4">
            <h3 className="text-lg font-semibold text-white mb-3">UTM Parameters Base</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-white mb-2">UTM Source</label>
                <input
                  type="text"
                  name="utm_source"
                  value={formData.utm_source}
                  onChange={handleInputChange}
                  placeholder="Ex: mcgames"
                  className="w-full p-2 bg-gray-700 text-white rounded"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2">UTM Medium</label>
                <input
                  type="text"
                  name="utm_medium"
                  value={formData.utm_medium}
                  onChange={handleInputChange}
                  placeholder="Ex: affiliate"
                  className="w-full p-2 bg-gray-700 text-white rounded"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2">UTM Campaign</label>
                <input
                  type="text"
                  name="utm_campaign"
                  value={formData.utm_campaign}
                  onChange={handleInputChange}
                  placeholder="Ex: promocao_2024"
                  className="w-full p-2 bg-gray-700 text-white rounded"
                />
              </div>
            </div>
          </div>

          {/* Configuração Avançada de Canais */}
          <div className="border-t border-gray-600 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Configuração de Canais</h3>
              <button
                type="button"
                onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                {showAdvancedConfig ? 'Ocultar' : 'Configurar Canais'}
              </button>
            </div>

            {showAdvancedConfig && (
              <div className="space-y-6">
                {/* Canal Geral */}
                <div className="bg-gray-700 p-4 rounded">
                  <h4 className="font-semibold text-white mb-3">Canal Geral</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white mb-2">UTM Content</label>
                      <input
                        type="text"
                        value={canaisConfig.geral?.utm_content || ''}
                        onChange={(e) => updateCanalConfig('geral', null, 'utm_content', e.target.value)}
                        placeholder="Ex: geral"
                        className="w-full p-2 bg-gray-600 text-white rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-2">UTM Term</label>
                      <input
                        type="text"
                        value={canaisConfig.geral?.utm_term || ''}
                        onChange={(e) => updateCanalConfig('geral', null, 'utm_term', e.target.value)}
                        placeholder="Ex: organico"
                        className="w-full p-2 bg-gray-600 text-white rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Canal Instagram */}
                <div className="bg-gray-700 p-4 rounded">
                  <h4 className="font-semibold text-white mb-3">Instagram</h4>
                  
                  <div className="mb-4">
                    <h5 className="text-white mb-2">Close Friends</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white mb-2">UTM Content</label>
                        <input
                          type="text"
                          value={canaisConfig.instagram?.close_friends?.utm_content || ''}
                          onChange={(e) => updateCanalConfig('instagram', 'close_friends', 'utm_content', e.target.value)}
                          placeholder="Ex: ig_cf"
                          className="w-full p-2 bg-gray-600 text-white rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">UTM Term</label>
                        <input
                          type="text"
                          value={canaisConfig.instagram?.close_friends?.utm_term || ''}
                          onChange={(e) => updateCanalConfig('instagram', 'close_friends', 'utm_term', e.target.value)}
                          placeholder="Ex: vip"
                          className="w-full p-2 bg-gray-600 text-white rounded"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-white mb-2">Normal</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white mb-2">UTM Content</label>
                        <input
                          type="text"
                          value={canaisConfig.instagram?.normal?.utm_content || ''}
                          onChange={(e) => updateCanalConfig('instagram', 'normal', 'utm_content', e.target.value)}
                          placeholder="Ex: ig_normal"
                          className="w-full p-2 bg-gray-600 text-white rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">UTM Term</label>
                        <input
                          type="text"
                          value={canaisConfig.instagram?.normal?.utm_term || ''}
                          onChange={(e) => updateCanalConfig('instagram', 'normal', 'utm_term', e.target.value)}
                          placeholder="Ex: publico"
                          className="w-full p-2 bg-gray-600 text-white rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Canal Telegram */}
                <div className="bg-gray-700 p-4 rounded">
                  <h4 className="font-semibold text-white mb-3">Telegram</h4>
                  
                  <div className="mb-4">
                    <h5 className="text-white mb-2">Free</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white mb-2">UTM Content</label>
                        <input
                          type="text"
                          value={canaisConfig.telegram?.free?.utm_content || ''}
                          onChange={(e) => updateCanalConfig('telegram', 'free', 'utm_content', e.target.value)}
                          placeholder="Ex: tg_free"
                          className="w-full p-2 bg-gray-600 text-white rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">UTM Term</label>
                        <input
                          type="text"
                          value={canaisConfig.telegram?.free?.utm_term || ''}
                          onChange={(e) => updateCanalConfig('telegram', 'free', 'utm_term', e.target.value)}
                          placeholder="Ex: gratuito"
                          className="w-full p-2 bg-gray-600 text-white rounded"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-white mb-2">VIP</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white mb-2">UTM Content</label>
                        <input
                          type="text"
                          value={canaisConfig.telegram?.vip?.utm_content || ''}
                          onChange={(e) => updateCanalConfig('telegram', 'vip', 'utm_content', e.target.value)}
                          placeholder="Ex: tg_vip"
                          className="w-full p-2 bg-gray-600 text-white rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">UTM Term</label>
                        <input
                          type="text"
                          value={canaisConfig.telegram?.vip?.utm_term || ''}
                          onChange={(e) => updateCanalConfig('telegram', 'vip', 'utm_term', e.target.value)}
                          placeholder="Ex: premium"
                          className="w-full p-2 bg-gray-600 text-white rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              {mode === 'create' ? 'Criar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}