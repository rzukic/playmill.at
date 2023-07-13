import baseUrl from './baseURL';
import isServer from './isServer';

const wsBaseURL = `${isServer ? 'https' : 'ws'}://${baseUrl}`;
export default wsBaseURL;
