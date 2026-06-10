export default function LastUpdated({ updatedAt, loading }) {
  if (!updatedAt) {
    return null;
  }

  return (
    <p className="last-updated">
      {loading ? "Refreshing..." : `Last updated ${updatedAt.toLocaleTimeString()}`}
    </p>
  );
}
