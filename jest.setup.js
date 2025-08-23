require('@testing-library/jest-dom')

// Provide a minimal Timestamp polyfill only if not provided by firebase/firestore during tests
try {
	const { Timestamp } = require('firebase/firestore');
	if (!Timestamp || typeof Timestamp.fromDate !== 'function') {
		global.Timestamp = {
			fromDate: (date) => ({ toDate: () => date }),
			now: () => ({ toDate: () => new Date() }),
		};
	}
} catch (_) {
	// If firebase/firestore isn't available in the test env, create a lightweight shim
	global.Timestamp = {
		fromDate: (date) => ({ toDate: () => date }),
		now: () => ({ toDate: () => new Date() }),
	};
}

// Polyfill ResizeObserver for libraries like recharts in jsdom
if (typeof global.ResizeObserver === 'undefined') {
	class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
	// @ts-ignore
	global.ResizeObserver = ResizeObserver;
}