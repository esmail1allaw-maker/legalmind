import { useState } from 'react';
import { stripePromise } from '../lib/stripeClient';

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: 1,
          priceId: 'price_XXXXXX',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'فشل إنشاء جلسة الدفع');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe لم تُحمّل بعد');
      }

      // إعادة توجيه مباشرة إلى صفحة الدفع
      window.location.href = data.checkoutUrl || data.url;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="px-4 py-2 rounded bg-blue-600 text-white"
      >
        {loading ? 'جارٍ التحويل إلى الدفع...' : 'ادفع الآن'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
