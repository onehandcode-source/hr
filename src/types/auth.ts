import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
	interface Session {
		user: {
			id: string;
			role: string;
			department?: string;
			position?: string;
		} & DefaultSession['user'];
	}

	interface User {
		id: string;
		email: string;
		name: string;
		role: string;
		department?: string;
		position?: string;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		id: string;
		role: string;
		department?: string;
		position?: string;
	}
}
