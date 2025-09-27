import prod from './config.production';
import dev from './config.dev';

export interface Config {
	server: {
		port: number;
	};
	api: {
		apiKey: string;
		agentId: string;
		apiEmotion: string;
	};
	db: {
		database: string;
		username: string;
		password: string;
		host: string;
		port: number;
	};
	auth: {
		cookieKeys: string[];
		useAuth: boolean;
	};
	url: string;
}

const config = !process.env.NODE_ENV || process.env.NODE_ENV == 'development' ? dev : prod;
export default config;
