import ImageGenerator from '@/components/ImageGenerator';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 lg:p-24 bg-gray-50">
      <ImageGenerator />
    </main>
  );
}
