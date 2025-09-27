import { Config } from './index';
import { apiconfig } from './apiconfig';

const config: Config = {
	server: {
		port: 2329,
	},
	api: apiconfig,
	db: {
		database: 'be-aware',
		username: '',
		password: '',
		host: 'localhost',
		port: 27017,
	},
	auth: {
		cookieKeys: ['1', '2', '3', '4', 'I declare a thumb war'],
		useAuth: true,
	},
	url: 'http://localhost:2329',
};

export default config;
