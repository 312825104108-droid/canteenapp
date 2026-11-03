import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Mail, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/ui/Button';
import { faqs } from '../../data/mockData';
import toast from 'react-hot-toast';

const FAQItem = ({ faq, isOpen, onToggle }) => (
  <div className="border-b border-surface-border last:border-0">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-bg transition-colors"
    >
      <span className="text-sm font-semibold text-ink-primary pr-4">{faq.question}</span>
      {isOpen ? (
        <ChevronUp size={18} className="stroke-ink-secondary flex-shrink-0" />
      ) : (
        <ChevronDown size={18} className="stroke-ink-secondary flex-shrink-0" />
      )}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-4 pb-4 text-sm text-ink-secondary leading-relaxed">
            {faq.answer}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const HelpScreen = () => {
  const navigate = useNavigate();
  const [openFaqId, setOpenFaqId] = useState(null);

  return (
    <div className="app-container">
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="header-gradient px-4 pt-12 pb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-white/70 rounded-full">
              <ArrowLeft size={20} className="stroke-ink-primary" />
            </button>
            <h1 className="text-xl font-bold text-ink-primary">Help & Support</h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24">
          {/* Quick actions */}
          <div className="mb-8">
            <h2 className="text-base font-bold text-ink-primary mb-3">Contact Us</h2>
            <div className="flex gap-3">
              <button
                onClick={() => toast('Opening email client...')}
                className="flex-1 flex flex-col items-center gap-2 p-4 border-2 border-surface-border rounded-card hover:border-primary-500 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail size={20} className="stroke-blue-500" />
                </div>
                <span className="text-xs font-semibold text-ink-primary">Email Us</span>
              </button>
              <button
                onClick={() => toast('Opening chat...')}
                className="flex-1 flex flex-col items-center gap-2 p-4 border-2 border-surface-border rounded-card hover:border-primary-500 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageCircle size={20} className="stroke-green-500" />
                </div>
                <span className="text-xs font-semibold text-ink-primary">Live Chat</span>
              </button>
            </div>
          </div>

          {/* FAQs */}
          <div>
            <h2 className="text-base font-bold text-ink-primary mb-3">Frequently Asked Questions</h2>
            <div className="bg-white border border-surface-border rounded-card overflow-hidden">
              {faqs.map(faq => (
                <FAQItem
                  key={faq.id}
                  faq={faq}
                  isOpen={openFaqId === faq.id}
                  onToggle={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
                />
              ))}
            </div>
          </div>

          {/* Report issue */}
          <div className="mt-8">
            <Button
              onClick={() => toast('Issue reporting form opened')}
              variant="outline"
              fullWidth
            >
              Report an Issue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpScreen;
