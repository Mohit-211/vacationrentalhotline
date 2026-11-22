import apiHelper from "./client";

export const addNote = (id, formdata) => {
  return apiHelper.post(`notes/createNote/${id}`, formdata);
};

export const getNote = (id) => {
  return apiHelper.get(`notes/findNoteById/${id}`);
};

export const updateNote = (id, formdata) => {
  return apiHelper.put(`notes/updateNote/${id}`, formdata);
};

export const deleteNote = (id) => {
  return apiHelper.delete(`notes/deleteNote/${id}`);
};
