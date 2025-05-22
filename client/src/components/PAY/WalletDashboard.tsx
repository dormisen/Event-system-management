import { useState, useEffect } from 'react';
import { useAuth } from '../../context/Authcontext';
import API from '../../api/axios';
import { AxiosError } from 'axios';
import { WalletCard } from './WalletCard';
import LoadingSpinner from '.././AD_co/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';

export const WalletDashboard = () => {
     const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchWalletData = async () => {
        try {
            const [balanceRes, transactionsRes] = await Promise.all([
                API.get('/wallet'),
                API.get('/transactions')
            ]);
            setBalance(balanceRes.data.balance);
            setTransactions(transactionsRes.data);
        } catch (error) {
            toast.error('Failed to load wallet data');
        } finally {
            setLoading(false);
        }
    };

    const handlePayout = async () => {
        try {
            await API.post('/payment/payout', { amount: balance });
            toast.success('Payout request submitted!');
        } catch (error) {
            const axiosError = error as AxiosError<{ error: string }>;
            toast.error(axiosError.response?.data?.error || 'Payout failed');
        }
    };

    useEffect(() => {
        if (user?.role === 'organizer') fetchWalletData();
    }, [user]);

    if (loading) return <LoadingSpinner />;

    const chartData = transactions.map(tx => ({
        date: format(new Date(tx.createdAt), 'MMM dd'),
        amount: tx.amount
    }));

    return (
        <div className="space-y-6">
            <WalletCard balance={balance} />

            <div className="bg-white p-6 rounded-xl shadow-sm">
                {/* Payout Section */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-semibold">Payout Management</h3>
                        {balance < 50 && (
                            <p className="text-sm text-blue-600 mt-1">
                                Minimum $50 required for payout
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handlePayout}
                        disabled={balance < 50}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                            balance >= 50 
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        Request Payout
                    </button>
                </div>

                {/* Payout History Chart */}
                <div className="mb-8">
                    <h4 className="text-lg font-semibold mb-4">Payout History</h4>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#8884d8"
                                    fill="#8884d8"
                                    name="Payout Amount"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="pt-6 border-t border-gray-100">
                    <h3 className="text-xl font-semibold mb-4">Transaction History</h3>
                    <div className="space-y-4">
                        {transactions.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                No transactions found
                            </div>
                        ) : (
                            transactions.map((tx) => (
                                <div
                                    key={tx._id}
                                    className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {tx.type === 'payment' 
                                                ? 'Event Payment' 
                                                : 'Funds Payout'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                    </div>
                                    <div
                                        className={`text-${
                                            tx.type === 'payout' ? 'red' : 'green'
                                        }-600 font-semibold`}
                                    >
                                        {tx.type === 'payout' ? '-' : '+'}${tx.amount.toFixed(2)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};