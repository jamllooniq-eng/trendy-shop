import React from 'react';
import { RolemallProduct, OrderResult, PolicyType } from '../../types';
import { FunnelHeader } from './FunnelHeader';
import { FunnelSteps } from './FunnelSteps';
import { ProductGallery } from './ProductGallery';
import { ProductDetailsBox } from './ProductDetailsBox';
import { ProductFAQ } from './ProductFAQ';
import { StickyBottomBar } from './StickyBottomBar';
import { OrderForm } from '../order/OrderForm';
import { 
  Truck, 
  ShieldCheck, 
  Sparkles, 
  ShoppingBag,
  RefreshCw,
  Banknote,
  CheckCircle2,
  Headphones,
  Heart
} from 'lucide-react';

interface FunnelLandingPageProps {
  product: RolemallProduct;
  allProducts?: RolemallProduct[];
  onBackToHome: () => void;
  onSelectProduct?: (product: RolemallProduct) => void;
  onOrderSuccess: (
    result: OrderResult,
    orderDetails: {
      product: RolemallProduct;
      quantity: number;
      name: string;
      phone: string;
      governorate: string;
      address: string;
      totalPrice: number;
    }
  ) => void;
  onOpenPolicy: (type: PolicyType) => void;
}

export const FunnelLandingPage: React.FC<FunnelLandingPageProps> = ({
  product,
  allProducts,
  onBackToHome,
  onSelectProduct,
  onOrderSuccess,
  onOpenPolicy,
}) => {
  const scrollToOrder = () => {
    const formElement = document.getElementById('order-form-card') || document.getElementById('order-form-container');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const discountAmount = product.old_price && product.old_price > product.price
    ? product.old_price - product.price
    : null;

  const discountPercentage = product.old_price && product.old_price > product.price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : null;

  return (
    <div className="min-h-screen bg-white text-black font-['Cairo',sans-serif] flex flex-col selection:bg-[#8B5E3C] selection:text-white">
      {/* 1. High-Converting Funnel Minimal Header */}
      <FunnelHeader onScrollToOrder={scrollToOrder} />

      {/* Main Funnel Landing Content */}
      <main className="flex-1 min-w-0">
        <div className="max-w-4xl lg:max-w-6xl mx-auto px-3 sm:px-6 pt-4 pb-6 sm:pt-5 sm:pb-8 space-y-6 sm:space-y-8 min-w-0">
          
          {/* Two-Column Section on Desktop (lg:), Sequential on Mobile/Tablet */}
          <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start min-w-0">
            
            {/* Column 1 (Gallery, Price Banner, & Product Details Box) */}
            <div className="lg:col-span-7 space-y-2 sm:space-y-2.5 min-w-0">
              {/* Prominent, Premium & Eye-Catching Price & Delivery Banner */}
              <div className="rounded-2xl bg-gradient-to-l from-[#8B5E3C]/[0.07] via-white to-[#8B5E3C]/[0.07] border-2 border-[#8B5E3C]/30 p-3 sm:px-5 sm:py-3.5 shadow-xs transition-all hover:border-[#8B5E3C]/50">
                <div className="flex items-center justify-between gap-3 sm:gap-6 flex-nowrap min-w-0">
                  {/* Price Section */}
                  <div className="flex items-baseline gap-1.5 sm:gap-2 shrink-0">
                    <span className="text-xs sm:text-sm font-extrabold text-gray-700">السعر:</span>
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-[#177773] tracking-tight drop-shadow-2xs">
                      {product.price.toLocaleString('en-US')}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-600 mr-0.5">
                      د.ع
                    </span>
                    {product.old_price && product.old_price > product.price && (
                      <span className="text-xs sm:text-sm text-gray-400 line-through mr-1.5 font-medium">
                        {product.old_price.toLocaleString('en-US')}
                      </span>
                    )}
                  </div>

                  {/* Badges Section (Delivery + Discount) */}
                  <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                    {discountPercentage && (
                      <span className="inline-flex items-center bg-[#8B5E3C] text-white text-[11px] sm:text-xs font-black px-2.5 py-1 rounded-xl shadow-2xs">
                        خصم {discountPercentage}%
                      </span>
                    )}
                    <div className="inline-flex items-center gap-1.5 bg-[#8B5E3C]/15 border border-[#8B5E3C]/30 text-[#177773] text-xs sm:text-sm font-black px-3 py-1.5 rounded-xl shadow-2xs">
                      <Truck className="w-4 h-4 text-[#8B5E3C] shrink-0" />
                      <span>توصيل مجاني</span>
                    </div>
                  </div>
                </div>
              </div>

              <ProductGallery
                images={product.images}
                mainImage={product.image}
                title={product.title}
              />

              {/* Product Details Box including Title, Trust Badges, & Provider Description */}
              <ProductDetailsBox
                title={product.title}
                description={product.description}
                features={product.features}
              />
            </div>

            {/* Column 2: DIRECT 1-STEP ORDER FORM (Sticky on desktop) */}
            <div id="order-form-container" className="lg:col-span-5 scroll-mt-4 mt-6 lg:mt-0 lg:sticky lg:top-4 min-w-0">
              <div className="w-full min-w-0">
                {/* Order Form Card */}
                <OrderForm
                  product={product}
                  onOrderSuccess={onOrderSuccess}
                />
              </div>
            </div>

          </div>

          {/* Section 3: 3-Steps Order Guide (Full Width Below Columns) */}
          <div className="min-w-0">
            <FunnelSteps />
          </div>

          {/* Section 4: FAQ Accordion (Full Width Below Columns) */}
          <div className="max-w-3xl mx-auto min-w-0">
            <div className="text-center mb-6 min-w-0">
              <h2 className="text-lg sm:text-2xl font-extrabold text-black break-words">
                الأسئلة الشائعة حول الطلب والتوصيل
              </h2>
            </div>
            <ProductFAQ />
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom CTA */}
      <StickyBottomBar
        productTitle={product.title}
        totalPrice={product.price}
        onScrollToOrder={scrollToOrder}
      />

      {/* Balanced, Clean & Concise Funnel Footer */}
      <footer id="funnel-footer" className="bg-gray-50/90 border-t border-gray-200/80 pt-8 pb-28 md:pb-10 mt-12 text-gray-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Top Row: Brand & Quick Trust Badges in a centered, balanced layout */}
          <div className="flex flex-col items-center justify-center gap-5 pb-5 border-b border-gray-200/70 text-center">
            {/* Brand (English Only, Centered & Stylized) */}
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex flex-col items-center justify-center cursor-pointer group focus:outline-none transition-all active:scale-98 text-center"
              title="PRESTEEL - العودة للرئيسية"
            >
              <span className="font-black text-2xl sm:text-3xl tracking-[0.18em] text-gray-900 group-hover:text-[#8B5E3C] transition-colors uppercase font-sans">
                TAMAM <span className="text-[#8B5E3C]">SHOP</span>
              </span>
              <span className="text-[11px] text-gray-400 font-medium mt-1">تسوق موثوق ومباشر في العراق 🇮🇶</span>
            </button>

            {/* Concise Trust Badges */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-center text-xs text-gray-700">
              <div className="flex items-center gap-1.5 bg-white border border-gray-200/80 px-3 py-1.5 rounded-xl shadow-2xs">
                <Truck className="w-3.5 h-3.5 text-[#8B5E3C]" />
                <span className="font-semibold text-xs">توصيل سريع</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-gray-200/80 px-3 py-1.5 rounded-xl shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-xs">معاينة قبل الدفع</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-gray-200/80 px-3 py-1.5 rounded-xl shadow-2xs">
                <Banknote className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-semibold text-xs">دفع عند الاستلام</span>
              </div>
            </div>
          </div>

          {/* Middle Row: Policy Navigation */}
          <div className="py-3.5 flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-xs text-gray-500 font-medium">
            <button
              type="button"
              onClick={() => onOpenPolicy('about')}
              className="hover:text-[#8B5E3C] transition-colors cursor-pointer py-1"
            >
              من نحن
            </button>
            <span className="text-gray-300 select-none">•</span>
            <button
              type="button"
              onClick={() => onOpenPolicy('returns')}
              className="hover:text-[#8B5E3C] transition-colors cursor-pointer py-1"
            >
              سياسة الاسترجاع والاستبدال
            </button>
            <span className="text-gray-300 select-none">•</span>
            <button
              type="button"
              onClick={() => onOpenPolicy('terms')}
              className="hover:text-[#8B5E3C] transition-colors cursor-pointer py-1"
            >
              الشروط والأحكام
            </button>
            <span className="text-gray-300 select-none">•</span>
            <button
              type="button"
              onClick={() => onOpenPolicy('privacy')}
              className="hover:text-[#8B5E3C] transition-colors cursor-pointer py-1"
            >
              سياسة الخصوصية
            </button>
          </div>

          {/* Bottom Copyright & Guarantee note */}
          <div className="pt-3 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400 text-center sm:text-right">
            <p>جميع الحقوق محفوظة © {new Date().getFullYear()} <span className="text-gray-600 font-semibold">برستيل</span></p>
            <p className="flex items-center justify-center gap-1.5 text-gray-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>تسوق آمن ومباشر 100% في العراق</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
