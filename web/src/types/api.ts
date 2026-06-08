export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
  };
};

export type RecordItem = {
  id: string;
  dataHora: string;
  numeroNota: string;
  notaOriginal: string;
  status: string;
  notaPesagemId: string;
  motoristaNome: string;
  motoristaCelular: string;
  placa: string;
  terminal: string;
  createdAt: string;
};

export type RecordFilters = {
  startDate?: string;
  endDate?: string;
  status?: string;
  motorista?: string;
  placa?: string;
  terminal?: string;
  page: number;
  perPage: number;
};

export type RecordsResponse = {
  page: number;
  perPage: number;
  total: number;
  items: RecordItem[];
};

export type CsvUploadResponse = {
  inserted: number;
  errors: { row: number; message: string }[];
};


export type NoteItem = {
  id: string;
  codigo: string;
  terminal: string;
  placa: string | null;
  motoristaNome: string | null;
  motoristaTelefone: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PendingNotesResponse = {
  page: number;
  perPage: number;
  total: number;
  items: NoteItem[];
};
