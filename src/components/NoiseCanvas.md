# NoiseCanvas Component

A customizable animated canvas component that creates beautiful noisy gradient backgrounds with interactive mouse-following effects.

## Features

- **Mouse Following**: Interactive gradients that follow the mouse cursor (can be disabled)
- **Customizable Colors**: Full control over primary, secondary, tertiary, and background colors
- **Animation Controls**: Adjust speeds, smoothing, and noise scrolling
- **Gradient Controls**: Control intensity, radius, and positioning
- **Noise Effects**: Customize noise texture opacity, size, brightness, and variance
- **Performance Options**: Device pixel ratio limits and optimization settings
- **Theme Support**: Automatic dark/light theme detection and CSS variable support

## Basic Usage

```tsx
import { NoiseCanvas } from "@/components/NoiseCanvas";

// Simple usage with defaults
<NoiseCanvas />

// With custom colors
<NoiseCanvas
  primaryColor="#ff6b6b"
  secondaryColor="#4ecdc4" 
  tertiaryColor="#45b7d1"
  backgroundColor="#1a1a2e"
/>
```

## Props Reference

### Canvas Settings
- `className?: string` - CSS classes for the container (default: `"absolute inset-0 -z-10 pointer-events-none overflow-hidden rounded-3xl"`)

### Color Controls
- `primaryColor?: string` - Primary gradient color (default: `"hsl(var(--color-primary))"`)
- `secondaryColor?: string` - Secondary gradient color (default: `"hsl(var(--color-chart-1))"`)
- `tertiaryColor?: string` - Tertiary gradient color (default: `"hsl(var(--color-chart-4))"`)
- `backgroundColor?: string` - Background color (default: `"hsl(var(--color-background))"`)

**Note**: Colors support CSS variables, HSL, RGB, HEX, and direct CSS color values.

### Animation Controls
- `followMouse?: boolean` - Whether gradients follow mouse movement (default: `true`)
- `smoothingFactor?: number` - Mouse following smoothness, 0-1 (default: `0.08`)
- `scrollSpeedX?: number` - Horizontal noise scroll speed (default: `0.015`)
- `scrollSpeedY?: number` - Vertical noise scroll speed (default: `0.01`)

### Gradient Controls
- `gradientIntensity?: number` - Overall gradient opacity multiplier (default: `1.0`)
- `gradientRadius?: number` - Primary gradient radius multiplier (default: `0.7`)
- `secondaryGradientRadius?: number` - Secondary gradient radius multiplier (default: `0.85`)

### Noise Controls
- `noiseOpacity?: number` - Noise texture opacity (default: `0.08`)
- `noiseSize?: number` - Size of noise texture in pixels (default: `256`)
- `noiseBrightness?: number` - Base brightness of noise (default: `200`)
- `noiseVariance?: number` - Random brightness variance (default: `55`)

### Performance Controls
- `maxDevicePixelRatio?: number` - Maximum pixel ratio for performance (default: `2`)

### Position Controls (when followMouse is false)
- `staticX?: number` - Static X position, 0-1 (default: `0.5`)
- `staticY?: number` - Static Y position, 0-1 (default: `0.4`)

## Examples

### Hero Section Background
```tsx
<section className="relative h-screen">
  <NoiseCanvas />
  <div className="relative z-10">
    <h1>Your Content Here</h1>
  </div>
</section>
```

### Static Positioned Background
```tsx
<NoiseCanvas
  followMouse={false}
  staticX={0.3}
  staticY={0.7}
  gradientIntensity={0.8}
/>
```

### Custom Color Scheme
```tsx
<NoiseCanvas
  primaryColor="#ff0080"
  secondaryColor="#00ff80"
  tertiaryColor="#8000ff"
  backgroundColor="#000011"
  gradientIntensity={1.2}
/>
```

### High Performance / Subtle Effect
```tsx
<NoiseCanvas
  gradientIntensity={0.3}
  noiseOpacity={0.04}
  scrollSpeedX={0.005}
  scrollSpeedY={0.003}
  maxDevicePixelRatio={1}
  smoothingFactor={0.05}
/>
```

### Vibrant/Intense Effect
```tsx
<NoiseCanvas
  gradientIntensity={2.0}
  noiseOpacity={0.15}
  scrollSpeedX={0.05}
  scrollSpeedY={0.03}
  smoothingFactor={0.15}
  noiseBrightness={150}
  noiseVariance={100}
/>
```

## Pre-made Variants

The component also exports some pre-configured variants:

```tsx
import { 
  NoiseCanvasHero,
  NoiseCanvasSubtle,
  NoiseCanvasVibrant,
  NoiseCanvasStatic
} from "@/components/NoiseCanvasExamples";

// Hero section optimized
<NoiseCanvasHero />

// Subtle background effect
<NoiseCanvasSubtle />

// Vibrant/intense effect  
<NoiseCanvasVibrant />

// Static positioned
<NoiseCanvasStatic x={0.3} y={0.6} />
```

## CSS Variable Integration

The component automatically detects CSS variables in your theme:

```css
:root {
  --color-primary: 210 100% 50%;
  --color-chart-1: 160 60% 50%;
  --color-chart-4: 280 80% 60%;
  --color-background: 0 0% 100%;
}

.dark {
  --color-background: 0 0% 3%;
}
```

Use them like:
```tsx
<NoiseCanvas
  primaryColor="hsl(var(--color-primary))"
  backgroundColor="hsl(var(--color-background))"
/>
```

## Performance Notes

- The component automatically adjusts to device pixel ratio for optimal performance
- Use `maxDevicePixelRatio={1}` on lower-end devices
- Lower `noiseSize` (e.g., 128) for better performance
- Reduce `gradientIntensity` and `noiseOpacity` for subtle effects that perform better

## Dark/Light Theme Support

The component automatically detects dark mode via the `dark` class on `document.documentElement` and adjusts noise opacity accordingly. Dark mode gets ~25% lower noise opacity for better contrast.
