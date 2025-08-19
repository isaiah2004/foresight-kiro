# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Bonds form: Introduced comprehensive bond fields in `src/components/investments/investment-dialog.tsx` including Issuer, Face Value, Coupon Rate, Coupon Frequency, Maturity Date, Credit Rating, Yield to Maturity, Price Type (percent of par vs absolute), and Clean Price (%).
- Computation: When Price Type is "percent_of_par", the purchase price per bond is computed as Face Value × Clean Price (%) / 100.
- Edit Prefill: Existing bond investments now prefill these fields where available.
- Schema: Extended `bondDataSchema` in `src/lib/validations.ts` with couponFrequency, dayCountConvention, priceType, cleanPricePercent, callable/puttable, and firstCall/Put dates.
- Types: Mirrored new bond fields in `BondData` interface in `src/types/financial.ts`.
- Bond Table: Added `BondInvestmentTable` in `src/components/investments/bond-investment-table.tsx` with bond-specific columns (issuer, rating, coupon, frequency, maturity, face value, prices, units, value, gain/loss) and wired it for bonds in `investments-by-type.tsx`.
 - Skeletons: Updated `InvestmentsByTypeSkeleton` to adapt column layout for bonds and pass type from bonds page and component-level fallback.
 - Real Estate Table: Added `RealEstateInvestmentTable` in `src/components/investments/real-estate-investment-table.tsx` with property-specific columns (type, address, sqft, monthly rent, occupancy, prices, units, value, gain/loss) and wired it for real estate in `investments-by-type.tsx`. Updated real estate page Suspense fallback to pass `type="real_estate"` to the skeleton.
 - Income: Introduced `createIncomeFormSchema` and `updateIncomeFormSchema` in `src/lib/validations.ts` for client-side validation (string dates, numeric amount, currency code).
 - Income: Added `IncomePageSkeleton` in `src/components/income/income-page-skeleton.tsx` and table-row skeletons for loading states.

### Changed
- Investment dialog submit logic now maps flat bond fields into `bondData` for API payload while keeping core fields consistent with other instrument types.
 - Income Dialog UI improved: currency selector, Active toggle, and monthly equivalent preview; switched to client-side zod validation in submit handler; payload now sends `{ amount: { amount, currency } }`.
 - Income Management now shows a dedicated page skeleton while loading and keeps actions responsive.

### Fixed
 - Income raise flow now preserves currency when creating the new income record.

### Notes
- Day count convention is supported at the schema/type level; UI inputs for day count, callable/puttable, and first call/put dates can be added later based on needs.
