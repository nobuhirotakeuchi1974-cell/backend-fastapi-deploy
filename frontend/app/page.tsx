async function getHealth() {
  const res = await fetch(
    "https://tech0-gen-11-step3-2-py-62.azurewebsites.net/health",
    {
      cache: "no-store",
    }
  );

  return res.json();
}

export default async function Home() {
  const data = await getHealth();

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-6">
        Human Capital OS
      </h1>

      <pre>
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}