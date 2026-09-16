import { http } from "./http";

export type Issuer = {
  id: string;
  cnpj: string;
  descricao: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SinterFeed = {
  id: string;
  code: string;
  description: string | null;
  isActive: boolean;
};

export type Blend = {
  id: string;
  code: string;
  description: string | null;
  isActive: boolean;
};

export type IssuerSinterFeedMapping = {
  id: string;
  issuerId: string;
  sinterFeedId: string;
  blendId: string;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  issuer: Issuer;
  sinterFeed: SinterFeed;
  blend: Blend;
};

type CatalogInput = { code: string; description?: string | null; isActive?: boolean };
type MappingInput = { issuerId: string; sinterFeedId: string; blendId: string; startsAt?: string; endsAt?: string | null; isActive?: boolean };

export const listIssuersRequest = (token: string) => http<Issuer[]>("/issuers", { token });
export const updateIssuerRequest = (token: string, id: string, description: string | null) =>
  http<Issuer>(`/issuers/${id}`, { method: "PATCH", token, body: { description } });

export const listSinterFeedsRequest = (token: string) => http<SinterFeed[]>("/sinter-feeds", { token });
export const createSinterFeedRequest = (token: string, input: CatalogInput) =>
  http<SinterFeed>("/sinter-feeds", { method: "POST", token, body: input });
export const updateSinterFeedRequest = (token: string, id: string, input: Pick<CatalogInput, "description" | "isActive">) =>
  http<SinterFeed>(`/sinter-feeds/${id}`, { method: "PATCH", token, body: input });

export const listBlendsRequest = (token: string) => http<Blend[]>("/blends", { token });
export const createBlendRequest = (token: string, input: CatalogInput) =>
  http<Blend>("/blends", { method: "POST", token, body: input });
export const updateBlendRequest = (token: string, id: string, input: Pick<CatalogInput, "description" | "isActive">) =>
  http<Blend>(`/blends/${id}`, { method: "PATCH", token, body: input });

export const listIssuerSinterFeedMappingsRequest = (token: string) => http<IssuerSinterFeedMapping[]>("/issuer-sinter-feed-mappings", { token });
export const createIssuerSinterFeedMappingRequest = (token: string, input: MappingInput) =>
  http<IssuerSinterFeedMapping>("/issuer-sinter-feed-mappings", { method: "POST", token, body: input });
export const deactivateIssuerSinterFeedMappingRequest = (token: string, id: string, endsAt?: string) =>
  http<IssuerSinterFeedMapping>(`/issuer-sinter-feed-mappings/${id}/deactivate`, { method: "POST", token, body: endsAt ? { endsAt } : {} });
