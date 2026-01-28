import type { Route } from "./+types/sequences";
import { getPublishedSequences, getMySequences } from "~/server/db-drizzle";
import { Link } from "react-router";
import { getCurrentUser } from "~/server/auth";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request);
  
  let mySequences: any[] = [];
  let otherSequences: any[] = [];
  
  if (user) {
    // Get sequences user owns or collaborates on
    mySequences = await getMySequences(user.id);
    
    // Get all published sequences
    const allPublishedSequences = await getPublishedSequences();
    
    // Filter out sequences that are already in mySequences
    const mySequenceIds = new Set(mySequences.map(s => s.id));
    otherSequences = allPublishedSequences.filter(s => !mySequenceIds.has(s.id));
  } else {
    // Not logged in - just show all published sequences
    otherSequences = await getPublishedSequences();
  }
  
  return { user, mySequences, otherSequences };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sequences - BrainSequences" },
    { name: "description", content: "Browse brain sequences" },
  ];
}

export default function Sequences({ loaderData }: Route.ComponentProps) {
  const { user, mySequences, otherSequences } = loaderData;
  
  return (
    <div className="sequences-page" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem" }}>Brain Sequences</h1>
      
      {user && mySequences.length > 0 && (
        <section style={{ marginBottom: "3rem" }}>
          <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>My Sequences</h2>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
            gap: "1.5rem" 
          }}>
            {mySequences.map(sequence => (
              <SequenceCard key={sequence.id} sequence={sequence} isDraft={!!sequence.draft} />
            ))}
          </div>
        </section>
      )}
      
      {otherSequences.length > 0 && (
        <section>
          <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
            {user && mySequences.length > 0 ? "Other Sequences" : "Published Sequences"}
          </h2>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
            gap: "1.5rem" 
          }}>
            {otherSequences.map(sequence => (
              <SequenceCard key={sequence.id} sequence={sequence} isDraft={!!sequence.draft} />
            ))}
          </div>
        </section>
      )}
      
      {otherSequences.length === 0 && (!user || mySequences.length === 0) && (
        <p style={{ color: "#666", textAlign: "center", marginTop: "2rem" }}>
          No sequences available yet.
        </p>
      )}
    </div>
  );
}

function SequenceCard({ sequence, isDraft }: { sequence: any; isDraft: boolean }) {
  return (
    <Link 
      to={`/sequences/${sequence.id}`}
      style={{ textDecoration: "none" }}
    >
      <div className="sequence-card"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      }}
      >

        <h3 className="card-title">
          {sequence.title}
        </h3>
        {sequence.description && (
          <p style={{ 
            color: "#666", 
            fontSize: "0.9rem",
            lineHeight: "1.5",
            marginTop: "0.5rem",
          }}>
            {sequence.description.length > 100 
              ? sequence.description.substring(0, 100) + "..." 
              : sequence.description}
          </p>
        )}
                {isDraft && (
          <span className="draft-badge">
            DRAFT
          </span>
        )}
      </div>
    </Link>
  );
}
