require('@testing-library/jest-dom')

// Lightweight mock for firebase/firestore Timestamp used in tests
jest.mock('firebase/firestore', () => {
	return {
		Timestamp: {
			fromDate: (date) => ({
				toDate: () => date,
			}),
		},
	};
});