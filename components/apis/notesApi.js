import apiHelper from "./apiHelper";

export const AddNoteApi = (id, formdata) => {
  return apiHelper.post(`notes/createNote/${id}`, formdata);
};

export const FindNotesByIdApi = (id) => {
  return apiHelper.get(`notes/findNoteById/${id}`);
};

export const EditNoteApi = (id, formdata) => {
  return apiHelper.put(`notes/updateNote/${id}`, formdata);
};

export const DeleteNotesApi = (id) => {
  return apiHelper.delete(`notes/deleteNote/${id}`);
};
