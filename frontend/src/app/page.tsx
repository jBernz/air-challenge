// 'use client';

// import WebSocketDemo from '@/components/WebSocketDemo';

// export default function Home() {
//   return (
//     <main className="min-h-screen bg-gray-100 py-8">
//       <WebSocketDemo />
//     </main>
//   );
// }

"use client"

import BoardHierarchy from "@/components/BoardHierarchy"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Create a client
const queryClient = new QueryClient()

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <main className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">Board Management System</h1>
          <BoardHierarchy />
        </div>
      </main>
    </QueryClientProvider>
  )
}
