import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Zintra - B2B Construction Procurement Platform',
  description: 'Find vendors, get quotes, and hire the best contractors for your construction projects in Kenya.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}