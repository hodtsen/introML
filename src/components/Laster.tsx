export default function Laster({ tekst = "Laster inn …" }: { tekst?: string }) {
  return (
    <div className="laster" role="status" aria-live="polite">
      <span className="laster-prikk" aria-hidden="true" />
      {tekst}
    </div>
  );
}
