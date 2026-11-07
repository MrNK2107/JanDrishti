import '@testing-library/jest-dom'

/**
 * Collapse the mock backend's simulated latency for tests.
 *
 * The UI must handle latency — that is why it is simulated in the first place —
 * but a suite making a few hundred sequential API calls does not need to wait
 * for each one. The *presence* of asynchronous behaviour is what is under test,
 * not its duration.
 */
globalThis.__JDT_FAST__ = true
