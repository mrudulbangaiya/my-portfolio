import Hero from "@/components/sections/Hero"

export default function Home() {
    return (
        <main className="w-full bg-background min-h-screen">
            <Hero />
            {/* Other sections will be added here */}
            <div className="h-screen w-full flex items-center justify-center bg-zinc-950/50">
                <p className="text-muted-foreground">More content coming soon...</p>
            </div>
        </main>
    )
}
