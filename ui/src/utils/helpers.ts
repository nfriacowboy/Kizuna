import { useDispatch } from "react-redux";
import { IndexedContacts } from "../redux/contacts/types";
import { Profile } from "../redux/profile/types";
import { ReduxDispatch } from "./types";

export const indexContacts: (contacts: Profile[]) => IndexedContacts = (
  contacts
) => {
  let indexedContacts: IndexedContacts = {};
  if (contacts.length > 0) {
    let char = contacts[0].username.charAt(0).toUpperCase();
    indexedContacts[char] = [];
    contacts.forEach((contact: Profile) => {
      const currChar = contact.username.charAt(0).toUpperCase();
      if (currChar !== char) {
        char = currChar;
        indexedContacts[char] = [];
      }
      const currArr = indexedContacts[currChar];
      currArr.push(contact);
    });
  }
  return indexedContacts;
};

export const debounce: (callback: () => any, delay?: number) => Function = (
  callback,
  delay = 500
) => {
  let timeout: NodeJS.Timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(callback, delay);
  };
};

export const useAppDispatch = () => useDispatch<ReduxDispatch>();

export const convertIdtoUInt8Array = (id: number[]) => Uint8Array.from(id);

export const convertCamelToSnake = (arg: string) =>
  arg.replace(/([A-Z])/g, "_$1").toLowerCase();

export const convertSnakeToCamel = (arg: string) =>
  arg.replace(/([-_]\w)/g, (g) => g[1].toUpperCase());
