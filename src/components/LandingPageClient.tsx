"use client";

import { motion } from "framer-motion";
import { useAuth, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
	TrendingUp,
	Wallet,
	Target,
	Shield,
	Users,
	Star,
	CheckCircle,
	ArrowRight,
	DollarSign,
	PieChart,
	BarChart3,
	Calculator,
	Zap,
	Globe,
	Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";

// Animated background component with noisy gradients
const AnimatedBackground = () => (
	<div className="absolute inset-0 overflow-hidden">
		{/* Noisy gradient background */}
		<div
			className="absolute inset-0 opacity-20 dark:opacity-10"
			style={{
				background: `
					radial-gradient(circle at 20% 50%, hsl(var(--color-primary) / 0.15) 0%, transparent 50%),
					radial-gradient(circle at 80% 20%, hsl(var(--color-chart-1) / 0.15) 0%, transparent 50%),
					radial-gradient(circle at 40% 80%, hsl(var(--color-chart-4) / 0.15) 0%, transparent 50%),
					linear-gradient(45deg, hsl(var(--color-primary) / 0.05) 0%, hsl(var(--color-secondary) / 0.05) 100%)
				`,
				filter: 'url(#noise)'
			}}
		/>

		{/* Floating particles */}
		<motion.div
			className="absolute top-20 left-10 w-2 h-2 bg-primary rounded-full opacity-60"
			animate={{
				y: [0, -20, 0],
				opacity: [0.3, 0.8, 0.3],
			}}
			transition={{
				duration: 4,
				repeat: Infinity,
				ease: "easeInOut",
			}}
		/>
		<motion.div
			className="absolute top-40 right-20 w-1 h-1 bg-chart-1 rounded-full opacity-70"
			animate={{
				y: [0, -30, 0],
				opacity: [0.5, 1, 0.5],
			}}
			transition={{
				duration: 3,
				repeat: Infinity,
				ease: "easeInOut",
				delay: 1,
			}}
		/>
		<motion.div
			className="absolute bottom-32 left-1/3 w-1.5 h-1.5 bg-chart-4 rounded-full opacity-60"
			animate={{
				y: [0, -25, 0],
				opacity: [0.4, 1, 0.4],
			}}
			transition={{
				duration: 5,
				repeat: Infinity,
				ease: "easeInOut",
				delay: 2,
			}}
		/>

		{/* SVG Filter for noise effect */}
		<svg className="absolute inset-0 w-0 h-0">
			<defs>
				<filter id="noise">
					<feTurbulence baseFrequency="0.8" numOctaves="4" />
					<feDisplacementMap in="SourceGraphic" scale="20" />
				</filter>
			</defs>
		</svg>
	</div>
);

// Canvas-based interactive noisy gradient for the hero section
const InteractiveHeroBackground = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const rafRef = useRef<number | null>(null);
	const noiseCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const patternRef = useRef<CanvasPattern | null>(null);
	const posRef = useRef({ x: 0.5, y: 0.4 }); // smoothed position [0..1]
	const targetRef = useRef({ x: 0.5, y: 0.4 }); // target position [0..1]
	const scrollRef = useRef({ x: 0, y: 0 });

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

		// Resolve theme color tokens to CSS strings
		const getVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "hsl(0 0% 100%)";
		// Convert any CSS color (hsl/hsla with spaces or commas, rgb(a), hex) to a valid string with desired alpha
		const withAlpha = (color: string, a: number) => {
			const c = color.trim();
			if (!c) return `rgba(0,0,0,${a})`;
			// Transparent shortcut
			if (a === 0) return "rgba(0,0,0,0)";

			// HSL or HSLA
			if (/^hsla?\(/i.test(c)) {
				// Extract inside parentheses
				const inside = c.slice(c.indexOf("(") + 1, c.lastIndexOf(")")).trim();
				// Remove any existing alpha (handle both space+slash and 4th comma value)
				let noAlpha = inside
					.replace(/\/(.*)$/ , "") // drop slash alpha if present
					.replace(/,/g, " ") // normalize commas to spaces
					.replace(/\s+/g, " ")
					.trim();
				const parts = noAlpha.split(" ");
				const h = parts[0] ? parseFloat(parts[0]) : 0;
				const s = parts[1] ? parseFloat(parts[1]) : 0;
				const l = parts[2] ? parseFloat(parts[2]) : 0;
				return `hsla(${h}, ${s}%, ${l}%, ${a})`;
			}

			// RGB or RGBA
			if (/^rgba?\(/i.test(c)) {
				const nums = c.match(/\d+\.?\d*/g) || [];
				const r = nums[0] ? Number(nums[0]) : 0;
				const g = nums[1] ? Number(nums[1]) : 0;
				const b = nums[2] ? Number(nums[2]) : 0;
				return `rgba(${r}, ${g}, ${b}, ${a})`;
			}

			// Hex #rrggbb or #rgb
			if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)) {
				let r = 0, g = 0, b = 0;
				if (c.length === 4) {
					r = parseInt(c[1] + c[1], 16);
					g = parseInt(c[2] + c[2], 16);
					b = parseInt(c[3] + c[3], 16);
				} else {
					r = parseInt(c.slice(1, 3), 16);
					g = parseInt(c.slice(3, 5), 16);
					b = parseInt(c.slice(5, 7), 16);
				}
				return `rgba(${r}, ${g}, ${b}, ${a})`;
			}

			// Fallback: try appending alpha in CSS4 syntax if possible, else return as-is
			if (c.endsWith(")")) {
				return c.replace(/\)$/, ` / ${a})`);
			}
			return c;
		};

		// Create noise offscreen canvas + pattern
		const makeNoise = (size = 256) => {
			const off = document.createElement("canvas");
			off.width = size;
			off.height = size;
			const octx = off.getContext("2d")!;
			const img = octx.createImageData(size, size);
			for (let i = 0; i < img.data.length; i += 4) {
				const val = 200 + Math.random() * 55; // light-ish grain
				img.data[i] = val;
				img.data[i + 1] = val;
				img.data[i + 2] = val;
				img.data[i + 3] = 255;
			}
			octx.putImageData(img, 0, 0);
			return off;
		};

		const resize = () => {
			const parent = canvas.parentElement as HTMLElement | null;
			const rect = parent?.getBoundingClientRect();
			const width = Math.floor((rect?.width || window.innerWidth) * dpr);
			const height = Math.floor((rect?.height || 400) * dpr);
			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
			}
		};

		// Mouse move handling (normalized)
		const onMove = (e: MouseEvent) => {
			const parent = canvas.parentElement as HTMLElement | null;
			const rect = parent?.getBoundingClientRect();
			const x = rect ? (e.clientX - rect.left) / rect.width : e.clientX / window.innerWidth;
			const y = rect ? (e.clientY - rect.top) / rect.height : e.clientY / window.innerHeight;
			targetRef.current.x = Math.max(0, Math.min(1, x));
			targetRef.current.y = Math.max(0, Math.min(1, y));
		};

		// Initialize noise
		noiseCanvasRef.current = makeNoise(256);
		patternRef.current = ctx.createPattern(noiseCanvasRef.current, "repeat");

		let lastTime = 0;
		const render = (t: number) => {
			const width = canvas.width;
			const height = canvas.height;
			const w = width / dpr;
			const h = height / dpr;
			const now = t || 0;
			const dt = Math.min(33, now - lastTime);
			lastTime = now;

			// Smooth follow
			const k = 0.08; // smoothing factor
			posRef.current.x += (targetRef.current.x - posRef.current.x) * k;
			posRef.current.y += (targetRef.current.y - posRef.current.y) * k;

			// Scroll noise slowly
			scrollRef.current.x += dt * 0.015;
			scrollRef.current.y += dt * 0.01;

			// Fetch theme colors each frame for live theme switching
			const bg = getVar("--color-background");
			const primary = getVar("--color-primary");
			const chart1 = getVar("--color-chart-1");
			const chart4 = getVar("--color-chart-4");

			// Clear
			const ctx2d = ctx;
			ctx2d.save();
			ctx2d.setTransform(1, 0, 0, 1, 0, 0);
			ctx2d.scale(dpr, dpr);
			ctx2d.fillStyle = bg;
			ctx2d.fillRect(0, 0, w, h);

			// Radial gradients following mouse
			const cx = posRef.current.x * w;
			const cy = posRef.current.y * h;
			const r = Math.max(w, h) * 0.7;

			const g1 = ctx2d.createRadialGradient(cx, cy, 0, cx, cy, r);
			g1.addColorStop(0, withAlpha(primary, 0.55));
			g1.addColorStop(0.45, withAlpha(chart1, 0.35));
			g1.addColorStop(1, withAlpha(bg, 0));
			ctx2d.globalCompositeOperation = "lighter";
			ctx2d.fillStyle = g1;
			ctx2d.fillRect(0, 0, w, h);

			// Secondary gradient for depth (mirror)
			const mx = w - cx;
			const my = h - cy;
			const g2 = ctx2d.createRadialGradient(mx, my, 0, mx, my, r * 0.85);
			g2.addColorStop(0, withAlpha(chart4, 0.35));
			g2.addColorStop(0.6, withAlpha(primary, 0.25));
			g2.addColorStop(1, withAlpha(bg, 0));
			ctx2d.fillStyle = g2;
			ctx2d.fillRect(0, 0, w, h);

			// Reset composite for noise
			ctx2d.globalCompositeOperation = "source-over";

			// Noise overlay
			if (patternRef.current) {
				ctx2d.save();
				ctx2d.globalAlpha = document.documentElement.classList.contains("dark") ? 0.06 : 0.08;
				ctx2d.translate(-scrollRef.current.x % 256, -scrollRef.current.y % 256);
				ctx2d.fillStyle = patternRef.current as CanvasPattern;
				ctx2d.fillRect(-256, -256, w + 512, h + 512);
				ctx2d.restore();
			}

			ctx2d.restore();
			rafRef.current = requestAnimationFrame(render);
		};

		const onResize = () => {
			resize();
		};

		resize();
		window.addEventListener("mousemove", onMove, { passive: true });
		window.addEventListener("resize", onResize);
		rafRef.current = requestAnimationFrame(render);

		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("resize", onResize);
		};
	}, []);

	return (
		<div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden rounded-3xl">
			<canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />
		</div>
	);
};

export default function LandingPageClient() {
	const { isSignedIn } = useAuth();
	const router = useRouter();

	const handleGetStarted = () => {
		if (isSignedIn) {
			router.push("/dashboard");
		}
		// If not signed in, the SignUpButton modal will handle the authentication
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 relative pt-20">
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-md focus:bg-background focus:text-foreground focus:shadow"
			>
				Skip to content
			</a>
			<AnimatedBackground />

			{/* Navigation */}
			<motion.nav
				initial={{ y: -100, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.8, ease: "easeOut" }}
				className="fixed top-0 inset-x-0 z-50"
			>
				<div className="mx-auto max-w-7xl px-6">
					<div className="mt-2 rounded-xl border border-border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
						<div className="h-14 px-4 flex items-center justify-between">
							<motion.div whileHover={{ scale: 1.05 }} className="text-2xl font-bold text-primary">
								Foresight
							</motion.div>
							<div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
								<a href="#features" className="hover:text-foreground">Features</a>
								<a href="#pricing" className="hover:text-foreground">Pricing</a>
								<a href="#reviews" className="hover:text-foreground">Reviews</a>
							</div>
							<div className="flex items-center gap-2">
								<ThemeToggle />
								<SignInButton mode="modal">
									<Button variant="ghost" className="text-muted-foreground hover:text-primary">
										Sign In
									</Button>
								</SignInButton>
								<SignUpButton mode="modal">
									<Button className="bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 text-primary-foreground">
										Get Started
									</Button>
								</SignUpButton>
							</div>
						</div>
					</div>
				</div>
			</motion.nav>

			{/* Hero Section */}
			<section id="main-content" role="main" className="relative z-10 px-6 py-20">
				<InteractiveHeroBackground />
				<div className="max-w-7xl mx-auto text-center relative z-10">
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
					>
						<h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-chart-1 to-chart-4 bg-clip-text text-transparent">
							Take Control of Your
							<br />
							<span className="bg-gradient-to-r from-chart-4 via-chart-1 to-primary bg-clip-text text-transparent">
								Financial Future
							</span>
						</h1>
						<p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
							Empower your financial journey with intelligent planning, real-time insights, and the power of compound growth. Make every decision count.
						</p>
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.6 }}
							className="flex flex-col sm:flex-row gap-4 justify-center items-center"
						>
							{isSignedIn ? (
								<Button
									onClick={handleGetStarted}
									size="lg"
									className="group bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 text-primary-foreground px-8 py-4 text-lg font-semibold"
								>
									Go to Dashboard
									<ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
								</Button>
							) : (
								<SignUpButton mode="modal">
									<Button
										size="lg"
										className="group bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 text-primary-foreground px-8 py-4 text-lg font-semibold"
									>
										Start Your Journey
										<ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
									</Button>
								</SignUpButton>
							)}
							<Button
								variant="outline"
								size="lg"
								className="group border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 text-lg font-semibold"
							>
								Watch Demo
								<Zap className="w-5 h-5 ml-2" />
							</Button>
						</motion.div>
					</motion.div>
				</div>
			</section>

			<div className="px-6">
				<div className="max-w-7xl mx-auto">
					<Separator className="my-2" />
				</div>
			</div>

			{/* Overview Section */}
			<section id="features" className="relative z-10 px-6 py-20 bg-secondary/5 backdrop-blur-sm">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
							Your Complete Financial Ecosystem
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							From tracking every penny to visualizing your wealth growth, Foresight provides the tools and insights you need to build lasting financial freedom.
						</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{[
							{
								icon: TrendingUp,
								title: "Investment Portfolio",
								description: "Track stocks, bonds, mutual funds, crypto, and real estate in one unified dashboard.",
								features: ["Real-time tracking", "Performance analytics", "Risk assessment"]
							},
							{
								icon: Wallet,
								title: "Income & Expenses",
								description: "Comprehensive cash flow management with intelligent categorization and insights.",
								features: ["Auto-categorization", "Budget optimization", "Spending trends"]
							},
							{
								icon: Target,
								title: "Financial Goals",
								description: "Set, track, and achieve your financial objectives with personalized roadmaps.",
								features: ["Goal planning", "Progress tracking", "Milestone alerts"]
							}
						].map((item, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 50 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: index * 0.2 }}
								viewport={{ once: true }}
								whileHover={{ y: -5, scale: 1.02 }}
							>
								<Card className="h-full hover:shadow-lg transition-all duration-300">
									<CardHeader>
										<div className="w-12 h-12 bg-gradient-to-r from-primary to-chart-1 rounded-xl flex items-center justify-center mb-4">
											<item.icon className="w-6 h-6 text-primary-foreground" />
										</div>
										<CardTitle className="text-2xl">{item.title}</CardTitle>
									</CardHeader>
									<CardContent>
										<CardDescription className="mb-6 text-base leading-relaxed">
											{item.description}
										</CardDescription>
										<ul className="space-y-2">
											{item.features.map((feature, idx) => (
												<li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
													<CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
													{feature}
												</li>
											))}
										</ul>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Highlights Section */}
			<section className="relative z-10 px-6 py-20">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-chart-4 to-primary bg-clip-text text-transparent">
							Why Choose Foresight?
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							Built by financial experts for everyday people who want to take control of their money.
						</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
						<motion.div
							initial={{ opacity: 0, x: -50 }}
							whileInView={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.8 }}
							viewport={{ once: true }}
							className="space-y-8"
						>
							{[
								{
									icon: Shield,
									title: "Secure & Private",
									description: "Bank-level security with end-to-end encryption. Your financial data is completely protected."
								},
								{
									icon: Calculator,
									title: "Intelligent Insights",
									description: "AI-powered analysis provides personalized recommendations for better financial decisions."
								},
								{
									icon: Globe,
									title: "Multi-Currency Support",
									description: "Track investments and expenses in multiple currencies with real-time exchange rates."
								},
								{
									icon: PieChart,
									title: "Visual Analytics",
									description: "Beautiful charts and graphs make complex financial data easy to understand at a glance."
								}
							].map((item, index) => (
								<motion.div
									key={index}
									initial={{ opacity: 0, x: -30 }}
									whileInView={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.6, delay: index * 0.1 }}
									viewport={{ once: true }}
									className="flex gap-4"
								>
									<div className="w-12 h-12 bg-gradient-to-r from-primary to-chart-1 rounded-xl flex items-center justify-center flex-shrink-0">
										<item.icon className="w-6 h-6 text-primary-foreground" />
									</div>
									<div>
										<h3 className="text-xl font-bold mb-2 text-foreground">{item.title}</h3>
										<p className="text-muted-foreground">{item.description}</p>
									</div>
								</motion.div>
							))}
						</motion.div>

						<motion.div
							initial={{ opacity: 0, x: 50 }}
							whileInView={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.8 }}
							viewport={{ once: true }}
							className="relative"
						>
							<div className="bg-gradient-to-br from-primary via-chart-1 to-chart-4 rounded-3xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
								<Card className="shadow-2xl">
									<CardHeader>
										<div className="flex items-center gap-4">
											<div className="w-12 h-12 bg-gradient-to-r from-primary to-chart-1 rounded-xl flex items-center justify-center">
												<PieChart className="w-6 h-6 text-primary-foreground" />
											</div>
											<div>
												<CardTitle className="text-foreground">Portfolio Overview</CardTitle>
												<p className="text-sm text-muted-foreground">Last updated: Today</p>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											<div className="flex justify-between">
												<span className="text-muted-foreground">Total Value</span>
												<span className="font-bold text-primary">$127,450</span>
											</div>
											<div className="flex justify-between">
												<span className="text-muted-foreground">Today&rsquo;s Change</span>
												<Badge variant="outline" className="text-positive border-positive">+2.4%</Badge>
											</div>
										</div>
									</CardContent>
								</Card>
							</div>
						</motion.div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="tools" className="relative z-10 px-6 py-20 bg-secondary/5 backdrop-blur-sm">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-chart-1 to-chart-4 bg-clip-text text-transparent">
							Comprehensive Financial Tools
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							Everything you need to manage your finances effectively, from basic budgeting to advanced portfolio management.
						</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{[
							{ icon: DollarSign, title: "Income Tracking", description: "Monitor all income sources and analyze earning patterns" },
							{ icon: BarChart3, title: "Expense Analysis", description: "Categorize spending and identify optimization opportunities" },
							{ icon: Target, title: "Goal Setting", description: "Define and track financial objectives with precision" },
							{ icon: Shield, title: "Risk Assessment", description: "Evaluate investment risk and optimize portfolio allocation" },
							{ icon: Calculator, title: "Tax Planning", description: "Plan ahead for tax obligations and maximize savings" },
							{ icon: TrendingUp, title: "Market Insights", description: "Stay informed with real-time market data and trends" },
							{ icon: Lock, title: "Secure Storage", description: "Bank-level encryption for all your financial data" },
							{ icon: Users, title: "Expert Community", description: "Learn from financial experts and fellow users" }
						].map((feature, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: index * 0.1 }}
								viewport={{ once: true }}
								whileHover={{ y: -5, scale: 1.05 }}
							>
								<Card className="text-center h-full hover:shadow-lg transition-all duration-300">
									<CardHeader>
										<div className="w-12 h-12 bg-gradient-to-r from-primary to-chart-1 rounded-xl flex items-center justify-center mx-auto mb-4">
											<feature.icon className="w-6 h-6 text-primary-foreground" />
										</div>
										<CardTitle className="text-lg">{feature.title}</CardTitle>
									</CardHeader>
									<CardContent>
										<CardDescription className="text-sm">{feature.description}</CardDescription>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Pricing Section */}
			<section id="pricing" className="relative z-10 px-6 py-20">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-chart-4 bg-clip-text text-transparent">
							Simple, Transparent Pricing
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							Start free and scale as you grow. No hidden fees, no surprise charges.
						</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
						{[
							{
								name: "Starter",
								price: "Free",
								description: "Perfect for getting started with personal finance",
								features: ["Basic income/expense tracking", "Simple budgeting", "Goal setting", "Mobile app access"],
								popular: false
							},
							{
								name: "Professional",
								price: "$9.99/month",
								description: "Advanced tools for serious financial planning",
								features: ["Investment portfolio tracking", "Advanced analytics", "Tax planning tools", "Priority support", "Multi-currency support"],
								popular: true
							},
							{
								name: "Enterprise",
								price: "$29.99/month",
								description: "Complete financial management suite",
								features: ["Everything in Professional", "Custom reporting", "API access", "Dedicated support", "Advanced risk analysis", "White-label options"],
								popular: false
							}
						].map((plan, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 50 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: index * 0.2 }}
								viewport={{ once: true }}
								whileHover={{ y: -10 }}
								className="relative"
							>
								<Card className={`h-full transition-all duration-300 ${
									plan.popular
										? 'border-primary shadow-lg scale-105'
										: 'hover:border-primary/50'
								}`}>
									{plan.popular && (
										<div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
											<Badge className="bg-gradient-to-r from-primary to-chart-1 text-primary-foreground">
												Most Popular
											</Badge>
										</div>
									)}
									<CardHeader className="text-center">
										<CardTitle className="text-2xl">{plan.name}</CardTitle>
										<div className="text-4xl font-bold text-primary mb-2">{plan.price}</div>
										<CardDescription className="text-base">{plan.description}</CardDescription>
									</CardHeader>
									<CardContent>
										<ul className="space-y-3 mb-8">
											{plan.features.map((feature, idx) => (
												<li key={idx} className="flex items-center gap-3">
													<CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
													<span className="text-muted-foreground text-sm">{feature}</span>
												</li>
											))}
										</ul>
										{isSignedIn ? (
											<Button
												onClick={handleGetStarted}
												className={`w-full ${
													plan.popular
														? 'bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 text-primary-foreground'
														: ''
												}`}
												variant={plan.popular ? "default" : "outline"}
											>
												Go to Dashboard
											</Button>
										) : (
											<SignUpButton mode="modal">
												<Button
													className={`w-full ${
														plan.popular
															? 'bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 text-primary-foreground'
															: ''
													}`}
													variant={plan.popular ? "default" : "outline"}
												>
													Get Started
												</Button>
											</SignUpButton>
										)}
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Reviews Section */}
			<section id="reviews" className="relative z-10 px-6 py-20 bg-secondary/5 backdrop-blur-sm">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-chart-4 to-primary bg-clip-text text-transparent">
							What Our Users Say
						</h2>
						<p className="text-xl text-muted-foreground max-w-3xl mx-auto">
							Join thousands of users who have transformed their financial lives with Foresight.
						</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{[
							{
								name: "Sarah Johnson",
								role: "Small Business Owner",
								content: "Foresight helped me understand my cash flow like never before. The insights are incredible!",
								rating: 5,
								avatar: "SJ"
							},
							{
								name: "Michael Chen",
								role: "Software Engineer",
								content: "The investment tracking is phenomenal. I've never been more confident in my portfolio decisions.",
								rating: 5,
								avatar: "MC"
							},
							{
								name: "Emily Rodriguez",
								role: "Teacher",
								content: "Finally, a finance app that's both powerful and easy to use. My savings have increased significantly!",
								rating: 5,
								avatar: "ER"
							}
						].map((review, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: index * 0.2 }}
								viewport={{ once: true }}
							>
								<Card className="h-full">
									<CardHeader>
										<div className="flex items-center mb-4">
											<Avatar className="mr-4">
												<AvatarFallback className="bg-gradient-to-r from-primary to-chart-1 text-primary-foreground font-bold">
													{review.avatar}
												</AvatarFallback>
											</Avatar>
											<div>
												<CardTitle className="text-base">{review.name}</CardTitle>
												<CardDescription>{review.role}</CardDescription>
											</div>
										</div>
										<div className="flex mb-4">
											{[...Array(review.rating)].map((_, i) => (
												<Star key={i} className="w-5 h-5 text-warning fill-current" />
											))}
										</div>
									</CardHeader>
									<CardContent>
										<p className="text-muted-foreground italic">&ldquo;{review.content}&rdquo;</p>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="relative z-10 px-6 py-20">
				<div className="max-w-4xl mx-auto text-center">
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
						className="relative"
					>
						<div className="absolute inset-0 bg-gradient-to-r from-primary via-chart-1 to-chart-4 rounded-3xl opacity-90"></div>
						<div
							className="absolute inset-0 rounded-3xl opacity-20"
							style={{
								background: `
									radial-gradient(circle at 20% 50%, hsl(var(--color-primary) / 0.3) 0%, transparent 50%),
									radial-gradient(circle at 80% 20%, hsl(var(--color-chart-1) / 0.3) 0%, transparent 50%),
									radial-gradient(circle at 40% 80%, hsl(var(--color-chart-4) / 0.3) 0%, transparent 50%)
								`,
								filter: 'url(#noise)'
							}}
						/>
						<div className="relative z-10 p-12 text-primary-foreground">
							<h2 className="text-4xl md:text-5xl font-bold mb-6">
								Ready to Transform Your Financial Future?
							</h2>
							<p className="text-xl mb-8 opacity-90">
								Join Foresight today and take the first step towards financial freedom.
							</p>
							{isSignedIn ? (
								<Button
									onClick={handleGetStarted}
									size="lg"
									className="bg-background text-primary hover:bg-background/90 px-8 py-4 text-lg font-semibold"
								>
									Go to Dashboard
								</Button>
							) : (
								<SignUpButton mode="modal">
									<Button
										size="lg"
										className="bg-background text-primary hover:bg-background/90 px-8 py-4 text-lg font-semibold"
									>
										Start Your Journey Today
									</Button>
								</SignUpButton>
							)}
						</div>
					</motion.div>
				</div>
			</section>

			{/* Footer */}
			<footer className="relative z-10 px-6 py-12 bg-secondary/5 border-t border-border">
				<div className="max-w-7xl mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						<div>
							<h3 className="text-2xl font-bold text-primary mb-4">
								Foresight
							</h3>
							<p className="text-muted-foreground mb-4">
								Empowering everyday people to take control of their financial future.
							</p>
							<div className="flex space-x-4">
								{/* Social media icons would go here */}
							</div>
						</div>
						<div>
							<h4 className="font-bold text-foreground mb-4">Product</h4>
							<ul className="space-y-2 text-muted-foreground">
								<li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
								<li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
								<li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
								<li><a href="#" className="hover:text-primary transition-colors">API</a></li>
							</ul>
						</div>
						<div>
							<h4 className="font-bold text-foreground mb-4">Company</h4>
							<ul className="space-y-2 text-muted-foreground">
								<li><a href="#" className="hover:text-primary transition-colors">About</a></li>
								<li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
								<li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
								<li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
							</ul>
						</div>
						<div>
							<h4 className="font-bold text-foreground mb-4">Support</h4>
							<ul className="space-y-2 text-muted-foreground">
								<li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
								<li><a href="#" className="hover:text-primary transition-colors">Community</a></li>
								<li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
								<li><a href="#" className="hover:text-primary transition-colors">Terms</a></li>
							</ul>
						</div>
					</div>
					<div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
						<p>&copy; 2024 Foresight. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
