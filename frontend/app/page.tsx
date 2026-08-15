import Twin from '@/components/twin';

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-[#FAF9F5] flex flex-col justify-between antialiased selection:bg-[#F3EFE6] selection:text-[#1E1E1C]">
      <Twin />
    </main>
  );
}