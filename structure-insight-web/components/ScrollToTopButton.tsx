import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalization } from '../hooks/useLocalization';

interface ScrollToTopButtonProps {
  targetRef: React.RefObject<HTMLElement>;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ targetRef }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const { t } = useLocalization();

  React.useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const toggleVisibility = () => {
      if (target.scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    target.addEventListener('scroll', toggleVisibility);
    return () => target.removeEventListener('scroll', toggleVisibility);
  }, [targetRef]);

  const scrollToTop = () => {
    targetRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 md:bottom-6 md:right-6 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-20"
          aria-label={t('scroll_to_top')}
          title={t('scroll_to_top')}
        >
          <i className="fa-solid fa-arrow-up"></i>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTopButton;