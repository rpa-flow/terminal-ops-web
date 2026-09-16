import { AppNavigation } from "./AppNavigation";

type ConfigurationPage = "fornecedores" | "sinter-feeds" | "blends" | "classificacoes";

type Props = {
  current: ConfigurationPage;
  title: string;
  subtitle: string;
  onLogout: () => void;
};

export const ConfigurationPageHeader = ({ current, title, subtitle, onLogout }: Props) => (
  <header className="border-b border-outline-variant bg-surface-container-lowest">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
      <div className="flex flex-wrap items-center gap-4">
        <AppNavigation current="configuration" configurationCurrent={current} />
        <div>
          <h1 className="text-[22px] font-medium text-on-surface">{title}</h1>
          <p className="text-sm text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      <button className="btn-muted" onClick={onLogout}>Sair</button>
    </div>
  </header>
);
