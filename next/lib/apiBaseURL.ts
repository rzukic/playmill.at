import baseUrl from './baseURL';
import isServer from './isServer';

const apiBaseUrl = `${isServer ? 'https' : 'http'}://${baseUrl}`;

export default apiBaseUrl;
