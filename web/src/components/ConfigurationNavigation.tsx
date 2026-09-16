import { HeaderLinkButton } from "./AppHeader";

export const ConfigurationNavigation = () => (
  <>
    <HeaderLinkButton to="/">Painel operacional</HeaderLinkButton>
    <HeaderLinkButton to="/emitentes">Emitentes</HeaderLinkButton>
    <HeaderLinkButton to="/sinter-feeds">Sinter Feed e blends</HeaderLinkButton>
  </>
);
