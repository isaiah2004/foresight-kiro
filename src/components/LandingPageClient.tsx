"use client";

import { motion, useScroll, useTransform, AnimatePresence, useSpring } from "framer-motion";
import { useAuth, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
	Lock,
	Sparkles,
	Eye,
	MousePointer,
	Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
// import { Separator } from "@/components/ui/separator";
// import { NoiseCanvas } from "@/components/NoiseCanvas";
import { HeroGradient, SectionGradient, SubtleGradient } from "@/components/NoiseCanvasExamples";

// Enhanced Animated Background - CLIENT SIDE ONLY to prevent hydration issues
const EnhancedAnimatedBackground = () => {
	const [mounted, setMounted] = useState(false);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

	useEffect(() => {
		setMounted(true);

		const handleMouseMove = (e: MouseEvent) => {
			setMousePos({ x: e.clientX, y: e.clientY });
		};
		
		window.addEventListener('mousemove', handleMouseMove);
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, []);

	// Don't render dynamic content until mounted on client
	if (!mounted) {
		return (
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute inset-0 opacity-20 dark:opacity-10 bg-gradient-to-br from-primary/5 via-transparent to-chart-1/5" />
			</div>
		);
	}

	return (
		<div className="absolute inset-0 overflow-hidden pointer-events-none">
			{/* Enhanced gradient background that works with constellation */}
			<div
				className="absolute inset-0 opacity-20 dark:opacity-10 transition-all duration-1000"
				style={{
					background: `
						radial-gradient(circle at ${mousePos.x * 0.1}% ${mousePos.y * 0.1}%, hsl(var(--color-primary) / 0.08) 0%, transparent 50%),
						radial-gradient(circle at 20% 50%, hsl(var(--color-chart-1) / 0.06) 0%, transparent 70%),
						radial-gradient(circle at 80% 20%, hsl(var(--color-chart-4) / 0.06) 0%, transparent 70%),
						radial-gradient(circle at 40% 80%, hsl(var(--color-chart-2) / 0.06) 0%, transparent 70%)
					`,
				}}
			/>

			{/* Floating orbs that complement the background */}
			<motion.div
				className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-primary/5 to-chart-1/5 blur-2xl"
				animate={{
					x: mousePos.x * 0.015,
					y: mousePos.y * 0.015,
					scale: [1, 1.2, 1],
				}}
				transition={{
					x: { type: "spring", stiffness: 50, damping: 20 },
					y: { type: "spring", stiffness: 50, damping: 20 },
					scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
				}}
				style={{
					left: "15%",
					top: "25%",
				}}
			/>
			<motion.div
				className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-chart-4/5 to-chart-2/5 blur-3xl"
				animate={{
					x: mousePos.x * -0.02,
					y: mousePos.y * -0.02,
					scale: [1, 1.1, 1],
				}}
				transition={{
					x: { type: "spring", stiffness: 30, damping: 25 },
					y: { type: "spring", stiffness: 30, damping: 25 },
					scale: { duration: 6, repeat: Infinity, ease: "easeInOut" }
				}}
				style={{
					right: "20%",
					bottom: "30%",
				}}
			/>
			
			{/* Additional ambient orbs */}
			<motion.div
				className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-chart-1/4 to-primary/4 blur-xl"
				animate={{
					x: mousePos.x * 0.01,
					y: mousePos.y * 0.01,
					rotate: 360,
				}}
				transition={{
					x: { type: "spring", stiffness: 40, damping: 30 },
					y: { type: "spring", stiffness: 40, damping: 30 },
					rotate: { duration: 20, repeat: Infinity, ease: "linear" }
				}}
				style={{
					left: "70%",
					top: "15%",
				}}
			/>
		</div>
	);
};

// Animated text component with stagger effect
const AnimatedText = ({ text, className = "", delay = 0 }: { text: string, className?: string, delay?: number }) => {
	const words = text.split(" ");
	
	return (
		<motion.div className={className}>
			{words.map((word, i) => (
				<motion.span
					key={i}
					className="inline-block mr-2"
					initial={{ opacity: 0, y: 50, rotateX: -90 }}
					animate={{ opacity: 1, y: 0, rotateX: 0 }}
					transition={{
						duration: 0.8,
						delay: delay + i * 0.1,
						ease: [0.22, 1, 0.36, 1],
					}}
				>
					{word}
				</motion.span>
			))}
		</motion.div>
	);
};

// Typewriter effect component - CLIENT SIDE ONLY
const TypewriterText = ({ text, className = "", delay = 0 }: { text: string, className?: string, delay?: number }) => {
	const [mounted, setMounted] = useState(false);
	const [displayText, setDisplayText] = useState("");
	const [isComplete, setIsComplete] = useState(false);
	
	useEffect(() => {
		setMounted(true);
	}, []);
	
	useEffect(() => {
		if (!mounted) return;
		
		const timer = setTimeout(() => {
			let currentIndex = 0;
			const typeInterval = setInterval(() => {
				if (currentIndex <= text.length) {
					setDisplayText(text.slice(0, currentIndex));
					currentIndex++;
				} else {
					setIsComplete(true);
					clearInterval(typeInterval);
				}
			}, 50);
			
			return () => clearInterval(typeInterval);
		}, delay);
		
		return () => clearTimeout(timer);
	}, [text, delay, mounted]);
	
	// Show complete text on server, animate on client
	if (!mounted) {
		return <span className={className}>{text}</span>;
	}
	
	return (
		<span className={className}>
			{displayText}
			{!isComplete && mounted && <motion.span
				animate={{ opacity: [0, 1] }}
				transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
				className="text-primary"
			>
				|
			</motion.span>}
		</span>
	);
};

// Enhanced card with hover effects
const EnhancedCard = ({ children, className = "", index = 0 }: { children: React.ReactNode, className?: string, index?: number }) => {
	return (
		<motion.div
			initial={{ opacity: 0, y: 60, rotateX: 45 }}
			whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
			transition={{
				duration: 0.8,
				delay: index * 0.1,
				ease: [0.22, 1, 0.36, 1],
			}}
			viewport={{ once: true }}
			whileHover={{
				y: -12,
				rotateY: 5,
				rotateX: -5,
				scale: 1.02,
				transition: { duration: 0.3, ease: "easeOut" }
			}}
			className={`group ${className}`}
		>
			<Card className="h-full relative overflow-hidden bg-card/60 backdrop-blur-lg border-2 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 dark:hover:shadow-primary/5">
				<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-1/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
				<div className="relative z-10">
					{children}
				</div>
			</Card>
		</motion.div>
	);
};

// Floating action button with pulse effect
const FloatingButton = ({ children, onClick, className = "" }: { children: React.ReactNode, onClick?: () => void, className?: string }) => {
	return (
		<motion.button
			onClick={onClick}
			className={`relative overflow-hidden ${className}`}
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.98 }}
			initial={{ scale: 0 }}
			animate={{ scale: 1 }}
			transition={{ type: "spring", stiffness: 300, damping: 15 }}
		>
			<motion.div
				className="absolute inset-0 bg-gradient-to-r from-primary to-chart-1 opacity-0"
				whileHover={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
			/>
			<div className="relative z-10">
				{children}
			</div>
		</motion.button>
	);
};



export default function LandingPageClient() {
	const { isSignedIn } = useAuth();
	const router = useRouter();
	const { scrollYProgress } = useScroll();
	const yRange = useTransform(scrollYProgress, [0, 1], [0, -100]);
	const [mounted, setMounted] = useState(false);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

	useEffect(() => {
		setMounted(true);
		
		const handleMouseMove = (e: MouseEvent) => {
			setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
		};
		
		window.addEventListener('mousemove', handleMouseMove);
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, []);

	const handleGetStarted = () => {
		if (isSignedIn) {
			router.push("/dashboard");
		}
		// If not signed in, the SignUpButton modal will handle the authentication
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-secondary/10 relative overflow-x-hidden">
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-md focus:bg-background focus:text-foreground focus:shadow"
			>
				Skip to content
			</a>

			{/* Navigation */}
			<motion.nav
				initial={{ y: -100, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
				className="fixed top-0 inset-x-0 z-50"
			>
				<div className="mx-auto max-w-7xl px-6">
					<motion.div 
						className="mt-4 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-lg shadow-primary/5"
						whileHover={{ scale: 1.01, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
						transition={{ duration: 0.3 }}
					>
						<div className="h-16 px-6 flex items-center justify-between">
							<motion.div 
								className="text-2xl font-bold text-primary flex items-center gap-2"
								whileHover={{ scale: 1.05 }}
								transition={{ type: "spring", stiffness: 400, damping: 17 }}
							>
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
								>
									<Sparkles className="w-6 h-6" />
								</motion.div>
								Foresight
							</motion.div>
							<div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
								{['Features', 'Pricing', 'Reviews'].map((item, index) => (
									<motion.a 
										key={item}
										href={`#${item.toLowerCase()}`} 
										className="hover:text-foreground transition-colors relative"
										whileHover={{ y: -2 }}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.1 * index + 0.5 }}
									>
										{item}
										<motion.div 
											className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"
											initial={{ scaleX: 0 }}
											whileHover={{ scaleX: 1 }}
											transition={{ duration: 0.3 }}
										/>
									</motion.a>
								))}
							</div>
							<div className="flex items-center gap-3">
								<motion.div
									whileHover={{ scale: 1.1, rotate: 180 }}
									transition={{ duration: 0.3 }}
								>
									<ThemeToggle />
								</motion.div>
								<SignInButton mode="modal">
									<motion.div
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
									>
										<Button variant="ghost" className="text-muted-foreground hover:text-primary transition-colors">
											Sign In
										</Button>
									</motion.div>
								</SignInButton>
								<SignUpButton mode="modal">
									<motion.div
										whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" }}
										whileTap={{ scale: 0.95 }}
									>
										<Button className="bg-gradient-to-r from-primary via-chart-1 to-primary hover:from-primary/90 hover:via-chart-1/90 hover:to-primary/90 text-primary-foreground shadow-lg">
											Get Started
										</Button>
									</motion.div>
								</SignUpButton>
							</div>
						</div>
					</motion.div>
				</div>
			</motion.nav>

			{/* Hero Section */}
			<section id="main-content" role="main" className="relative z-10 px-6 py-32 md:py-40">
				<HeroGradient />
				<EnhancedAnimatedBackground />
				
				<div className="max-w-7xl mx-auto text-center relative z-20">
					<motion.div
						initial={{ opacity: 0, y: 80 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
						className="relative"
					>
						{/* Hero Title with enhanced animations */}
						<div className="mb-8">
							<AnimatedText 
								text="Take Control of Your"
								className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 text-foreground"
								delay={0.8}
							/>
							<motion.div
								initial={{ opacity: 0, scale: 0.8, rotateX: 45 }}
								animate={{ opacity: 1, scale: 1, rotateX: 0 }}
								transition={{ duration: 1, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
								className="relative"
							>
								<span className="text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-primary via-chart-1 to-chart-4 bg-clip-text text-transparent">
									<TypewriterText text="Financial Future" delay={2000} />
								</span>
								<motion.div
									className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-chart-1/20 to-chart-4/20 rounded-xl blur-xl"
									animate={{ 
										opacity: [0.3, 0.6, 0.3],
										scale: [1, 1.05, 1],
									}}
									transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
								/>
							</motion.div>
						</div>

						<motion.p 
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 3 }}
							className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed"
						>
							Empower your financial journey with intelligent planning, real-time insights, 
							and the power of compound growth. Make every decision count.
						</motion.p>

						<motion.div
							initial={{ opacity: 0, y: 40 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 3.5 }}
							className="flex flex-col sm:flex-row gap-6 justify-center items-center"
						>
							{isSignedIn ? (
								<FloatingButton 
									onClick={handleGetStarted}
									className="group bg-gradient-to-r from-primary via-chart-1 to-primary text-primary-foreground px-10 py-5 text-lg font-semibold rounded-xl shadow-2xl shadow-primary/25"
								>
									<span className="flex items-center gap-3">
										Go to Dashboard
										<motion.div
											animate={{ x: [0, 5, 0] }}
											transition={{ duration: 1.5, repeat: Infinity }}
										>
											<ArrowRight className="w-5 h-5" />
										</motion.div>
									</span>
								</FloatingButton>
							) : (
								<SignUpButton mode="modal">
									<FloatingButton className="group bg-gradient-to-r from-primary via-chart-1 to-primary text-primary-foreground px-10 py-5 text-lg font-semibold rounded-xl shadow-2xl shadow-primary/25">
										<span className="flex items-center gap-3">
											Start Your Journey
											<motion.div
												animate={{ x: [0, 5, 0] }}
												transition={{ duration: 1.5, repeat: Infinity }}
											>
												<ArrowRight className="w-5 h-5" />
											</motion.div>
										</span>
									</FloatingButton>
								</SignUpButton>
							)}
							
							<motion.div
								whileHover={{ scale: 1.05, y: -2 }}
								whileTap={{ scale: 0.95 }}
							>
								<Button
									variant="outline"
									size="lg"
									className="group border-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground px-10 py-5 text-lg font-semibold rounded-xl backdrop-blur-lg bg-background/50 shadow-lg"
								>
									<span className="flex items-center gap-3">
										Watch Demo
										<motion.div
											whileHover={{ rotate: 180, scale: 1.2 }}
											transition={{ duration: 0.3 }}
										>
											<Eye className="w-5 h-5" />
										</motion.div>
									</span>
								</Button>
							</motion.div>
						</motion.div>

						{/* Floating stats */}
						<motion.div 
							initial={{ opacity: 0, y: 50 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 1, delay: 4 }}
							className="flex justify-center gap-8 mt-16"
						>
							{[
								{ number: "10K+", label: "Active Users" },
								{ number: "$50M+", label: "Managed" },
								{ number: "99.9%", label: "Uptime" }
							].map((stat, index) => (
								<motion.div
									key={index}
									whileHover={{ scale: 1.1, y: -5 }}
									className="text-center p-4 rounded-xl bg-card/50 backdrop-blur-lg border border-border/50"
								>
									<div className="text-2xl font-bold text-primary">{stat.number}</div>
									<div className="text-sm text-muted-foreground">{stat.label}</div>
								</motion.div>
							))}
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* Enhanced Separator */}
			<div className="px-6 py-8">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ scaleX: 0 }}
						whileInView={{ scaleX: 1 }}
						transition={{ duration: 1.5, ease: "easeInOut" }}
						viewport={{ once: true }}
						className="h-px bg-gradient-to-r from-transparent via-border to-transparent"
					/>
				</div>
			</div>

			{/* Overview Section */}
			<section id="features" className="relative z-10 px-6 py-24 md:py-32">
				<SectionGradient />
				<div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 backdrop-blur-sm" />
				<div className="max-w-7xl mx-auto relative z-10">
					<motion.div
						initial={{ opacity: 0, y: 60 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
						viewport={{ once: true }}
						className="text-center mb-20"
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							whileInView={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.8, delay: 0.2 }}
							viewport={{ once: true }}
						>
							<Badge className="mb-6 text-primary border-primary/30 bg-primary/10 backdrop-blur-lg">
								<Sparkles className="w-4 h-4 mr-2" />
								Complete Financial Ecosystem
							</Badge>
						</motion.div>
						<AnimatedText 
							text="Your Complete Financial Ecosystem"
							className="text-4xl md:text-6xl font-bold mb-8 text-foreground"
							delay={0.5}
						/>
						<motion.p 
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 1.2 }}
							viewport={{ once: true }}
							className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
						>
							From tracking every penny to visualizing your wealth growth, Foresight provides 
							the tools and insights you need to build lasting financial freedom.
						</motion.p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
						{[
							{
								icon: TrendingUp,
								title: "Investment Portfolio",
								description: "Track stocks, bonds, mutual funds, crypto, and real estate in one unified dashboard.",
								features: ["Real-time tracking", "Performance analytics", "Risk assessment"],
								color: "from-primary to-chart-1"
							},
							{
								icon: Wallet,
								title: "Income & Expenses",
								description: "Comprehensive cash flow management with intelligent categorization and insights.",
								features: ["Auto-categorization", "Budget optimization", "Spending trends"],
								color: "from-chart-1 to-chart-4"
							},
							{
								icon: Target,
								title: "Financial Goals",
								description: "Set, track, and achieve your financial objectives with personalized roadmaps.",
								features: ["Goal planning", "Progress tracking", "Milestone alerts"],
								color: "from-chart-4 to-chart-2"
							}
						].map((item, index) => (
							<EnhancedCard key={index} index={index}>
								<CardHeader className="pb-4">
									<motion.div 
										className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
										whileHover={{ rotate: 360 }}
										transition={{ duration: 0.6 }}
									>
										<item.icon className="w-8 h-8 text-primary-foreground" />
									</motion.div>
									<CardTitle className="text-2xl mb-2 group-hover:text-primary transition-colors duration-300">
										{item.title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription className="mb-8 text-base leading-relaxed">
										{item.description}
									</CardDescription>
									<ul className="space-y-3">
										{item.features.map((feature, idx) => (
											<motion.li 
												key={idx} 
												className="flex items-center gap-3 text-sm text-muted-foreground"
												initial={{ opacity: 0, x: -20 }}
												whileInView={{ opacity: 1, x: 0 }}
												transition={{ duration: 0.5, delay: idx * 0.1 + index * 0.2 }}
												viewport={{ once: true }}
											>
												<motion.div
													whileHover={{ scale: 1.2, rotate: 360 }}
													transition={{ duration: 0.3 }}
												>
													<CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
												</motion.div>
												<span className="group-hover:text-foreground transition-colors duration-300">
													{feature}
												</span>
											</motion.li>
										))}
									</ul>
								</CardContent>
							</EnhancedCard>
						))}
					</div>
				</div>
			</section>

			{/* Highlights Section with parallax effect */}
			<section className="relative z-10 px-6 py-24 md:py-32 overflow-hidden">
				<motion.div 
					className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-1/5"
					style={{ y: yRange }}
				/>
				
				<div className="max-w-7xl mx-auto relative z-10">
					<motion.div
						initial={{ opacity: 0, y: 60 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
						viewport={{ once: true }}
						className="text-center mb-20"
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							whileInView={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.8, delay: 0.2 }}
							viewport={{ once: true }}
						>
							<Badge className="mb-6 text-chart-4 border-chart-4/30 bg-chart-4/10 backdrop-blur-lg">
								<Shield className="w-4 h-4 mr-2" />
								Why Choose Foresight?
							</Badge>
						</motion.div>
						<AnimatedText 
							text="Why Choose Foresight?"
							className="text-4xl md:text-6xl font-bold mb-8 text-foreground"
							delay={0.5}
						/>
						<motion.p 
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 1.2 }}
							viewport={{ once: true }}
							className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
						>
							Built by financial experts for everyday people who want to take control of their money.
						</motion.p>
					</motion.div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
						<motion.div
							initial={{ opacity: 0, x: -60 }}
							whileInView={{ opacity: 1, x: 0 }}
							transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
							viewport={{ once: true }}
							className="space-y-10"
						>
							{[
								{
									icon: Shield,
									title: "Secure & Private",
									description: "Bank-level security with end-to-end encryption. Your financial data is completely protected.",
									color: "from-primary to-chart-1"
								},
								{
									icon: Calculator,
									title: "Intelligent Insights",
									description: "AI-powered analysis provides personalized recommendations for better financial decisions.",
									color: "from-chart-1 to-chart-4"
								},
								{
									icon: Globe,
									title: "Multi-Currency Support",
									description: "Track investments and expenses in multiple currencies with real-time exchange rates.",
									color: "from-chart-4 to-chart-2"
								},
								{
									icon: PieChart,
									title: "Visual Analytics",
									description: "Beautiful charts and graphs make complex financial data easy to understand at a glance.",
									color: "from-chart-2 to-primary"
								}
							].map((item, index) => (
								<motion.div
									key={index}
									initial={{ opacity: 0, y: 30 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.8, delay: index * 0.2 }}
									viewport={{ once: true }}
									whileHover={{ x: 10 }}
									className="flex gap-6 p-4 rounded-xl hover:bg-card/50 transition-all duration-300 group"
								>
									<motion.div 
										className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0`}
										whileHover={{ rotate: 360, scale: 1.1 }}
										transition={{ duration: 0.5 }}
									>
										<item.icon className="w-7 h-7 text-primary-foreground" />
									</motion.div>
									<div className="flex-1">
										<h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
											{item.title}
										</h3>
										<p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
											{item.description}
										</p>
									</div>
								</motion.div>
							))}
						</motion.div>

						<motion.div
							initial={{ opacity: 0, x: 60 }}
							whileInView={{ opacity: 1, x: 0 }}
							transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
							viewport={{ once: true }}
							className="relative"
						>
							<motion.div
								className="relative"
								whileHover={{ rotateY: 15, rotateX: -5 }}
								transition={{ duration: 0.6 }}
								style={{ perspective: "1000px" }}
							>
								<div className="absolute inset-0 bg-gradient-to-br from-primary via-chart-1 to-chart-4 rounded-3xl opacity-20 blur-xl scale-105" />
								<motion.div
									className="bg-gradient-to-br from-primary/20 via-chart-1/20 to-chart-4/20 rounded-3xl p-2 transform rotate-2 hover:rotate-0 transition-transform duration-700"
									whileHover={{ scale: 1.02 }}
								>
									<EnhancedCard className="transform -rotate-1 hover:rotate-0 transition-transform duration-700">
										<CardHeader className="pb-4">
											<div className="flex items-center gap-4 mb-4">
												<motion.div 
													className="w-14 h-14 bg-gradient-to-r from-primary to-chart-1 rounded-xl flex items-center justify-center"
													whileHover={{ rotate: 360 }}
													transition={{ duration: 0.8 }}
												>
													<Activity className="w-7 h-7 text-primary-foreground" />
												</motion.div>
												<div>
													<CardTitle className="text-foreground text-lg">Live Portfolio Overview</CardTitle>
													<div className="text-sm text-muted-foreground flex items-center gap-2">
														<motion.div
															animate={{ opacity: [1, 0.5, 1] }}
															transition={{ duration: 1.5, repeat: Infinity }}
															className="w-2 h-2 bg-positive rounded-full"
														/>
														Last updated: Now
													</div>
												</div>
											</div>
										</CardHeader>
										<CardContent>
											<div className="space-y-4">
												<motion.div 
													className="flex justify-between items-center"
													whileHover={{ scale: 1.02 }}
												>
													<span className="text-muted-foreground">Total Value</span>
													<span className="font-bold text-2xl text-primary">$127,450</span>
												</motion.div>
												<motion.div 
													className="flex justify-between items-center"
													whileHover={{ scale: 1.02 }}
												>
													<span className="text-muted-foreground">Today&apos;s Change</span>
													<motion.div
														whileHover={{ scale: 1.1 }}
														transition={{ type: "spring", stiffness: 400, damping: 17 }}
													>
														<Badge variant="outline" className="text-positive border-positive bg-positive/10">
															<TrendingUp className="w-3 h-3 mr-1" />
															+2.4%
														</Badge>
													</motion.div>
												</motion.div>
												<motion.div 
													className="flex justify-between items-center"
													whileHover={{ scale: 1.02 }}
												>
													<span className="text-muted-foreground">This Month</span>
													<span className="font-medium text-positive">+$3,240</span>
												</motion.div>
											</div>
										</CardContent>
									</EnhancedCard>
								</motion.div>
							</motion.div>
						</motion.div>
					</div>
				</div>
			</section>

			{/* Features Tools Section */}
			<section id="tools" className="relative z-10 px-6 py-24 md:py-32 overflow-hidden">
				<SubtleGradient />
				<div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/5 backdrop-blur-sm" />
				<div className="max-w-7xl mx-auto relative z-10">
					<motion.div
						initial={{ opacity: 0, y: 60 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
						viewport={{ once: true }}
						className="text-center mb-20"
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							whileInView={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.8, delay: 0.2 }}
							viewport={{ once: true }}
						>
							<Badge className="mb-6 text-chart-1 border-chart-1/30 bg-chart-1/10 backdrop-blur-lg">
								<Calculator className="w-4 h-4 mr-2" />
								Comprehensive Financial Tools
							</Badge>
						</motion.div>
						<AnimatedText 
							text="Comprehensive Financial Tools"
							className="text-4xl md:text-6xl font-bold mb-8 text-foreground"
							delay={0.5}
						/>
						<motion.p 
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 1.2 }}
							viewport={{ once: true }}
							className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
						>
							Everything you need to manage your finances effectively, from basic budgeting to advanced portfolio management.
						</motion.p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
						{[
							{ icon: DollarSign, title: "Income Tracking", description: "Monitor all income sources and analyze earning patterns", color: "from-primary to-chart-1" },
							{ icon: BarChart3, title: "Expense Analysis", description: "Categorize spending and identify optimization opportunities", color: "from-chart-1 to-chart-4" },
							{ icon: Target, title: "Goal Setting", description: "Define and track financial objectives with precision", color: "from-chart-4 to-chart-2" },
							{ icon: Shield, title: "Risk Assessment", description: "Evaluate investment risk and optimize portfolio allocation", color: "from-chart-2 to-primary" },
							{ icon: Calculator, title: "Tax Planning", description: "Plan ahead for tax obligations and maximize savings", color: "from-primary to-chart-4" },
							{ icon: TrendingUp, title: "Market Insights", description: "Stay informed with real-time market data and trends", color: "from-chart-4 to-chart-1" },
							{ icon: Lock, title: "Secure Storage", description: "Bank-level encryption for all your financial data", color: "from-chart-1 to-chart-2" },
							{ icon: Users, title: "Expert Community", description: "Learn from financial experts and fellow users", color: "from-chart-2 to-primary" }
						].map((feature, index) => (
							<EnhancedCard key={index} index={index} className="group">
								<CardHeader className="text-center pb-4">
									<motion.div 
										className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300`}
										whileHover={{ rotate: 360, scale: 1.2 }}
										transition={{ duration: 0.6 }}
									>
										<feature.icon className="w-8 h-8 text-primary-foreground" />
									</motion.div>
									<CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors duration-300">
										{feature.title}
									</CardTitle>
								</CardHeader>
								<CardContent className="text-center">
									<CardDescription className="text-sm leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
										{feature.description}
									</CardDescription>
								</CardContent>
							</EnhancedCard>
						))}
					</div>
				</div>
			</section>

			{/* Pricing Section */}
			<section id="pricing" className="relative z-10 px-6 py-24 md:py-32">
				<div className="max-w-7xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: 60 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
						viewport={{ once: true }}
						className="text-center mb-20"
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							whileInView={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.8, delay: 0.2 }}
							viewport={{ once: true }}
						>
							<Badge className="mb-6 text-primary border-primary/30 bg-primary/10 backdrop-blur-lg">
								<DollarSign className="w-4 h-4 mr-2" />
								Simple, Transparent Pricing
							</Badge>
						</motion.div>
						<AnimatedText 
							text="Simple, Transparent Pricing"
							className="text-4xl md:text-6xl font-bold mb-8 text-foreground"
							delay={0.5}
						/>
						<motion.p 
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 1.2 }}
							viewport={{ once: true }}
							className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
						>
							Start free and scale as you grow. No hidden fees, no surprise charges.
						</motion.p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
						{[
							{
								name: "Starter",
								price: "Free",
								description: "Perfect for getting started with personal finance",
								features: ["Basic income/expense tracking", "Simple budgeting", "Goal setting", "Mobile app access"],
								popular: false,
								color: "from-chart-2 to-chart-4"
							},
							{
								name: "Professional",
								price: "$9.99/month",
								description: "Advanced tools for serious financial planning",
								features: ["Investment portfolio tracking", "Advanced analytics", "Tax planning tools", "Priority support", "Multi-currency support"],
								popular: true,
								color: "from-primary to-chart-1"
							},
							{
								name: "Enterprise",
								price: "$29.99/month",
								description: "Complete financial management suite",
								features: ["Everything in Professional", "Custom reporting", "API access", "Dedicated support", "Advanced risk analysis", "White-label options"],
								popular: false,
								color: "from-chart-1 to-chart-4"
							}
						].map((plan, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 60, rotateX: 45 }}
								whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
								transition={{
									duration: 0.8,
									delay: index * 0.2,
									ease: [0.22, 1, 0.36, 1],
								}}
								viewport={{ once: true }}
								whileHover={{
									y: plan.popular ? -20 : -15,
									scale: plan.popular ? 1.05 : 1.02,
									rotateY: 5,
									transition: { duration: 0.4, ease: "easeOut" }
								}}
								className="relative group"
							>
								{plan.popular && (
									<motion.div
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
										className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10"
									>
										<Badge className={`bg-gradient-to-r ${plan.color} text-primary-foreground shadow-lg px-4 py-1`}>
											<Sparkles className="w-3 h-3 mr-1" />
											Most Popular
										</Badge>
									</motion.div>
								)}
								
								<Card className={`h-full transition-all duration-500 relative overflow-hidden ${
									plan.popular
										? 'border-2 border-primary shadow-2xl shadow-primary/20 bg-card/80 backdrop-blur-xl'
										: 'hover:border-primary/50 bg-card/60 backdrop-blur-lg'
								}`}>
									<div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
									
									<CardHeader className="text-center relative z-10 pb-4">
										<CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
										<motion.div 
											className="text-4xl font-bold text-primary mb-4"
											whileHover={{ scale: 1.1 }}
											transition={{ type: "spring", stiffness: 400, damping: 17 }}
										>
											{plan.price}
										</motion.div>
										<CardDescription className="text-base leading-relaxed">{plan.description}</CardDescription>
									</CardHeader>
									
									<CardContent className="relative z-10">
										<ul className="space-y-4 mb-8">
											{plan.features.map((feature, idx) => (
												<motion.li 
													key={idx} 
													className="flex items-center gap-3"
													initial={{ opacity: 0, x: -20 }}
													whileInView={{ opacity: 1, x: 0 }}
													transition={{ duration: 0.5, delay: idx * 0.1 + index * 0.2 }}
													viewport={{ once: true }}
												>
													<motion.div
														whileHover={{ scale: 1.2, rotate: 360 }}
														transition={{ duration: 0.3 }}
													>
														<CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
													</motion.div>
													<span className="text-muted-foreground text-sm group-hover:text-foreground transition-colors duration-300">
														{feature}
													</span>
												</motion.li>
											))}
										</ul>
										
										{isSignedIn ? (
											<motion.div
												whileHover={{ scale: 1.02 }}
												whileTap={{ scale: 0.98 }}
											>
												<Button
													onClick={handleGetStarted}
													className={`w-full transition-all duration-300 ${
														plan.popular
															? `bg-gradient-to-r ${plan.color} hover:shadow-lg hover:shadow-primary/25 text-primary-foreground`
															: 'hover:bg-primary hover:text-primary-foreground'
													}`}
													variant={plan.popular ? "default" : "outline"}
												>
													Go to Dashboard
												</Button>
											</motion.div>
										) : (
											<SignUpButton mode="modal">
												<motion.div
													whileHover={{ scale: 1.02 }}
													whileTap={{ scale: 0.98 }}
													className="w-full"
												>
													<Button
														className={`w-full transition-all duration-300 ${
															plan.popular
																? `bg-gradient-to-r ${plan.color} hover:shadow-lg hover:shadow-primary/25 text-primary-foreground`
																: 'hover:bg-primary hover:text-primary-foreground'
														}`}
														variant={plan.popular ? "default" : "outline"}
													>
														Get Started
													</Button>
												</motion.div>
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
			<section id="reviews" className="relative z-10 px-6 py-24 md:py-32 overflow-hidden">
				<SubtleGradient />
				<div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-chart-4/5 backdrop-blur-sm" />
				<div className="max-w-7xl mx-auto relative z-10">
					<motion.div
						initial={{ opacity: 0, y: 60 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
						viewport={{ once: true }}
						className="text-center mb-20"
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							whileInView={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.8, delay: 0.2 }}
							viewport={{ once: true }}
						>
							<Badge className="mb-6 text-chart-4 border-chart-4/30 bg-chart-4/10 backdrop-blur-lg">
								<Users className="w-4 h-4 mr-2" />
								What Our Users Say
							</Badge>
						</motion.div>
						<AnimatedText 
							text="What Our Users Say"
							className="text-4xl md:text-6xl font-bold mb-8 text-foreground"
							delay={0.5}
						/>
						<motion.p 
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 1.2 }}
							viewport={{ once: true }}
							className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
						>
							Join thousands of users who have transformed their financial lives with Foresight.
						</motion.p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						{[
							{
								name: "Sarah Johnson",
								role: "Small Business Owner",
								content: "Foresight helped me understand my cash flow like never before. The insights are incredible and have completely transformed how I manage my business finances!",
								rating: 5,
								avatar: "SJ",
								color: "from-primary to-chart-1"
							},
							{
								name: "Michael Chen",
								role: "Software Engineer",
								content: "The investment tracking is phenomenal. I've never been more confident in my portfolio decisions. The real-time analytics are a game-changer.",
								rating: 5,
								avatar: "MC",
								color: "from-chart-1 to-chart-4"
							},
							{
								name: "Emily Rodriguez",
								role: "Teacher",
								content: "Finally, a finance app that's both powerful and easy to use. My savings have increased significantly, and I actually enjoy budgeting now!",
								rating: 5,
								avatar: "ER",
								color: "from-chart-4 to-chart-2"
							}
						].map((review, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 40, rotateY: 20 }}
								whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
								transition={{
									duration: 0.8,
									delay: index * 0.2,
									ease: [0.22, 1, 0.36, 1],
								}}
								viewport={{ once: true }}
								whileHover={{
									y: -10,
									rotateY: -5,
									scale: 1.02,
									transition: { duration: 0.3, ease: "easeOut" }
								}}
								className="group"
							>
								<Card className="h-full relative overflow-hidden bg-card/60 backdrop-blur-lg border-2 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
									<div className={`absolute inset-0 bg-gradient-to-br ${review.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
									
									<CardHeader className="relative z-10">
										<div className="flex items-center mb-6">
											<motion.div
												whileHover={{ scale: 1.1, rotate: 5 }}
												transition={{ duration: 0.3 }}
											>
												<Avatar className="mr-4 w-12 h-12 border-2 border-primary/20">
													<AvatarFallback className={`bg-gradient-to-r ${review.color} text-primary-foreground font-bold text-lg`}>
														{review.avatar}
													</AvatarFallback>
												</Avatar>
											</motion.div>
											<div>
												<CardTitle className="text-base mb-1 group-hover:text-primary transition-colors duration-300">
													{review.name}
												</CardTitle>
												<CardDescription className="text-sm">{review.role}</CardDescription>
											</div>
										</div>
										
										<div className="flex mb-6">
											{[...Array(review.rating)].map((_, i) => (
												<motion.div
													key={i}
													initial={{ opacity: 0, scale: 0 }}
													whileInView={{ opacity: 1, scale: 1 }}
													transition={{ duration: 0.3, delay: index * 0.2 + i * 0.1 }}
													viewport={{ once: true }}
													whileHover={{ scale: 1.2, rotate: 360 }}
												>
													<Star className="w-5 h-5 text-warning fill-current" />
												</motion.div>
											))}
										</div>
									</CardHeader>
									
									<CardContent className="relative z-10">
										<motion.p 
											className="text-muted-foreground italic leading-relaxed group-hover:text-foreground/90 transition-colors duration-300"
											initial={{ opacity: 0 }}
											whileInView={{ opacity: 1 }}
											transition={{ duration: 0.8, delay: index * 0.2 + 0.5 }}
											viewport={{ once: true }}
										>
											&ldquo;{review.content}&rdquo;
										</motion.p>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Enhanced CTA Section */}
			<section className="relative z-10 px-6 py-24 md:py-32">
				<div className="max-w-5xl mx-auto text-center">
					<motion.div
						initial={{ opacity: 0, y: 80, scale: 0.9 }}
						whileInView={{ opacity: 1, y: 0, scale: 1 }}
						transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
						viewport={{ once: true }}
						className="relative group"
						whileHover={{ scale: 1.02 }}
					>
						{/* Enhanced gradient background with animation */}
						<div className="absolute inset-0 bg-gradient-to-r from-primary via-chart-1 to-chart-4 rounded-3xl opacity-90" />
						<motion.div
							className="absolute inset-0 bg-gradient-to-br from-primary/30 via-chart-1/30 to-chart-4/30 rounded-3xl blur-xl"
							animate={{ 
								scale: [1, 1.05, 1],
								opacity: [0.3, 0.6, 0.3] 
							}}
							transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
						/>
						
						{/* Noise texture overlay */}
						<div
							className="absolute inset-0 rounded-3xl opacity-20"
							style={{
								background: `
									radial-gradient(circle at 20% 50%, hsl(var(--color-primary) / 0.4) 0%, transparent 50%),
									radial-gradient(circle at 80% 20%, hsl(var(--color-chart-1) / 0.4) 0%, transparent 50%),
									radial-gradient(circle at 40% 80%, hsl(var(--color-chart-4) / 0.4) 0%, transparent 50%)
								`,
							}}
						/>

						{/* Floating particles with fixed positions to prevent hydration issues */}
						{[
							{ left: 20, top: 30, delay: 0 },
							{ left: 75, top: 15, delay: 0.5 },
							{ left: 35, top: 70, delay: 1.0 },
							{ left: 90, top: 45, delay: 1.5 },
							{ left: 15, top: 85, delay: 2.0 },
							{ left: 60, top: 25, delay: 0.3 },
							{ left: 45, top: 60, delay: 0.8 },
							{ left: 80, top: 75, delay: 1.3 },
							{ left: 25, top: 50, delay: 1.8 },
							{ left: 70, top: 35, delay: 0.2 },
							{ left: 55, top: 80, delay: 0.7 },
							{ left: 85, top: 20, delay: 1.2 }
						].map((particle, i) => (
							<motion.div
								key={i}
								className="absolute w-1 h-1 bg-white/40 rounded-full"
								style={{
									left: `${particle.left}%`,
									top: `${particle.top}%`,
								}}
								animate={{
									y: [0, -20, 0],
									opacity: [0.2, 0.8, 0.2],
									scale: [0.5, 1.2, 0.5],
								}}
								transition={{
									duration: 3,
									repeat: Infinity,
									ease: "easeInOut",
									delay: particle.delay,
								}}
							/>
						))}
						
						<div className="relative z-10 p-12 md:p-16 text-primary-foreground">
							<motion.div
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 0.3 }}
								viewport={{ once: true }}
							>
								<AnimatedText 
									text="Ready to Transform Your Financial Future?"
									className="text-4xl md:text-6xl font-bold mb-8"
									delay={0.5}
								/>
							</motion.div>
							
							<motion.p 
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 1.2 }}
								viewport={{ once: true }}
								className="text-xl md:text-2xl mb-10 opacity-95 leading-relaxed"
							>
								Join Foresight today and take the first step towards financial freedom.
							</motion.p>
							
							<motion.div
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 1.5 }}
								viewport={{ once: true }}
							>
								{isSignedIn ? (
									<motion.div
										whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(255,255,255,0.3)" }}
										whileTap={{ scale: 0.98 }}
									>
										<Button
											onClick={handleGetStarted}
											size="lg"
											className="bg-background text-primary hover:bg-background/90 px-12 py-6 text-xl font-semibold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300"
										>
											<span className="flex items-center gap-3">
												Go to Dashboard
												<motion.div
													animate={{ x: [0, 5, 0] }}
													transition={{ duration: 1.5, repeat: Infinity }}
												>
													<ArrowRight className="w-6 h-6" />
												</motion.div>
											</span>
										</Button>
									</motion.div>
								) : (
									<SignUpButton mode="modal">
										<motion.div
											whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(255,255,255,0.3)" }}
											whileTap={{ scale: 0.98 }}
										>
											<Button
												size="lg"
												className="bg-background text-primary hover:bg-background/90 px-12 py-6 text-xl font-semibold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300"
											>
												<span className="flex items-center gap-3">
													Start Your Journey Today
													<motion.div
														animate={{ x: [0, 5, 0] }}
														transition={{ duration: 1.5, repeat: Infinity }}
													>
														<Sparkles className="w-6 h-6" />
													</motion.div>
												</span>
											</Button>
										</motion.div>
									</SignUpButton>
								)}
							</motion.div>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Enhanced Footer */}
			<footer className="relative z-10 px-6 py-16 border-t border-border/50">
				<div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5" />
				<div className="max-w-7xl mx-auto relative z-10">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8 }}
							viewport={{ once: true }}
						>
							<div className="flex items-center gap-2 mb-6">
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
								>
									<Sparkles className="w-6 h-6 text-primary" />
								</motion.div>
								<h3 className="text-2xl font-bold text-primary">Foresight</h3>
							</div>
							<p className="text-muted-foreground mb-6 leading-relaxed">
								Empowering everyday people to take control of their financial future with intelligent tools and insights.
							</p>
							<div className="flex space-x-4">
								{/* Social media icons would go here */}
								<motion.div
									className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
									whileHover={{ scale: 1.1, backgroundColor: "hsl(var(--color-primary) / 0.2)" }}
									transition={{ duration: 0.2 }}
								>
									<Users className="w-5 h-5 text-primary" />
								</motion.div>
							</div>
						</motion.div>
						
						{[
							{
								title: "Product",
								links: ["Features", "Pricing", "Security", "API"]
							},
							{
								title: "Company",
								links: ["About", "Blog", "Careers", "Contact"]
							},
							{
								title: "Support",
								links: ["Help Center", "Community", "Privacy", "Terms"]
							}
						].map((section, index) => (
							<motion.div
								key={section.title}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: index * 0.1 }}
								viewport={{ once: true }}
							>
								<h4 className="font-bold text-foreground mb-6">{section.title}</h4>
								<ul className="space-y-3">
									{section.links.map((link, linkIndex) => (
										<li key={link}>
											<motion.a 
												href="#" 
												className="text-muted-foreground hover:text-primary transition-colors duration-300 relative"
												whileHover={{ x: 5 }}
												initial={{ opacity: 0, x: -10 }}
												whileInView={{ opacity: 1, x: 0 }}
												transition={{ duration: 0.5, delay: linkIndex * 0.1 }}
												viewport={{ once: true }}
											>
												{link}
												<motion.div 
													className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"
													initial={{ scaleX: 0 }}
													whileHover={{ scaleX: 1 }}
													transition={{ duration: 0.3 }}
												/>
											</motion.a>
										</li>
									))}
								</ul>
							</motion.div>
						))}
					</div>
					
					<motion.div 
						className="border-t border-border/50 pt-8 text-center"
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						transition={{ duration: 0.8, delay: 0.5 }}
						viewport={{ once: true }}
					>
						<p className="text-muted-foreground">
							&copy; 2024 Foresight. All rights reserved. Built with ❤️ for your financial success.
						</p>
					</motion.div>
				</div>
			</footer>
		</div>
	);
}
