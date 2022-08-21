import { isConcatSpreadable } from "core-js/fn/symbol";

const PREFIX = "https://diploma.timers.fun";
const MAX_COUNT_NOTES = 20;

const req = (url, options = {}) => {
  const { body } = options;

  return fetch((PREFIX + url).replace(/\/\/$/, ""), {
    ...options,
    body: body ? JSON.stringify(body) : null,
    headers: {
      ...options.headers,
      ...(body
        ? {
            "Content-Type": "application/json",
          }
        : null),
    },
  }).then((res) =>
    res.ok
      ? res.json()
      : res.text().then((message) => {
          throw new Error(message);
        })
  );
};

export const getNotes = ({ age, search, page } = {}) => {
  return req("/dashboard/notes").then(dataRes => {
    let d = new Date();
    let dataFilterByAge = [];
    const data = {};
    switch (age) {
      case '1month':
        dataFilterByAge = dataRes.data.filter(item => (new Date(item.created)) > (new Date(d.setMonth(d.getMonth() - 1))));
        break;
      case '3months':
        dataFilterByAge = dataRes.data.filter(item => (new Date(item.created)) > (new Date(d.setMonth(d.getMonth() - 3))));
        break;
      case 'alltime':
        dataFilterByAge = dataRes.data;
        break;
      case 'archive':
        dataFilterByAge = dataRes.data.filter(item => item.isArchived);
        break;
      default:
        break;
    }
    data.data = dataFilterByAge.slice((page - 1) * MAX_COUNT_NOTES, Math.min(page * MAX_COUNT_NOTES, dataFilterByAge.length));
    if (dataFilterByAge.length > page * MAX_COUNT_NOTES) {
      data.data = dataFilterByAge.slice((page - 1) * MAX_COUNT_NOTES, page * MAX_COUNT_NOTES);
      console.log('data', dataFilterByAge.length);
      data.hasMore = true;
    } else {
      data.data = dataFilterByAge.slice((page - 1) * MAX_COUNT_NOTES, dataFilterByAge.length);
      data.hasMore = false;
    }
    return data;
  });
};

export const createNote = (title, text) => {
  return req("/dashboard/note/new", {body: {title, text}, method:"post"});
};

export const getNote = (id) => {
  return req(`/dashboard/note/${id}`);
};

const toggleArchiveState = (id, isArchive) => {
  return req(`/dashboard/note/archive/${id}`, {body: {isArchive}, method:"post"});
}

export const archiveNote = (id) => {
  toggleArchiveState(id, true);
};

export const unarchiveNote = (id) => {
  toggleArchiveState(id, false);
};

export const editNote = (id, title, text) => {
  return req(`/dashboard/note/${id}`, {body: {title, text}, method:"post"});
};

export const deleteNote = (id) => {
  return req(`/dashboard/note/${id}`, {method:"delete"});
};

export const deleteAllArchived = () => {
  return req(`/dashboard/deleteAllArchived`, {method:"delete"});
};

export const notePdfUrl = (id) => {};
