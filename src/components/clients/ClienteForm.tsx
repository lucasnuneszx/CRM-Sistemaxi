"use client";
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type TipoPessoa = 'FISICA' | 'JURIDICA';

const initialState = {
  tipo: 'FISICA' as TipoPessoa,
  nome: '',
  cpf: '',
  cnpj: '',
  email: '',
  telefone: '',
  endereco: '',
  cidade: '',
  estado: '',
};

export default function ClienteForm({ onSubmit }: { onSubmit?: (data: any) => void }) {
  const [form, setForm] = useState(initialState);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleTipoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, tipo: e.target.value as TipoPessoa }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Enviar dados para API
    alert('Cliente cadastrado! (mock)');
    setForm(initialState);
  }

  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
      <div className="md:col-span-2">
        <Label className="mb-1">Tipo de Pessoa</Label>
        <select name="tipo" value={form.tipo} onChange={handleTipoChange} className="border-input rounded-md p-2 w-full bg-background">
          <option value="FISICA">Pessoa Física</option>
          <option value="JURIDICA">Pessoa Jurídica</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <Label>Nome/Razão Social</Label>
        <Input name="nome" value={form.nome} onChange={handleChange} required />
      </div>
      {form.tipo === 'FISICA' ? (
        <div>
          <Label>CPF</Label>
          <Input name="cpf" value={form.cpf} onChange={handleChange} required={form.tipo === 'FISICA'} />
        </div>
      ) : (
        <div>
          <Label>CNPJ</Label>
          <Input name="cnpj" value={form.cnpj} onChange={handleChange} required={form.tipo === 'JURIDICA'} />
        </div>
      )}
      <div>
        <Label>E-mail</Label>
        <Input name="email" value={form.email} onChange={handleChange} type="email" required />
      </div>
      <div>
        <Label>Telefone</Label>
        <Input name="telefone" value={form.telefone} onChange={handleChange} />
      </div>
      <div className="md:col-span-2">
        <Label>Endereço</Label>
        <Input name="endereco" value={form.endereco} onChange={handleChange} />
      </div>
      <div>
        <Label>Cidade</Label>
        <Input name="cidade" value={form.cidade} onChange={handleChange} />
      </div>
      <div>
        <Label>Estado</Label>
        <Input name="estado" value={form.estado} onChange={handleChange} />
      </div>
      <div className="md:col-span-2 mt-2">
        <Button type="submit" className="w-full">Salvar Cliente</Button>
      </div>
    </form>
  );
}
