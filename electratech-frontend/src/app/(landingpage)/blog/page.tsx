import { apiRequest } from "@/lib/api";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <h1 className="text-2xl font-bold text-slate-100 mb-4">Blog Posts</h1>
      <p className="text-slate-400">Loading posts...</p>
    </div>
  );
}
