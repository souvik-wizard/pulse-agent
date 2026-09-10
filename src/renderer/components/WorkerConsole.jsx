
export default function WorkerConsole({ lines, running, consoleRef }) {
  return (
    <>
      <div className="section-title">stdout output</div>
      <div className="console-output" ref={consoleRef} id="worker-console">
        {lines.length === 0 ? (
          <div className="console-empty">
            {running ? 'Waiting for output…' : 'Start the worker to see output here.'}
          </div>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="console-line">{line}</div>
          ))
        )}
      </div>
    </>
  );
}
