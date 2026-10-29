import { createContext, useContext } from 'react';

export interface NewCourseDialogApi {
  open: () => void;
  close: () => void;
}

export const NewCourseDialogContext = createContext<NewCourseDialogApi | null>(null);

export function useNewCourseDialog(): NewCourseDialogApi {
  const value = useContext(NewCourseDialogContext);
  if (!value) throw new Error('New course dialog provider is missing');
  return value;
}
