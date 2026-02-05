import type { Route } from "./+types/sequences";
import { Link } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  // Dynamic imports to ensure server code stays on server
  const { getCurrentUser } = await import("~/server/auth.server");
  const { getPublishedSequences, getMySequences } = await import("~/server/db-drizzle.server");
  
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

const plusButtonJSX = <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <Link to="/sequences/new" className="btn-primary add-sequence">
             + 
          </Link>
        </div>

export default function Sequences({ loaderData }: Route.ComponentProps) {
  const { user, mySequences, otherSequences } = loaderData;
  
  return (
    <div className="sequences-page" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem" }}>Brain Sequences </h1>
      
      
      {user && mySequences.length > 0 && (
        <section id="my-sequences" style={{ marginBottom: "3rem" }}>
          <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>My Sequences</h2>
          <div className="sequence-list">
            { plusButtonJSX }
            {mySequences.map(sequence => (
              <SequenceCard key={sequence.id} sequence={sequence} isDraft={!!sequence.draft} />
            ))}
          </div>
        </section>
      )}
      
      {otherSequences.length > 0 && (
        <section>
          {user && mySequences.length > 0 && 
            <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
              Published Sequences
            </h2>
          }
          <div className="sequence-list">
            {user && mySequences.length === 0 && plusButtonJSX }
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
    id="sequence-card-link"
      to={`/sequences/${sequence.id}`}
      style={{ textDecoration: "none" }}
    >
      <div className="sequence-card">

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
