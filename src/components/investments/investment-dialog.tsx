"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InvestmentDocument, InvestmentType } from "@/types/financial";
import { currencyCodeSchema } from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Currency display mapping for major currencies (most commonly used)
const MAJOR_CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "ر.س", name: "Saudi Riyal" },
];

// Get all supported currencies from the schema
const getAllSupportedCurrencies = () => {
  try {
    return currencyCodeSchema.options;
  } catch {
    return MAJOR_CURRENCIES.map((c) => c.code);
  }
};

// Simplified validation schema
const investmentSchema = z.object({
  name: z.string().min(1, "Investment name is required"),
  type: z.enum([
    "stocks",
    "bonds",
    "mutual_funds",
    "etf",
    "options",
    "real_estate",
    "crypto",
    "other",
  ]),
  symbol: z.string().optional(),
  quantity: z.number().positive("Quantity must be positive"),
  purchasePrice: z.number().positive("Purchase price must be positive"),
  currency: currencyCodeSchema,
  purchaseDate: z.string().min(1, "Purchase date is required"),
  description: z.string().optional(),
  // Optional type-specific fields
  sector: z.string().optional(),
  dividend: z.number().min(0).optional(),
  expenseRatio: z.number().min(0).max(10).optional(),
  blockchain: z.string().optional(),
  propertyType: z
    .enum(["residential", "commercial", "reit", "land"])
    .optional(),
  strikePrice: z.number().positive().optional(),
  expirationDate: z.string().optional(),
  optionType: z.enum(["call", "put"]).optional(),
  // Bond-specific (flat) form fields
  issuer: z.string().optional(),
  faceValue: z.number().positive().optional(),
  couponRate: z.number().min(0).max(100).optional(),
  couponFrequency: z.enum(["annual", "semi_annual", "quarterly"]).optional(),
  maturityDate: z.string().optional(),
  creditRating: z.string().optional(),
  yieldToMaturity: z.number().min(0).max(100).optional(),
  priceType: z.enum(["percent_of_par", "absolute"]).optional(),
  cleanPricePercent: z.number().min(0).max(500).optional(),
  dayCountConvention: z
    .enum(["30/360", "ACT/360", "ACT/365", "ACT/ACT"]) 
    .optional(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

interface InvestmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investment?: InvestmentDocument | null;
  onSaved: () => void;
  defaultType?: InvestmentType;
}

const investmentTypes = [
  {
    value: "stocks",
    label: "Stocks",
    description: "Individual company shares",
    hasSymbol: true,
    hasSearch: true,
  },
  {
    value: "etf",
    label: "ETFs",
    description: "Exchange-traded funds",
    hasSymbol: true,
    hasSearch: true,
  },
  {
    value: "crypto",
    label: "Cryptocurrency",
    description: "Digital currencies",
    hasSymbol: true,
    hasSearch: true,
  },
  {
    value: "options",
    label: "Options",
    description: "Stock options contracts",
    hasSymbol: true,
    hasSearch: false,
  },
  {
    value: "bonds",
    label: "Bonds",
    description: "Government or corporate bonds",
    hasSymbol: false,
    hasSearch: false,
  },
  {
    value: "mutual_funds",
    label: "Mutual Funds",
    description: "Professionally managed funds",
    hasSymbol: false,
    hasSearch: false,
  },
  {
    value: "real_estate",
    label: "Real Estate",
    description: "Property investments",
    hasSymbol: false,
    hasSearch: false,
  },
  {
    value: "other",
    label: "Other",
    description: "Other investment types",
    hasSymbol: false,
    hasSearch: false,
  },
];

export function InvestmentDialog({
  open,
  onOpenChange,
  investment,
  onSaved,
  defaultType = "stocks",
}: InvestmentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [searchingCompany, setSearchingCompany] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{ symbol: string; description: string; name?: string }>
  >([]);
  const [selectedType, setSelectedType] = useState<InvestmentType>(defaultType);

  const form = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      name: "",
      type: defaultType,
      symbol: "",
      quantity: 1,
      purchasePrice: 0,
      currency: "USD",
      purchaseDate: new Date().toISOString().split("T")[0],
      description: "",
    },
  });

  const currentTypeConfig = investmentTypes.find(
    (t) => t.value === selectedType
  );

  // Search function
  const searchInvestments = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setSearchingCompany(true);
    try {
      const endpoint =
        selectedType === "crypto"
          ? "/api/market-data/search-crypto"
          : "/api/market-data/search";

      const response = await fetch(
        `${endpoint}?q=${encodeURIComponent(query)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setSuggestions(data.results.slice(0, 8));
        } else {
          setSuggestions([]);
        }
      }
    } catch (error) {
      console.error("Error searching investments:", error);
      setSuggestions([]);
    } finally {
      setSearchingCompany(false);
    }
  };

  // Fetch current price
  const fetchCurrentPrice = async (symbol: string) => {
    if (!symbol || symbol.length < 1) return;

    setFetchingPrice(true);
    try {
      const endpoint =
        selectedType === "crypto"
          ? "/api/market-data/crypto-quote"
          : "/api/market-data/quote";

      const response = await fetch(
        selectedType === "crypto"
          ? `${endpoint}?symbol=${encodeURIComponent(symbol)}`
          : `${endpoint}?symbols=${encodeURIComponent(symbol)}`
      );

      if (response.ok) {
        const data = await response.json();
        const quote =
          selectedType === "crypto"
            ? data.cryptoQuote
            : data.quotes && data.quotes[symbol];

        if (quote && quote.currentPrice && quote.currentPrice > 0) {
          form.setValue("purchasePrice", quote.currentPrice);
          toast({
            title: "Price fetched",
            description: `Current price: $${quote.currentPrice.toFixed(
              selectedType === "crypto" ? 4 : 2
            )}`,
          });
        } else {
          toast({
            title: "Price not available",
            description:
              "Could not fetch current price. Please enter manually.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching price:", error);
      toast({
        title: "Error fetching price",
        description: "Failed to fetch current price. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setFetchingPrice(false);
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion: any) => {
    if (selectedType === "crypto") {
      form.setValue("name", suggestion.name);
      form.setValue("symbol", suggestion.symbol);
    } else {
      form.setValue("name", suggestion.description);
      form.setValue("symbol", suggestion.symbol);
    }
    setSuggestions([]);
    fetchCurrentPrice(suggestion.symbol);
  };

  // Render type-specific fields
  const renderTypeSpecificFields = () => {
    switch (selectedType) {
      case "stocks":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="sector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sector (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      placeholder="e.g., Technology, Healthcare"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dividend"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Dividend (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || undefined)
                      }
                    />
                  </FormControl>
                  <FormDescription>Dividend per share</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "etf":
      case "mutual_funds":
        return (
          <FormField
            control={form.control}
            name="expenseRatio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expense Ratio (%) (Optional)</FormLabel>
                <FormControl>
                  <Input
                    className="h-11"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || undefined)
                    }
                  />
                </FormControl>
                <FormDescription>Annual management fee</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "crypto":
        return (
          <FormField
            control={form.control}
            name="blockchain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blockchain (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select blockchain" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Bitcoin">Bitcoin</SelectItem>
                    <SelectItem value="Ethereum">Ethereum</SelectItem>
                    <SelectItem value="Binance Smart Chain">
                      Binance Smart Chain
                    </SelectItem>
                    <SelectItem value="Solana">Solana</SelectItem>
                    <SelectItem value="Cardano">Cardano</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "real_estate":
        return (
          <FormField
            control={form.control}
            name="propertyType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="reit">REIT</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "options":
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="strikePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strike Price</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="optionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Option Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="put">Put</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiration Date</FormLabel>
                  <FormControl>
                    <Input className="h-11" type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "bonds":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="issuer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issuer</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      placeholder="e.g., US Treasury, Apple Inc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="faceValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Face Value (per bond)</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="1000"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || undefined)
                      }
                    />
                  </FormControl>
                  <FormDescription>Par value per unit</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="couponRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coupon Rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="5.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="couponFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coupon Frequency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maturityDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maturity Date</FormLabel>
                  <FormControl>
                    <Input className="h-11" type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="creditRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Rating (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      placeholder="e.g., AAA, AA+, BBB"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="yieldToMaturity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yield to Maturity (%) (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="4.25"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Input</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || "percent_of_par"}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select pricing method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percent_of_par">
                        Percent of Par (Clean)
                      </SelectItem>
                      <SelectItem value="absolute">
                        Absolute Price per Bond
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    If percent of par, purchase price per unit will be computed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Show clean price percent when using percent_of_par */}
            {form.watch("priceType") !== "absolute" && (
              <FormField
                control={form.control}
                name="cleanPricePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clean Price (%)</FormLabel>
                    <FormControl>
                      <Input
                        className="h-11"
                        type="number"
                        step="0.01"
                        min="0"
                        max="500"
                        placeholder="98.50"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || undefined)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Example: 98.5 means 98.5% of par value per bond.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const onSubmit = async (data: InvestmentFormData) => {
    setLoading(true);
    try {
      const url = investment
        ? `/api/investments/${investment.id}`
        : "/api/investments";
      const method = investment ? "PUT" : "POST";

      // Compute bond purchase price from percent-of-par if applicable
      let computedPurchasePrice = data.purchasePrice;
      if (data.type === "bonds" && data.priceType !== "absolute") {
        const fv = data.faceValue;
        const pct = data.cleanPricePercent;
        if (fv && pct !== undefined) {
          computedPurchasePrice = (fv * pct) / 100;
        }
      }

      // Transform the data to match the API schema
      const transformedData: any = {
        ...data,
        // Convert purchasePrice to currencyAmountSchema format
        purchasePrice: {
          amount: computedPurchasePrice,
          currency: data.currency,
        },
        // Clean up undefined/empty values for type-specific fields
        ...(data.sector && {
          stockData: {
            sector: data.sector,
            ...(data.dividend && {
              dividend: { amount: data.dividend, currency: data.currency },
            }),
          },
        }),
        ...(data.expenseRatio &&
          (selectedType === "etf"
            ? { etfData: { expenseRatio: data.expenseRatio } }
            : { mutualFundData: { expenseRatio: data.expenseRatio } })),
        ...(data.blockchain && { cryptoData: { blockchain: data.blockchain } }),
        ...(data.propertyType && {
          realEstateData: { propertyType: data.propertyType },
        }),
        ...(data.strikePrice &&
          data.optionType && {
            optionData: {
              strikePrice: {
                amount: data.strikePrice,
                currency: data.currency,
              },
              optionType: data.optionType,
              ...(data.expirationDate && {
                expirationDate: data.expirationDate,
              }),
              premium: { amount: data.purchasePrice, currency: data.currency }, // Use purchase price as premium for options
              underlyingSymbol: data.symbol || data.name,
            },
          }),
        // Bonds mapping
        ...(data.type === "bonds" &&
          (data.faceValue || data.couponRate || data.maturityDate) && {
            bondData: {
              ...(data.issuer ? { issuer: data.issuer } : {}),
              faceValue: { amount: data.faceValue || 0, currency: data.currency },
              couponRate: data.couponRate || 0,
              maturityDate: data.maturityDate,
              ...(data.yieldToMaturity !== undefined
                ? { yieldToMaturity: data.yieldToMaturity }
                : {}),
              ...(data.creditRating ? { creditRating: data.creditRating } : {}),
              ...(data.couponFrequency ? { couponFrequency: data.couponFrequency } : {}),
              ...(form.getValues("dayCountConvention")
                ? { dayCountConvention: form.getValues("dayCountConvention") as any }
                : {}),
              ...(data.priceType ? { priceType: data.priceType } : {}),
              ...(data.cleanPricePercent !== undefined
                ? { cleanPricePercent: data.cleanPricePercent }
                : {}),
            },
          }),
      };

      // Remove the flattened type-specific fields from the main object
      const {
        sector,
        dividend,
        expenseRatio,
        blockchain,
        propertyType,
        strikePrice,
        optionType,
        expirationDate,
        // Bond flat fields
        issuer,
        faceValue,
        couponRate,
        couponFrequency,
        maturityDate,
        creditRating,
        yieldToMaturity,
        priceType,
        cleanPricePercent,
        ...cleanData
      } = transformedData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save investment");
      }

      toast({
        title: investment ? "Investment updated" : "Investment added",
        description: `${data.name} has been ${
          investment ? "updated" : "added to"
        } your portfolio.`,
      });

      onSaved();
    } catch (error) {
      console.error("Error saving investment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save investment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load investment data when editing
  useEffect(() => {
    if (investment) {
      const purchaseDateString = investment.purchaseDate?.toDate
        ? investment.purchaseDate.toDate().toISOString().split("T")[0]
        : new Date(investment.purchaseDate as any).toISOString().split("T")[0];

      setSelectedType(investment.type);
      form.reset({
        name: investment.name,
        type: investment.type,
        symbol: investment.symbol || "",
        quantity: investment.quantity,
        purchasePrice: investment.purchasePrice.amount,
        currency: (() => {
          const dbCurrency =
            investment.purchasePrice.currency || investment.currency || "USD";
          // Validate currency using the schema
          try {
            return currencyCodeSchema.parse(dbCurrency);
          } catch {
            return "USD"; // Fallback to USD if invalid
          }
        })(),
        purchaseDate: purchaseDateString,
        description: investment.description || "",
        // Add type-specific data if available
        sector: investment.stockData?.sector || "",
        dividend: investment.stockData?.dividend?.amount || undefined,
        expenseRatio:
          investment.etfData?.expenseRatio ||
          investment.mutualFundData?.expenseRatio ||
          undefined,
        blockchain: investment.cryptoData?.blockchain || "",
        propertyType: investment.realEstateData?.propertyType || undefined,
        strikePrice: investment.optionData?.strikePrice?.amount || undefined,
        expirationDate: investment.optionData?.expirationDate?.toDate
          ? investment.optionData.expirationDate
              .toDate()
              .toISOString()
              .split("T")[0]
          : "",
        optionType: investment.optionData?.optionType || undefined,
        // Bonds prefill
        issuer: investment.bondData?.issuer || "",
        faceValue: investment.bondData?.faceValue?.amount || undefined,
        couponRate: investment.bondData?.couponRate || undefined,
        couponFrequency: investment.bondData?.couponFrequency || undefined,
        maturityDate: investment.bondData?.maturityDate?.toDate
          ? investment.bondData.maturityDate.toDate().toISOString().split("T")[0]
          : "",
        creditRating: investment.bondData?.creditRating || "",
        yieldToMaturity: investment.bondData?.yieldToMaturity || undefined,
        priceType: (investment.bondData as any)?.priceType || "percent_of_par",
        cleanPricePercent: (investment.bondData as any)?.cleanPricePercent || undefined,
      });
    } else {
      setSelectedType(defaultType);
      form.reset({
        name: "",
        type: defaultType,
        symbol: "",
        quantity: 1,
        purchasePrice: 0,
        currency: "USD",
        purchaseDate: new Date().toISOString().split("T")[0],
        description: "",
      });
    }
  }, [investment, form, defaultType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">
            {investment ? "Edit Investment" : "Add New Investment"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {investment
              ? "Update your investment details below."
              : "Add a new investment to your portfolio."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Investment Type Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  1
                </div>
                <h3 className="text-lg font-semibold">Investment Type</h3>
              </div>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedType(value as InvestmentType);
                          setSuggestions([]);
                        }}
                        defaultValue={field.value}
                      >
                        <SelectTrigger
                          className="text-left w-[300px]  px-4"
                          size="taller"
                        >
                          <SelectValue placeholder="Choose investment type" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {investmentTypes.map((type) => (
                            <SelectItem
                              key={type.value}
                              value={type.value}
                              className="py-3"
                            >
                              <div className="flex flex-col items-start gap-1 py-2">
                                <span className="font-medium">
                                  {type.label}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {type.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  2
                </div>
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>

              {/* Investment Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Investment Name
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <Input
                            className="h-12 text-base"
                            placeholder={
                              selectedType === "crypto"
                                ? "e.g., Bitcoin, Ethereum"
                                : selectedType === "stocks" ||
                                  selectedType === "etf"
                                ? "e.g., Apple Inc., Microsoft Corporation"
                                : "Enter investment name"
                            }
                            {...field}
                          />
                          {currentTypeConfig?.hasSearch && (
                            <Button
                              type="button"
                              variant="outline"
                              size="default"
                              className="h-12 px-6"
                              disabled={
                                !field.value ||
                                field.value.length < 2 ||
                                searchingCompany
                              }
                              onClick={() => searchInvestments(field.value)}
                            >
                              {searchingCompany ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Search className="h-4 w-4 mr-2" />
                                  Search
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Search Results */}
                        {suggestions.length > 0 && (
                          <div className="border rounded-lg bg-card shadow-sm">
                            <div className="p-4 border-b bg-muted/30">
                              <p className="text-sm font-medium">
                                Search Results
                              </p>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  className="w-full p-4 text-left hover:bg-accent transition-colors border-b last:border-b-0 focus:bg-accent focus:outline-none"
                                  onClick={() => selectSuggestion(suggestion)}
                                >
                                  <div className="font-medium text-base">
                                    {selectedType === "crypto"
                                      ? suggestion.name
                                      : suggestion.description}
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    Symbol: {suggestion.symbol}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription className="text-sm">
                      {currentTypeConfig?.hasSearch
                        ? "Enter a name and click search for suggestions"
                        : "Enter the investment name"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Symbol field - only show for relevant types */}
              {currentTypeConfig?.hasSymbol && (
                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Symbol (Optional)
                        <span className="text-sm text-muted-foreground ml-2 font-normal">
                          For price updates
                        </span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-3">
                          <Input
                            className="h-12 text-base"
                            placeholder={
                              selectedType === "crypto"
                                ? "e.g., BTC, ETH, ADA"
                                : "e.g., AAPL, MSFT, TSLA"
                            }
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="default"
                            className="h-12 px-6"
                            disabled={!field.value || fetchingPrice}
                            onClick={() => fetchCurrentPrice(field.value || "")}
                          >
                            {fetchingPrice ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <DollarSign className="h-4 w-4 mr-2" />
                                Get Price
                              </>
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription className="text-sm">
                        Enter symbol to fetch current market price
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Quantity, Price, Currency, Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Quantity
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 text-base"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription className="text-sm">
                        Number of shares/units
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchasePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Purchase Price
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            className="h-12 text-base"
                            type="number"
                            min="0"
                            placeholder="0.00"
                            step="0.00001"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            disabled={fetchingPrice}
                          />
                          {fetchingPrice && (
                            <Loader2 className="absolute right-4 top-4 h-4 w-4 animate-spin" />
                          )}
                        </div>
                      </FormControl>
                      <FormDescription className="text-sm">
                        Price per share/unit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Currency
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {/* Major currencies first */}
                          {MAJOR_CURRENCIES.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.code} ({currency.symbol}) - {currency.name}
                            </SelectItem>
                          ))}
                          
                          {/* Separator for other currencies */}
                          <div className="px-2 py-1 text-xs text-muted-foreground border-t mt-1 pt-2">
                            Other Currencies
                          </div>
                          
                          {/* All other supported currencies */}
                          {getAllSupportedCurrencies()
                            .filter(code => !MAJOR_CURRENCIES.some(major => major.code === code))
                            .sort()
                            .map((code) => (
                              <SelectItem key={code} value={code}>
                                {code}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-sm">
                        Investment currency
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Purchase Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 text-base"
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-sm">
                        Date of purchase
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Type-specific fields */}
            {selectedType !== "other" && renderTypeSpecificFields() && (
              <>
                <Separator />
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      3
                    </div>
                    <h3 className="text-lg font-semibold">
                      {currentTypeConfig?.label} Details
                    </h3>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-6">
                    {renderTypeSpecificFields()}
                  </div>
                </div>
              </>
            )}

            {/* Description */}
            <Separator />
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {selectedType !== "other" && renderTypeSpecificFields()
                    ? "4"
                    : "3"}
                </div>
                <h3 className="text-lg font-semibold">Additional Notes</h3>
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Description (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about this investment..."
                        className="resize-none min-h-[120px] text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-sm">
                      Any additional information about this investment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-6 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="h-11 px-6"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="h-11 px-6">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {investment ? "Update Investment" : "Add Investment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
