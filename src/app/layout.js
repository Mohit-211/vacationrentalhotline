// Bootstrap must load before globals.scss so the app's rules win on equal specificity.
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.scss";

export const metadata = {
  title: "Vacation rental hotline",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css?family=Poppins" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css?family=Figtree" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
