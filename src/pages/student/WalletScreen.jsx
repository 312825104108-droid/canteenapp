import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../../components/layout/PageLayout';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import toast from 'react-hot-toast';

const TopUpModal = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const { updateWalletBalance } = useAuthStore();
  const { addTransaction } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const quickAmounts = [50, 100, 200, 500];

  const handleTopUp = async () => {
    const val = parseFloat(amount);
    if (!val || val < 10) {
      toast.error('Minimum top-up is ₹10');
      return;
    }
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    updateWalletBalance(val);
    addTransaction({
      type: 'credit',
      amount: val,
      description: 'Wallet Top-up via UPI',
      date: new Date().toISOString(),
    });
    toast.success(`₹${val.toFixed(2)} added to wallet`);
    setIsProcessing(false);
    onClose();
    setAmount('');
  };

  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-[24px] z-50 p-6 pb-8"
      >
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <h2 className="text-xl font-bold text-ink-primary mb-4">Add Money to Wallet</h2>

        <div className="mb-4">
          <label className="text-sm font-semibold text-ink-secondary mb-2 block">Enter Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-ink-primary">₹</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="100"
              className="w-full h-14 pl-10 pr-4 border-2 border-surface-border rounded-card text-lg font-bold text-ink-primary"
              style={{ outline: 'none', boxShadow: 'none' }}
              onFocus={(e) => { e.target.style.borderColor = '#0066FF'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E6E6E6'; }}
            />
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-ink-secondary mb-2">Quick amounts</p>
          <div className="flex gap-2">
            {quickAmounts.map(amt => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className="flex-1 py-2.5 border-2 border-surface-border rounded-card text-sm font-bold text-ink-primary hover:border-primary-500 transition-colors"
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleTopUp} loading={isProcessing} disabled={!amount} className="flex-1">
            Add Money
          </Button>
        </div>
      </motion.div>
    </>
  );
};

export const WalletScreen = () => {
  const { user } = useAuthStore();
  const { transactions } = useAppStore();
  const [showTopUp, setShowTopUp] = useState(false);

  return (
    <PageLayout showBottomNav>
      {/* Header */}
      <div className="bg-primary-gradient px-4 pt-12 pb-8 flex-shrink-0">
        <h1 className="text-2xl font-bold text-white mb-6">Campus Wallet</h1>

        {/* Balance card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/30 rounded-card p-5">
          <p className="text-white/80 text-sm mb-1">Available Balance</p>
          <p className="text-4xl font-extrabold text-white mb-4">₹{user?.walletBalance?.toFixed(2) || '0.00'}</p>
          <Button
            onClick={() => setShowTopUp(true)}
            variant="secondary"
            size="sm"
            icon={<Plus size={16} />}
            className="bg-white text-ink-primary"
          >
            Add Money
          </Button>
        </div>
      </div>

      {/* Transactions */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24">
        <h2 className="text-lg font-bold text-ink-primary mb-3">Transactions</h2>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-ink-secondary text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map(txn => (
              <motion.div
                key={txn.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-surface-border rounded-card p-4 flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                  ${txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {txn.type === 'credit' ? (
                    <ArrowDownRight size={18} className="stroke-success" />
                  ) : (
                    <ArrowUpRight size={18} className="stroke-error" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-primary">{txn.description}</p>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    {new Date(txn.date).toLocaleDateString()} · {new Date(txn.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <p className={`text-base font-bold ${txn.type === 'credit' ? 'text-success' : 'text-error'}`}>
                    {txn.type === 'credit' ? '+' : '−'}₹{txn.amount.toFixed(2)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showTopUp && <TopUpModal isOpen={showTopUp} onClose={() => setShowTopUp(false)} />}
      </AnimatePresence>
    </PageLayout>
  );
};

export default WalletScreen;
