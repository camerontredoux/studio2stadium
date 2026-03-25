export interface TabState {
  isDirty: boolean;
  isPending: boolean;
  save: () => void;
}

export interface TabHandle {
  save: () => void;
  isDirty: boolean;
  isPending: boolean;
}
