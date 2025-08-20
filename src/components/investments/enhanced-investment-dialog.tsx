"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, DollarSign, Globe, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/contexts/currency-context";

// Currency display mapping for major currencies
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
];

// Enhanced validation schema with currency auto-detection
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
  // Exchange/market information
  exchange: z.string().optional(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;
type CurrencyCode = z.infer<typeof currencyCodeSchema>;

interface EnhancedInvestmentDialogProps {
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

export function EnhancedInvestmentDialog({
  open,
  onOpenChange,
  investment,
  onSaved,
  defaultType = "stocks",
}: EnhancedInvestmentDialogProps) {
  const { toast } = useToast();
  const { primaryCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [searchingCompany, setSearchingCompany] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{ symbol: string; description: string; name?: string }>
  >([]);
  const [selectedType, setSelectedType] = useState<InvestmentType>(defaultType);
  const [detectedCurrency, setDetectedCurrency] = useState<CurrencyCode | null>(null);

  const getSafeCurrency = (code: string | undefined | null): CurrencyCode => {
    try {
      return currencyCodeSchema.parse(code ?? 'USD');
    } catch {
      return 'USD';
    }
  };

  const form = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      name: "",
      type: defaultType,
      symbol: "",
      quantity: 1,
      purchasePrice: 0,
  currency: getSafeCurrency(primaryCurrency),
      purchaseDate: new Date().toISOString().split("T")[0],
      description: "",
      exchange: "",
    },
  });

  const currentTypeConfig = investmentTypes.find(
    (t) => t.value === selectedType
  );

  // Auto-detect currency based on symbol and market
  const detectCurrencyFromSymbol = async (symbol: string): Promise<CurrencyCode> => {
    try {
      // For crypto, always USD
      if (selectedType === "crypto") {
        return "USD";
      }

      // Detect currency from market suffix
  const marketCurrencyMap: Record<string, CurrencyCode> = {
        '.L': 'GBP',    // London Stock Exchange
        '.TO': 'CAD',   // Toronto Stock Exchange
        '.T': 'JPY',    // Tokyo Stock Exchange
        '.HK': 'HKD',   // Hong Kong Stock Exchange
        '.AX': 'AUD',   // Australian Securities Exchange
        '.PA': 'EUR',   // Euronext Paris
        '.DE': 'EUR',   // XETRA
        '.MI': 'EUR',   // Borsa Italiana
        '.AS': 'EUR',   // Euronext Amsterdam
        '.BR': 'EUR',   // Euronext Brussels
        '.SW': 'CHF',   // SIX Swiss Exchange
        '.ST': 'SEK',   // Nasdaq Stockholm
        '.OL': 'NOK',   // Oslo Stock Exchange
        '.CO': 'DKK',   // Nasdaq Copenhagen
        '.SI': 'SGD',   // Singapore Exchange
        '.KS': 'KRW',   // Korea Exchange
        '.SS': 'CNY',   // Shanghai Stock Exchange
        '.SZ': 'CNY',   // Shenzhen Stock Exchange
        '.NS': 'INR',   // National Stock Exchange of India
        '.BO': 'INR',   // Bombay Stock Exchange
      };

      for (const [suffix, currency] of Object.entries(marketCurrencyMap)) {
        if (symbol.endsWith(suffix)) {
          return currency as CurrencyCode;
        }
      }

      // Default to USD for US markets or unknown symbols
  return 'USD';
    } catch (error) {
      console.error('Error detecting currency:', error);
  return 'USD';
    }
  };

  // Get exchange name from symbol suffix
  const getExchangeFromSymbol = (symbol: string): string => {
    const exchangeMap: { [suffix: string]: string } = {
      '.L': 'London Stock Exchange (LSE)',
      '.TO': 'Toronto Stock Exchange (TSX)',
      '.T': 'Tokyo Stock Exchange (TSE)',
      '.HK': 'Hong Kong Stock Exchange (HKEX)',
      '.AX': 'Australian Securities Exchange (ASX)',
      '.PA': 'Euronext Paris',
      '.DE': 'XETRA (Frankfurt)',
      '.MI': 'Borsa Italiana (Milan)',
      '.AS': 'Euronext Amsterdam',
      '.BR': 'Euronext Brussels',
      '.SW': 'SIX Swiss Exchange',
      '.ST': 'Nasdaq Stockholm',
      '.OL': 'Oslo Stock Exchange',
      '.CO': 'Nasdaq Copenhagen',
      '.SI': 'Singapore Exchange (SGX)',
      '.KS': 'Korea Exchange (KRX)',
      '.SS': 'Shanghai Stock Exchange (SSE)',
      '.SZ': 'Shenzhen Stock Exchange (SZSE)',
      '.NS': 'National Stock Exchange of India (NSE)',
      '.BO': 'Bombay Stock Exchange (BSE)',
    };

    for (const [suffix, exchange] of Object.entries(exchangeMap)) {
      if (symbol.endsWith(suffix)) {
        return exchange;
      }
    }

    return selectedType === "crypto" ? "Cryptocurrency Exchange" : "NASDAQ/NYSE";
  };

  // Search function with enhanced currency detection
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

  // Fetch current price with enhanced currency auto-detection
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
          // Auto-detect and set currency
          const detectedCurrency = await detectCurrencyFromSymbol(symbol);
          const detectedExchange = getExchangeFromSymbol(symbol);
          
          form.setValue("currency", detectedCurrency as CurrencyCode);
          form.setValue("exchange", detectedExchange);
          form.setValue("purchasePrice", quote.currentPrice);
          setDetectedCurrency(detectedCurrency);
          
          toast({
            title: "Price fetched",
            description: `Current price: ${quote.currentPrice.toFixed(
              selectedType === "crypto" ? 4 : 2
            )} ${detectedCurrency}`,
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

  // Handle suggestion selection with currency detection
  const selectSuggestion = async (suggestion: any) => {
    if (selectedType === "crypto") {
      form.setValue("name", suggestion.name);
      form.setValue("symbol", suggestion.symbol);
    } else {
      form.setValue("name", suggestion.description);
      form.setValue("symbol", suggestion.symbol);
    }
    
    // Auto-detect currency and exchange
  const detectedCurrency = await detectCurrencyFromSymbol(suggestion.symbol);
    const detectedExchange = getExchangeFromSymbol(suggestion.symbol);
    
  form.setValue("currency", detectedCurrency as CurrencyCode);
    form.setValue("exchange", detectedExchange);
    setDetectedCurrency(detectedCurrency);
    
    setSuggestions([]);
    fetchCurrentPrice(suggestion.symbol);
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (investment) {
        // Editing existing investment
        form.reset({
          name: investment.name,
          type: investment.type,
          symbol: investment.symbol || "",
          quantity: investment.quantity,
          purchasePrice: investment.purchasePrice.amount,
          currency: getSafeCurrency(
            (investment as any).currency || investment.purchasePrice.currency
          ),
          purchaseDate: investment.purchaseDate.toDate().toISOString().split("T")[0],
          description: investment.description || "",
          exchange: investment.exchange || "",
        });
        setSelectedType(investment.type);
        setDetectedCurrency(
          getSafeCurrency(
            (investment as any).currency || investment.purchasePrice.currency
          )
        );
      } else {
        // Creating new investment
        form.reset({
          name: "",
          type: defaultType,
          symbol: "",
          quantity: 1,
          purchasePrice: 0,
          currency: getSafeCurrency(primaryCurrency),
          purchaseDate: new Date().toISOString().split("T")[0],
          description: "",
          exchange: "",
        });
        setSelectedType(defaultType);
        setDetectedCurrency(null);
      }
    }
  }, [open, investment, form, defaultType, primaryCurrency]);

  const onSubmit: SubmitHandler<InvestmentFormData> = async (data) => {
    setLoading(true);
    try {
      const url = investment
        ? `/api/investments/${investment.id}`
        : "/api/investments";
      const method = investment ? "PUT" : "POST";

      // Transform the data to match the API schema
      const transformedData: any = {
        ...data,
        // Convert purchasePrice to currencyAmountSchema format
        purchasePrice: {
          amount: data.purchasePrice,
          currency: data.currency as CurrencyCode,
        },
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save investment");
      }

      toast({
        title: investment ? "Investment updated" : "Investment added",
        description: `${data.name} has been ${
          investment ? "updated" : "added to your portfolio"
        }.`,
      });

      onSaved();
    } catch (error) {
      console.error("Error saving investment:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save investment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {investment ? "Edit Investment" : "Add New Investment"}
          </DialogTitle>
          <DialogDescription>
            {investment
              ? "Update your investment details"
              : "Add a new investment to your portfolio with automatic currency detection"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Investment Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedType(value as InvestmentType);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select investment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {investmentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col">
                            <span>{type.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {type.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Symbol Search (for applicable types) */}
            {currentTypeConfig?.hasSymbol && (
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Symbol {currentTypeConfig.hasSearch && "(Search)"}
                    </FormLabel>
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <FormControl>
                          <Input
                            className="h-11"
                            placeholder={
                              selectedType === "crypto"
                                ? "e.g., BTC, ETH, ADA"
                                : "e.g., AAPL, GOOGL, TSLA.L"
                            }
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              if (currentTypeConfig.hasSearch) {
                                searchInvestments(e.target.value);
                              }
                            }}
                          />
                        </FormControl>
                        {field.value && (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 px-6"
                            disabled={!field.value || fetchingPrice}
                            onClick={() => fetchCurrentPrice(field.value || "")}
                          >
                            {fetchingPrice ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <DollarSign className="h-4 w-4" />
                            )}
                            {fetchingPrice ? "Fetching..." : "Get Price"}
                          </Button>
                        )}
                      </div>

                      {/* Search Suggestions */}
                      {suggestions.length > 0 && (
                        <div className="border rounded-md bg-background shadow-lg">
                          {suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              className="w-full px-3 py-2 text-left hover:bg-muted flex justify-between items-center"
                              onClick={() => selectSuggestion(suggestion)}
                            >
                              <div>
                                <div className="font-medium">
                                  {selectedType === "crypto"
                                    ? suggestion.name
                                    : suggestion.description}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {suggestion.symbol}
                                </div>
                              </div>
                              <Search className="h-4 w-4 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      )}

                      {searchingCompany && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Searching...</span>
                        </div>
                      )}
                    </div>
                    <FormDescription>
                      {selectedType === "crypto"
                        ? "Enter the cryptocurrency symbol (e.g., BTC for Bitcoin)"
                        : "Enter the stock symbol. Use suffixes for international markets (e.g., AAPL.L for London)"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Investment Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Name</FormLabel>
                  <FormControl>
                    <Input
                      className="h-11"
                      placeholder="e.g., Apple Inc., Bitcoin"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity, Price, Currency, Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        className="h-11"
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price</FormLabel>
                    <FormControl>
                      <Input
                        className="h-11"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Currency
                      {detectedCurrency && (
                        <Badge variant="secondary" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          Auto-detected
                        </Badge>
                      )}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MAJOR_CURRENCIES.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            <div className="flex items-center gap-2">
                              <span>{currency.symbol}</span>
                              <span>{currency.code}</span>
                              <span className="text-muted-foreground">
                                {currency.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <FormControl>
                      <Input className="h-11" type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Exchange Information */}
            {form.watch("exchange") && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Exchange:</strong> {form.watch("exchange")}
                  <br />
                  <strong>Currency:</strong> {form.watch("currency")}
                </AlertDescription>
              </Alert>
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[80px]"
                      placeholder="Add any additional notes about this investment..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
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