import { customAlphabet } from "nanoid";

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const ID_LENGTH = 10;

export const generateId = customAlphabet(ALPHABET, ID_LENGTH);
