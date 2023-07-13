import isServer from './isServer';

const baseUrl = isServer ? 'api.playmill.at' : 'localhost:8080';

export default baseUrl;
