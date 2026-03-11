import axios from 'axios';

const baseURL = process.env.RPS_API_BASE_URL;
const token = process.env.RPS_API_TOKEN;

if (!baseURL){
    throw new Error("Missing RPS_API_BASE_URL in .env");
}
if (!token){
    throw new Error("Missing RPS_API_TOKEN in .env");
}

export const rpsApi = axios.create({
    baseURL,
    headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
    },
});