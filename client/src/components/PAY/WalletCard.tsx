import { FiDollarSign, FiArrowUpRight, FiArrowDownLeft } from 'react-icons/fi';

export const WalletCard = ({ balance }: { balance: number }) => (
  <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-6 rounded-xl text-white">
    <div className="flex justify-between items-center">
      <div>
        <p className="opacity-75">Available Balance</p>
        <h2 className="text-3xl font-bold mt-2">${balance.toFixed(2)}</h2>
      </div>
      <FiDollarSign className="w-12 h-12 opacity-75" />
    </div>
    <div className="flex gap-4 mt-6">
      <div className="flex items-center gap-2">
        <FiArrowUpRight className="w-5 h-5" />
        <span>Income</span>
      </div>
      <div className="flex items-center gap-2">
        <FiArrowDownLeft className="w-5 h-5" />
        <span>Payouts</span>
      </div>
    </div>
  </div>
);