import apiHelper from "./client";
import type { ApiResponse, Id, NoteInput, PropertyNote } from "./types";

export const addNote = (id: Id, formdata: NoteInput) => {
  return apiHelper.post<ApiResponse<unknown>>(`notes/createNote/${id}`, formdata);
};

export const getNote = (id: Id) => {
  return apiHelper.get<ApiResponse<PropertyNote>>(`notes/findNoteById/${id}`);
};

export const updateNote = (id: Id, formdata: NoteInput) => {
  return apiHelper.put<ApiResponse<unknown>>(`notes/updateNote/${id}`, formdata);
};

export const deleteNote = (id: Id) => {
  return apiHelper.delete<ApiResponse<unknown>>(`notes/deleteNote/${id}`);
};
