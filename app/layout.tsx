export const metadata = {
  title: "ILS Word Auto-Grader",
  description: "DOCX Upload + automatische Auswertung",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}