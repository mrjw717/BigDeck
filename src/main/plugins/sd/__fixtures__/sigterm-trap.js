// ============================================================================
// SIGTERM-trap fixture — a plugin process that IGNORES SIGTERM.
//
// Used by SDPluginProcess tests to pin the quit-time orphaning regression:
// stop() must escalate to SIGKILL after the grace period and resolve only
// once the child is actually dead — a plugin trapping SIGTERM must never
// outlive BigDeck's exit.
// ============================================================================

process.on("SIGTERM", () => {
  // Trap: node's default SIGTERM termination is suppressed; only SIGKILL
  // can end this process.
});

// Readiness marker: a SIGTERM arriving BEFORE this line still kills us with
// the default disposition (the trap only exists once node boots and runs the
// handler above). Tests must wait for this marker before calling stop() so
// the SIGKILL escalation path is actually exercised.
console.error("sigterm-trap-ready");

// Stay alive until SIGKILLed.
setInterval(() => {}, 1 << 30);
