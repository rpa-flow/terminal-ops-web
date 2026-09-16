import { HeaderLinkButton } from "./AppHeader";

export const ConfigurationNavigation = () => (
  <>
    <HeaderLinkButton to="/">Painel operacional</HeaderLinkButton>
    <HeaderLinkButton to="/fornecedores">Fornecedores</HeaderLinkButton>
    <HeaderLinkButton to="/sinter-feeds">Sinter Feed</HeaderLinkButton>
    <HeaderLinkButton to="/blends">Blends</HeaderLinkButton>
    <HeaderLinkButton to="/classificacoes-por-fornecedor">Classificações por fornecedor</HeaderLinkButton>
  </>
);
