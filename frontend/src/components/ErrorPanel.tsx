/** Check 8: every failed chain read renders one of these — never a blank view or endless spinner. */
export function ErrorPanel({
  title = "Couldn't read the chain",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-panel" role="alert">
      <strong>{title}</strong>
      <p>{message ?? "The RPC didn't answer. Hostel Wi-Fi strikes again?"}</p>
      {onRetry && (
        <button className="btn" onClick={onRetry} type="button">
          Retry
        </button>
      )}
    </div>
  );
}
