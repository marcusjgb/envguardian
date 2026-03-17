const db = process.env.DATABASE_URL;
const jwt = process.env.JWT_SECRET;
const api = import.meta.env.VITE_API_URL;

console.log(db, jwt, api);