export const PaymentMethodSelector = ({ onMethodSelect }: { onMethodSelect: (method: 'stripe') => void }) => (
  <div className="mb-6 space-y-4">
    <h4 className="text-lg font-semibold text-gray-900">Select Payment Method</h4>
    <div className="flex flex-col gap-3">
      <button
        className="p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-500 bg-white transition-all shadow-sm hover:shadow-md"
        onClick={() => onMethodSelect('stripe')}
      >
        <div className="flex items-center gap-3">
          <img 
            src="/stripe-logo.svg" 
            alt="Stripe" 
            className="h-6 w-auto" 
            aria-hidden="true"
          />
          <div className="text-left">
            <p className="font-medium text-gray-900">Credit/Debit Card</p>
            <p className="text-sm text-gray-500">Secure payment processing by Stripe</p>
          </div>
        </div>
      </button>
    </div>
    <div className="mt-4 flex items-center text-gray-500">
      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-xs">Your payment is securely processed. We never store card details.</span>
    </div>
  </div>
);