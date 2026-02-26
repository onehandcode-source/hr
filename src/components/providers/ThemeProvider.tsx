import { ReactNode } from 'react';

interface Props {
	children: ReactNode;
}

export default function ThemeProvider({ children }: Props) {
	return <>{children}</>;
}
