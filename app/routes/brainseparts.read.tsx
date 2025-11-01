import React, { useEffect, useState } from 'react';

export default function ReadBrainpart() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/brainparts?id=${id}`).then(r => r.json()).then(d => setData(d));
  }, [id]);

  if (!id) return <div>No id provided</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h2>{data.title} (#{data.id})</h2>
      <p>{data.description}</p>
      <p>is_part_of: {data.is_part_of}</p>
      <div>
        <a href="/brainparts/update?id={id}">Edit</a>
        <a style={{ marginLeft: 8 }} href="/brainparts">Back</a>
      </div>
    </div>
  );
}
