
import React from 'react';

// Custom hook for window size
export function useWindowSize() {
    const [size, setSize] = React.useState({ width: window.innerWidth, height: window.innerHeight });
    React.useEffect(() => {
        const handleResize = () => {
            setSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return size;
}
