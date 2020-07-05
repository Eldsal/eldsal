import axios from "axios";
import * as helpers from "../helpers";

axios.defaults.baseURL = process.env.REACT_APP_API_URL;

axios.interceptors.request.use(
  (config) => {
    if (helpers.getAccessToken() && config.url !== "/login") {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `Bearer ${helpers.getAccessToken()}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const { code, response } = error;
    const unAuthorized = code !== "ECONNABORTED" && helpers.findInObject(response, "status", null) === 403;

    if (unAuthorized && helpers.getAccessToken()) {
      helpers.deleteAccessToken();
      window.location.reload();
    }

    return Promise.reject(error);
  }
);


export const { get } = axios;
export const { put } = axios;
export const { post } = axios;
export const { delete: del } = axios;
