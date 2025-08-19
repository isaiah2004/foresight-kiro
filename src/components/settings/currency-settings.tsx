"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Globe, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { currencyService } from "@/lib/services/currency-service";
import type { Currency, UserPreferences } from "@/types/financial";

interface CurrencySettingsProps {
  className?: string;
}

export function CurrencySettings({ className }: CurrencySettingsProps) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [previewAmount, setPreviewAmount] = useState<number>(1000);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load user preferences and supported currencies in parallel
        const [preferencesResponse, supportedCurrencies] = await Promise.all([
          fetch("/api/user/preferences"),
          currencyService.getSupportedCurrencies(),
        ]);

        if (preferencesResponse.ok) {
          const { preferences: userPrefs } = await preferencesResponse.json();
          setPreferences(userPrefs);
          setSelectedCurrency(userPrefs.primaryCurrency);
        }

        setCurrencies(supportedCurrencies);
      } catch (error) {
        console.error("Error loading currency settings:", error);
        toast({
          title: "Error",
          description: "Failed to load currency settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
  };

  const handleSave = async () => {
    if (!preferences || selectedCurrency === preferences.primaryCurrency) {
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          primaryCurrency: selectedCurrency,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      // Update local state
      setPreferences((prev) =>
        prev ? { ...prev, primaryCurrency: selectedCurrency } : null
      );

      // Trigger currency context refresh
      localStorage.setItem('primaryCurrencyChanged', Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'primaryCurrencyChanged',
        newValue: Date.now().toString()
      }));

      toast({
        title: "Success",
        description: "Primary currency updated successfully!",
      });
    } catch (error) {
      console.error("Error updating currency:", error);
      toast({
        title: "Error",
        description: "Failed to update primary currency",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoDetect = async () => {
    try {
      setIsLoading(true);

      // Try to detect currency from user's location
      const response = await fetch("/api/currencies/detect?countryCode=US"); // You could get actual country from browser

      if (response.ok) {
        const { detectedCurrency } = await response.json();
        setSelectedCurrency(detectedCurrency);
        toast({
          title: "Currency Detected",
          description: `Detected currency: ${detectedCurrency}`,
        });
      }
    } catch (error) {
      console.error("Error auto-detecting currency:", error);
      toast({
        title: "Error",
        description: "Failed to auto-detect currency",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCurrencyInfo = currencies.find(
    (c) => c.code === selectedCurrency
  );
  const hasChanges =
    preferences && selectedCurrency !== preferences.primaryCurrency;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Currency Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Currency Settings
        </CardTitle>
        <CardDescription>
          Set your primary currency for displaying financial data. All amounts
          will be converted to this currency.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Primary Currency */}
        {preferences && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-sm font-medium">
                Current Primary Currency
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="font-mono">
                  {preferences.primaryCurrency}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {
                    currencies.find(
                      (c) => c.code === preferences.primaryCurrency
                    )?.name
                  }
                </span>
              </div>
            </div>
            <Check className="h-5 w-5 text-green-600" />
          </div>
        )}

        {/* Currency Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="currency-select">Select Primary Currency</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoDetect}
              disabled={isLoading}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Auto-detect
            </Button>
          </div>

          <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
            <SelectTrigger id="currency-select">
              <SelectValue placeholder="Choose a currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                      {currency.code}
                    </span>
                    <span className="font-medium">{currency.symbol}</span>
                    <span className="text-muted-foreground">
                      {currency.name}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Currency Preview */}
        {selectedCurrencyInfo && (
          <div className="p-4 border rounded-lg space-y-2">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="text-2xl font-bold">
              {currencyService.formatCurrency(previewAmount, selectedCurrency)}
            </div>
            <div className="text-sm text-muted-foreground">
              Sample amount in {selectedCurrencyInfo.name}
            </div>
          </div>
        )}

        {/* Currency Info */}
        {selectedCurrencyInfo && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-xs text-muted-foreground">Symbol</Label>
              <div className="font-medium">{selectedCurrencyInfo.symbol}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Decimal Places
              </Label>
              <div className="font-medium">
                {selectedCurrencyInfo.decimalPlaces}
              </div>
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Countries</Label>
              <div className="text-sm">
                {selectedCurrencyInfo.countries.join(", ")}
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          {hasChanges && (
            <Button
              variant="outline"
              onClick={() =>
                setSelectedCurrency(preferences?.primaryCurrency || "USD")
              }
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="min-w-[100px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
