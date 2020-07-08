import axios from "axios";

axios.defaults.baseURL = process.env.REACT_APP_API_URL;

export const { get } = axios;
export const { put } = axios;
export const { post } = axios;
export const { delete: del } = axios;
