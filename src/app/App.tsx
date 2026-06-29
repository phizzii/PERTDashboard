import { useState, useMemo } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { DashboardFilters, FilterState } from "./components/DashboardFilters";
import { SalesTrendChart } from "./components/SalesTrendChart";
import { RevenueBreakdownChart } from "./components/RevenueBreakdownChart";
import { YoYGrowthChart } from "./components/YoYGrowthChart";
import { PerformanceMetricsChart } from "./components/PerformanceMetricsChart";
import { RegionSalesChart } from "./components/RegionSalesChart";
import { sampleData, categories, regions, DataPoint } from "./data/sampleData";
import { Card, CardContent } from "./components/ui/card";
import { BarChart3, TrendingUp, Users, DollarSign, Filter, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function App() {
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    region: "all",
    timePeriod: "all"
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");

  // Filter data based on current filters and selections
  const filteredData = useMemo(() => {
    return sampleData.filter((item: DataPoint) => {
      const categoryMatch = filters.category === "all" || item.category === filters.category;
      const regionMatch = filters.region === "all" || item.region === filters.region;
      
      let timePeriodMatch = true;
      if (filters.timePeriod !== "all") {
        if (filters.timePeriod === "2024" || filters.timePeriod === "2023") {
          timePeriodMatch = item.year === parseInt(filters.timePeriod);
        } else if (filters.timePeriod.startsWith("Q")) {
          timePeriodMatch = item.quarter === filters.timePeriod && item.year === 2024;
        }
      }

      const selectedCategoryMatch = !selectedCategory || item.category === selectedCategory;
      const selectedRegionMatch = !selectedRegion || item.region === selectedRegion;

      return categoryMatch && regionMatch && timePeriodMatch && selectedCategoryMatch && selectedRegionMatch;
    });
  }, [filters, selectedCategory, selectedRegion]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const currentYearData = filteredData.filter(item => item.year === 2024);
    const totalRevenue = currentYearData.reduce((sum, item) => sum + item.revenue, 0);
    const totalSales = currentYearData.reduce((sum, item) => sum + item.sales, 0);
    const totalCustomers = currentYearData.reduce((sum, item) => sum + item.customers, 0);
    const totalUnits = currentYearData.reduce((sum, item) => sum + item.units, 0);

    const previousYearData = filteredData.filter(item => item.year === 2023);
    const previousRevenue = previousYearData.reduce((sum, item) => sum + item.revenue, 0);
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalSales,
      totalCustomers,
      totalUnits,
      revenueGrowth
    };
  }, [filteredData]);

  const handleChartClick = (data: any) => {
    if (data.category) {
      setSelectedCategory(selectedCategory === data.category ? "" : data.category);
    }
    if (data.region) {
      setSelectedRegion(selectedRegion === data.region ? "" : data.region);
    }
  };

  const clearSelections = () => {
    setSelectedCategory("");
    setSelectedRegion("");
  };

  const [showPassword, setShowPassword] = useState(false);

  return <RouterProvider router={router} />;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "#F8F9FA", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Geometric background accents */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, #e8ecf4 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #dce3ef 0%, transparent 70%)" }}
        />
        <svg
          className="absolute top-16 right-24 opacity-10"
          width="120" height="120" viewBox="0 0 120 120"
        >
          <rect x="10" y="10" width="40" height="40" rx="6" fill="#1B2A4A" />
          <rect x="60" y="10" width="40" height="40" rx="6" fill="#1B2A4A" opacity="0.5" />
          <rect x="10" y="60" width="40" height="40" rx="6" fill="#1B2A4A" opacity="0.5" />
          <rect x="60" y="60" width="40" height="40" rx="6" fill="#1B2A4A" opacity="0.25" />
        </svg>
        <svg
          className="absolute bottom-20 left-20 opacity-10"
          width="80" height="80" viewBox="0 0 80 80"
        >
          <circle cx="40" cy="40" r="30" stroke="#1B2A4A" strokeWidth="2" fill="none" />
          <circle cx="40" cy="40" r="18" stroke="#1B2A4A" strokeWidth="2" fill="none" />
          <circle cx="40" cy="40" r="6" fill="#1B2A4A" />
        </svg>
      </div>

      {/* Login card */}
      <div
        className="relative w-full max-w-md bg-white flex flex-col items-center"
        style={{
          borderRadius: "16px",
          boxShadow: "0 4px 6px -1px rgba(27,42,74,0.06), 0 20px 60px -8px rgba(27,42,74,0.14), 0 0 0 1px rgba(27,42,74,0.04)",
          padding: "48px 40px 36px",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-center mb-6 transition-transform duration-300 hover:scale-105"
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1B2A4A 0%, #2d4278 100%)",
            boxShadow: "0 8px 24px rgba(27,42,74,0.28)",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 26 L16 6 L26 26" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.5 20 L22.5 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="6" r="2" fill="white" />
          </svg>
        </div>

        {/* Heading */}
        <h1
          className="text-center font-semibold mb-1"
          style={{ fontSize: "26px", color: "#1B2A4A", letterSpacing: "-0.3px" }}
        >
          Welcome Back
        </h1>
        <p
          className="text-center mb-8"
          style={{ fontSize: "14px", color: "#636e72", lineHeight: 1.5 }}
        >
          Sign in to manage your PERT projects
        </p>

        {/* Form */}
        <form className="w-full flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "#2D3436" }}
            >
              Email
            </label>
            <div className="relative group">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200"
                style={{ color: "#b2bec3" }}
              />
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  border: "1.5px solid #e0e4ed",
                  color: "#2D3436",
                  background: "#fafbfc",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#1B2A4A";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(27,42,74,0.1)";
                  e.currentTarget.style.background = "#fff";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e0e4ed";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "#fafbfc";
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "#2D3436" }}
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "#b2bec3" }}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  border: "1.5px solid #e0e4ed",
                  color: "#2D3436",
                  background: "#fafbfc",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#1B2A4A";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(27,42,74,0.1)";
                  e.currentTarget.style.background = "#fff";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e0e4ed";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "#fafbfc";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity duration-150 hover:opacity-70"
                style={{ color: "#b2bec3", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between mt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded"
                style={{ accentColor: "#1B2A4A" }}
              />
              <span className="text-sm" style={{ color: "#636e72" }}>Remember me</span>
            </label>
            <a
              href="#"
              className="text-sm font-medium transition-colors duration-150"
              style={{ color: "#1B2A4A" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2d4278")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#1B2A4A")}
              onClick={(e) => e.preventDefault()}
            >
              Forgot password?
            </a>
          </div>

          {/* Sign In button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl text-sm font-semibold text-white mt-2 transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #1B2A4A 0%, #2d4278 100%)",
              boxShadow: "0 4px 14px rgba(27,42,74,0.3)",
              letterSpacing: "0.2px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(27,42,74,0.38)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(27,42,74,0.3)";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(27,42,74,0.25)";
            }}
          >
            Sign In
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px" style={{ background: "#e8ecf4" }} />
            <span className="text-xs" style={{ color: "#b2bec3" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "#e8ecf4" }} />
          </div>

          {/* Register button */}
          <button
            type="button"
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              border: "1.5px solid #1B2A4A",
              color: "#1B2A4A",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(27,42,74,0.05)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Register
          </button>
        </form>

        {/* Footer */}
        <p
          className="mt-8 text-center"
          style={{ fontSize: "12px", color: "#b2bec3" }}
        >
          PERT Optimiser © 2026
        </p>
      </div>
    </div>
  );
}