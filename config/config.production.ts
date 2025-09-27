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
		cookieKeys: [
			'',
			'',
			'',
		],
		useAuth: true,
	},
	url: 'https://beaware.com',
};

export default config;
