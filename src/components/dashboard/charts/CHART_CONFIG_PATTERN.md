# Chart Configuration Pattern - IMPORTANT REFERENCE

## ⚠️ COMMON MISTAKE TO AVOID

This mistake appears very often when creating or modifying chart components. Always follow this exact pattern.

## ✅ CORRECT PATTERN

```tsx
const chartConfig = {
  seriesName: {
    label: "Series Label",
    color: "var(--color-chart-1)", // ✅ CORRECT: Use var() with --color-chart-N format
  },
  anotherSeries: {
    label: "Another Series",
    color: "var(--color-chart-2)", // ✅ CORRECT: Sequential numbering
  },
};
```

## ❌ WRONG PATTERNS (DO NOT USE)

```tsx
// ❌ WRONG: Using hsl() wrapper
const chartConfig = {
  series: {
    label: "Series",
    color: "hsl(var(--chart-1))", // ❌ NO hsl() wrapper
  },
};

// ❌ WRONG: Using old --chart-N format
const chartConfig = {
  series: {
    label: "Series", 
    color: "var(--chart-1)", // ❌ Missing 'color-' prefix
  },
};

// ❌ WRONG: Using theme colors directly
const chartConfig = {
  series: {
    label: "Series",
    color: "hsl(var(--destructive))", // ❌ Use chart colors, not theme colors
  },
};
```

## 📋 COMPLETE IMPLEMENTATION CHECKLIST

1. **chartConfig Object Structure:**
   ```tsx
   const chartConfig = {
     dataKey1: {
       label: "Display Name",
       color: "var(--color-chart-1)",
     },
     dataKey2: {
       label: "Display Name",
       color: "var(--color-chart-2)",
     },
     // ... more series
   };
   ```

2. **Pass to ChartContainer:**
   ```tsx
   <ChartContainer config={chartConfig} className="h-[300px]">
   ```

3. **Reference in Chart Components:**
   ```tsx
   <Line
     stroke={chartConfig.dataKey1.color}
     // ... other props
   />
   ```

4. **Use in Tooltips:**
   ```tsx
   <p style={{ color: entry.color }}>
     {entry.name}: <CurrencyDisplay amount={entry.value} />
   </p>
   ```

## 🎨 COLOR SEQUENCE

Always use sequential numbering for consistency:
- First series: `"var(--color-chart-1)"`
- Second series: `"var(--color-chart-2)"`
- Third series: `"var(--color-chart-3)"`
- Fourth series: `"var(--color-chart-4)"`
- And so on...

## 📁 REFERENCE IMPLEMENTATION

See `monthly-spending-chart.tsx` for the correct implementation example.

## 🔄 MIGRATION FROM OLD PATTERN

If you find charts using the old pattern, update them:

```tsx
// OLD (wrong)
color: "hsl(var(--chart-1))"

// NEW (correct)
color: "var(--color-chart-1)"
```

---

**Remember:** This pattern ensures proper theming and color management across all chart components!
