/* A line everyone from the hills knows, plus what it actually says.
   Teaching is a better use of the space than a decorative pull quote. */
export default function LineCard({ line, turning }) {
  if (!line) return null;
  return (
    <figure class={`line${turning ? ' is-turning' : ''}`}>
      <blockquote>{`“${line.text}”`}</blockquote>
      <figcaption>
        {line.meaning}
        <b>{line.src}</b>
      </figcaption>
    </figure>
  );
}
