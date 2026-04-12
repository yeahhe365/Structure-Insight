import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollToTopButtonProps {
  targetRef: React.RefObject<HTMLElement | null>;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ targetRef }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const checkAndAttach = () => {
      const target = targetRef.current;
      if (!target) return undefined;

      const toggleVisibility = () => {
        setIsVisible(target.scrollTop > 300);
      };

      target.addEventListener('scroll', toggleVisibility);
      toggleVisibility();

      // Return cleanup function stored for later
      return () => target.removeEventListener('scroll', toggleVisibility);
    };

    let cleanup: (() => void) | undefined = checkAndAttach();

    if (!cleanup) {
      // Use MutationObserver to detect when the element appears in the DOM
      const observer = new MutationObserver(() => {
        const result = checkAndAttach();
        if (result) {
          cleanup = result;
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      return () => {
        observer.disconnect();
        cleanup?.();
      };
    }

    return cleanup;
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
          className="fixed bottom-32 right-6 md:bottom-6 md:right-6 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center z-20"
          aria-label="滚动到顶部"
          title="滚动到顶部"
        >
          <i className="fa-solid fa-arrow-up"></i>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default React.memo(ScrollToTopButton);
