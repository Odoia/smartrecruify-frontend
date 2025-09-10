export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      {children}
    </div>
  );
}

// export default function AuthLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="min-h-screen bg-background text-foreground">
//       <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-6">
//         {children}
//       </main>
//     </div>
//   );
// }
