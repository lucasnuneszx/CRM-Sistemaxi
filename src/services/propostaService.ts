import { buildApiUrl, API_CONFIG } from "@/config/api";

export async function criarProposta(proposta: any, token: string) {
  const response = await fetch(buildApiUrl("/v1/propostas"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(proposta)
  });
  if (!response.ok) throw new Error("Erro ao criar proposta");
  return await response.json();
}

export async function listarPropostas(token: string) {
  const response = await fetch(buildApiUrl("/v1/propostas"), {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error("Erro ao buscar propostas");
  return await response.json();
}
