"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AuthButton from "@/components/AuthButton";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

 useEffect(() => {
  if (!user) return;

  fetchBookmarks();

  const channel = supabase
    .channel("bookmarks-db-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bookmarks",
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        console.log("Realtime event:", payload);
        fetchBookmarks();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user]);


  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  };

const addBookmark = async () => {
  if (!url || !title) return;

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      url,
      title,
      user_id: user.id,
    })
    .select();

  if (!error && data) {
    setBookmarks((prev) => [data[0], ...prev]);
  }

  setUrl("");
  setTitle("");
};


const deleteBookmark = async (id: string) => {
  // remove instantly from UI
  setBookmarks((prev) => prev.filter((b) => b.id !== id));

  // delete from database
  await supabase.from("bookmarks").delete().eq("id", id);
};


  return (
    <main className="p-10 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Smart Bookmark App</h1>

      <AuthButton user={user} />

      {user && (
        <>
          <div className="mt-6 space-y-2">
            <input
              className="border p-2 w-full"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="border p-2 w-full"
              placeholder="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              onClick={addBookmark}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add Bookmark
            </button>
          </div>

          <ul className="mt-6 space-y-3">
            {bookmarks.map((b) => (
              <li
                key={b.id}
                className="border p-3 rounded flex justify-between"
              >
                <a href={b.url} target="_blank" className="font-semibold">
                  {b.title}
                </a>
                <button
                  onClick={() => deleteBookmark(b.id)}
                  className="text-red-500"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
